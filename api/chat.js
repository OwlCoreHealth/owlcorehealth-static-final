import { getSymptomContext } from "./notion.mjs"; 

// Configuração da API OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "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"; // Substitua pela sua chave API ou use variável de ambiente
const GPT_MODEL = "gpt-4o-mini"; // Modelo GPT-4o mini

let sessionMemory = {
  sintomasDetectados: [],
  respostasUsuario: [],
  nome: "",
  idioma: "pt",
  sintomaAtual: null,
  categoriaAtual: null,
  contadorPerguntas: {},
  ultimasPerguntas: [],
  funnelPhase: 1,
  usedQuestions: [] // Rastreia todas as perguntas já usadas para evitar repetição
};

// Função para chamar o GPT-4o mini
async function callGPT4oMini(prompt, context, userMessage) {
  try {
    console.log("Iniciando chamada ao GPT-4o mini...");
    
    // Adicionar timeout para evitar bloqueios longos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: GPT_MODEL,
        messages: [
          {
            role: "system",
            content: `Você é Owl Savage, um assistente de saúde com personalidade sarcástica, direta e provocadora.
            Você fornece explicações científicas em linguagem acessível e guia os usuários através de um funil de conversão.
            
            Fase atual do funil: ${context.funnelPhase}
            Sintoma relatado: ${context.symptom}
            Idioma: ${context.language}
            Nome do usuário: ${context.userName || 'não fornecido'}
            
            Regras importantes:
            1. Mantenha o tom sarcástico e provocador
            2. SEMPRE personalize a resposta usando o nome do usuário quando disponível
            3. Mantenha a resposta no idioma ${context.language === 'pt' ? 'português' : 'inglês'}
            4. Siga a estrutura do funil para a fase ${context.funnelPhase}:
               - Fase 1: Explicação científica simples + soluções rápidas
               - Fase 2: Consequências se não tomar cuidados
               - Fase 3: O que está realmente arriscando (agravamento)
               - Fase 4: Nutrientes e plantas naturais
               - Fase 5: Suplemento como solução completa
               - Fase 6: Plano B (abordagem alternativa)
            5. NUNCA use símbolos # ou markdown em suas respostas`
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    if (data.error) {
      console.error("Erro na API do GPT:", data.error);
      return null;
    }
    
    console.log("Resposta do GPT recebida com sucesso!");
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Erro ao chamar GPT-4o mini:", error);
    return null;
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed. Use POST." });
    }

    const { message, name, age, sex, weight, selectedQuestion } = req.body;
    if (!message && !selectedQuestion) {
      return res.status(400).json({ error: "No message or selected question provided." });
    }

    // Usar a pergunta selecionada se disponível, caso contrário usar a mensagem do usuário
    const userInput = selectedQuestion || message;
    
    // Detectar idioma - manter o idioma anterior se já existir
    const isPortuguese = /[ãõçáéíóú]| você|dor|tenho|problema|saúde/i.test(userInput);
    const idioma = sessionMemory.idioma || (isPortuguese ? "pt" : "en");
    
    const userName = name?.trim() || "";
    const userAge = parseInt(age);
    const userSex = (sex || "").toLowerCase();
    const userWeight = parseFloat(weight);
    const hasForm = userName && !isNaN(userAge) && userSex && !isNaN(userWeight);

    sessionMemory.nome = userName;
    sessionMemory.idioma = idioma;
    sessionMemory.respostasUsuario.push(userInput);

    // Obter contexto do sintoma do Notion
    const symptomContext = await getSymptomContext(userInput, userName);
    
    // Atualizar a memória da sessão com o sintoma detectado
    if (symptomContext.sintoma) {
      sessionMemory.sintomaAtual = symptomContext.sintoma;
    }
    
    // Determinar a fase atual do funil (incrementar a cada interação, máximo 6)
    const currentFunnelPhase = Math.min(sessionMemory.funnelPhase || 1, 6);
    console.log(`Fase atual do funil: ${currentFunnelPhase}`);
    
    // Garantir que as perguntas não se repitam
    if (symptomContext.followupQuestions && symptomContext.followupQuestions.length > 0) {
      // Filtrar perguntas já utilizadas
      const uniqueQuestions = symptomContext.followupQuestions.filter(question => 
        !sessionMemory.usedQuestions || !sessionMemory.usedQuestions.includes(question)
      );
      
      // Se não houver perguntas únicas suficientes, gerar novas perguntas específicas para a fase atual
      if (uniqueQuestions.length < 3) {
        const phaseSpecificQuestions = generatePhaseSpecificQuestions(currentFunnelPhase, idioma, symptomContext.sintoma);
        
        // Filtrar apenas as perguntas específicas que ainda não foram usadas
        const newUniqueQuestions = phaseSpecificQuestions.filter(question => 
          !sessionMemory.usedQuestions || !sessionMemory.usedQuestions.includes(question)
        );
        
        // Adicionar novas perguntas únicas até completar 3 ou esgotar as opções
        while (uniqueQuestions.length < 3 && newUniqueQuestions.length > 0) {
          const newQuestion = newUniqueQuestions.shift();
          uniqueQuestions.push(newQuestion);
        }
      }
      
      // Limitar a 3 perguntas
      symptomContext.followupQuestions = uniqueQuestions.slice(0, 3);
    }
    
    // Tentar obter resposta do GPT-4o mini
    let gptResponse = null;
    try {
      // Preparar contexto para o GPT
      const gptContext = {
        userName: userName,
        symptom: symptomContext.sintoma || "sintomas gerais",
        language: idioma,
        funnelPhase: currentFunnelPhase
      };

      console.log("Tentando obter resposta do GPT-4o mini...");
      gptResponse = await callGPT4oMini(
        "Responda ao usuário de forma personalizada, seguindo a fase do funil",
        gptContext,
        userInput
      );
      console.log("Resposta do GPT obtida:", gptResponse ? "Sim" : "Não");
    } catch (gptError) {
      console.error("Erro ao chamar GPT-4o mini:", gptError);
      gptResponse = null;
    }

    // Construir a resposta formatada com explicação científica e perguntas clicáveis
    let responseContent;
    if (gptResponse) {
      console.log("Usando resposta do GPT");
      responseContent = formatGPTResponse(gptResponse, symptomContext, idioma);
    } else {
      console.log("Usando fallback com conteúdo rico");
      responseContent = formatResponse(symptomContext, idioma);
    }
    
    // Rastrear perguntas usadas para evitar repetição
    if (symptomContext.followupQuestions && symptomContext.followupQuestions.length > 0) {
      sessionMemory.ultimasPerguntas = symptomContext.followupQuestions;
      sessionMemory.usedQuestions = [...sessionMemory.usedQuestions, ...symptomContext.followupQuestions];
    }
    
    // Incrementar a fase do funil para a próxima interação
    sessionMemory.funnelPhase = Math.min(currentFunnelPhase + 1, 6);

    // Enviar a resposta para o frontend
    return res.status(200).json({
      choices: [{ 
        message: { 
          content: responseContent,
          followupQuestions: symptomContext.followupQuestions 
        } 
      }]
    });

  } catch (err) {
    console.error("Internal server error:", err.message);
    
    // Determinar o idioma para o fallback
    const fallbackIdioma = sessionMemory.idioma || (userInput && /[ãõçáéíóúê]|(\s|^)(você|dor|tenho|problema|saúde)(\s|$)/i.test(userInput) ? "pt" : "en");
    
    // Personalizar a mensagem de fallback com o nome do usuário ou referência à mensagem
    let fallbackIntro = "";
    if (userName) {
      fallbackIntro = fallbackIdioma === "pt" 
        ? `${userName}, ` 
        : `${userName}, `;
    } else if (userInput) {
      // Extrair uma parte da mensagem do usuário para personalizar o fallback
      const userWords = userInput.split(/\s+/).filter(w => w.length > 3).slice(0, 3);
      if (userWords.length > 0) {
        fallbackIntro = fallbackIdioma === "pt"
          ? `Sobre "${userWords.join(' ')}", `
          : `About "${userWords.join(' ')}", `;
      }
    }
    
    // Conteúdo do fallback personalizado e no estilo Owl Savage
    const fallbackContent = fallbackIdioma === "pt"
      ? `${fallbackIntro}vou ser direto com você. Seu corpo está tentando te dizer algo importante, e você está ignorando como se fosse spam no email.

Vamos tentar de novo? Escolha uma das opções abaixo para eu poder te ajudar de verdade:`
      : `${fallbackIntro}let me be straight with you. Your body is trying to tell you something important, and you're ignoring it like spam in your email.

Let's try again? Choose one of the options below so I can really help you:`;

    // Gerar perguntas de fallback que não repitam as anteriores
    const fallbackQuestions = fallbackIdioma === "pt"
      ? [
          "Pode descrever melhor o que está sentindo?",
          "Há quanto tempo está com esse problema?",
          "Quer saber mais sobre como resolver isso?"
        ]
      : [
          "Can you better describe what you're feeling?",
          "How long have you had this problem?",
          "Want to know more about how to solve this?"
        ];
    
    // Garantir que as perguntas não se repitam
    const uniqueFallbackQuestions = fallbackQuestions.filter(q => 
      !sessionMemory.usedQuestions || !sessionMemory.usedQuestions.includes(q)
    ).slice(0, 3);
    
    // Se não houver perguntas únicas suficientes, adicionar genéricas
    while (uniqueFallbackQuestions.length < 3) {
      const genericQuestion = fallbackIdioma === "pt"
        ? `Quer tentar de outra forma? (${uniqueFallbackQuestions.length + 1})`
        : `Want to try another way? (${uniqueFallbackQuestions.length + 1})`;
      
      if (!uniqueFallbackQuestions.includes(genericQuestion)) {
        uniqueFallbackQuestions.push(genericQuestion);
      }
    }
    
    // Atualizar perguntas usadas
    if (sessionMemory.usedQuestions) {
      sessionMemory.usedQuestions = [...sessionMemory.usedQuestions, ...uniqueFallbackQuestions];
    } else {
      sessionMemory.usedQuestions = [...uniqueFallbackQuestions];
    }
    
    // Resposta de erro com fallback rico para garantir que o frontend não quebre
    return res.status(200).json({
      choices: [{ 
        message: { 
          content: fallbackContent,
          followupQuestions: uniqueFallbackQuestions
        } 
      }]
    });
  }
}

// Função para gerar perguntas específicas para cada fase do funil
function generatePhaseSpecificQuestions(phase, idioma, sintoma) {
  const questions = {
    pt: {
      1: [
        "Como tem sido a qualidade do seu sono?",
        "Já tentou algum remédio caseiro para aliviar isso?",
        "Há quanto tempo está sentindo isso?",
        "Esses sintomas pioram em algum momento específico do dia?",
        "Já conversou com alguém sobre isso?"
      ],
      2: [
        "Quer saber o que pode acontecer se esses sintomas persistirem?",
        "Conhece alguém que teve problemas semelhantes?",
        "Já pensou nas consequências a longo prazo?",
        "Tem ideia do que pode estar causando isso?",
        "Já considerou que isso pode ser mais sério do que parece?"
      ],
      3: [
        "Sabia que isso pode afetar sua qualidade de vida permanentemente?",
        "Já pensou no impacto que isso tem no seu dia a dia?",
        "Está disposto a fazer mudanças para resolver isso?",
        "Tem noção do risco que está correndo ao ignorar esses sinais?",
        "Já imaginou como seria sua vida sem esse problema?"
      ],
      4: [
        "Conhece os nutrientes que seu corpo precisa para combater isso?",
        "Já experimentou alguma planta medicinal para esse problema?",
        "Sua alimentação tem os nutrientes necessários para sua recuperação?",
        "Sabia que certos alimentos podem piorar esses sintomas?",
        "Já ouviu falar dos benefícios do magnésio e ômega-3 para esse caso?"
      ],
      5: [
        "Gostaria de conhecer um suplemento que resolve esse problema?",
        "Já considerou usar suplementos para equilibrar seu organismo?",
        "Sabia que existe uma solução completa para esse problema?",
        "Prefere uma solução rápida ou está disposto a esperar meses por resultados?",
        "Já tentou algum suplemento específico para isso?"
      ],
      6: [
        "Se não quiser usar suplementos, está disposto a mudar completamente sua alimentação?",
        "Quanto tempo por dia pode dedicar a cuidar da sua saúde?",
        "Prefere uma abordagem natural ou mais convencional?",
        "Já considerou consultar um especialista sobre isso?",
        "Está pronto para fazer uma mudança radical no seu estilo de vida?"
      ]
    },
    en: {
      1: [
        "How has your sleep quality been?",
        "Have you tried any home remedies to alleviate this?",
        "How long have you been feeling this way?",
        "Do these symptoms get worse at any specific time of day?",
        "Have you talked to anyone about this?"
      ],
      2: [
        "Want to know what can happen if these symptoms persist?",
        "Do you know anyone who has had similar problems?",
        "Have you thought about the long-term consequences?",
        "Do you have any idea what might be causing this?",
        "Have you considered that this might be more serious than it seems?"
      ],
      3: [
        "Did you know this can permanently affect your quality of life?",
        "Have you thought about the impact this has on your daily life?",
        "Are you willing to make changes to solve this?",
        "Do you realize the risk you're taking by ignoring these signs?",
        "Have you imagined what your life would be like without this problem?"
      ],
      4: [
        "Do you know the nutrients your body needs to combat this?",
        "Have you tried any medicinal plants for this problem?",
        "Does your diet have the necessary nutrients for your recovery?",
        "Did you know certain foods can worsen these symptoms?",
        "Have you heard about the benefits of magnesium and omega-3 for this case?"
      ],
      5: [
        "Would you like to know about a supplement that solves this problem?",
        "Have you considered using supplements to balance your body?",
        "Did you know there's a complete solution for this problem?",
        "Do you prefer a quick solution or are you willing to wait months for results?",
        "Have you tried any specific supplement for this?"
      ],
      6: [
        "If you don't want to use supplements, are you willing to completely change your diet?",
        "How much time per day can you dedicate to taking care of your health?",
        "Do you prefer a natural or more conventional approach?",
        "Have you considered consulting a specialist about this?",
        "Are you ready to make a radical change in your lifestyle?"
      ]
    }
  };
  
  // Selecionar as perguntas para a fase e idioma corretos
  const phaseQuestions = questions[idioma][phase] || questions[idioma][1];
  
  // Embaralhar as perguntas para variedade
  return shuffleArray([...phaseQuestions]);
}

// Função auxiliar para embaralhar array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Função para formatar a resposta do GPT
function formatGPTResponse(gptResponse, symptomContext, idioma) {
  // Se não houver resposta do GPT, retornar null para usar o fallback
  if (!gptResponse) return null;
  
  const { followupQuestions } = symptomContext;
  
  // Personalizar a resposta com o nome do usuário ou referência à mensagem
  let personalizedResponse = gptResponse;
  if (sessionMemory.nome) {
    // Se temos o nome do usuário, garantir que está sendo usado
    const userName = sessionMemory.nome;
    if (idioma === "pt" && !personalizedResponse.includes(userName)) {
      personalizedResponse = personalizedResponse.replace(/amigo|cara|você/i, userName);
    } else if (idioma === "en" && !personalizedResponse.includes(userName)) {
      personalizedResponse = personalizedResponse.replace(/friend|buddy|pal|you/i, userName);
    }
  } else if (sessionMemory.respostasUsuario && sessionMemory.respostasUsuario.length > 0) {
    // Se não temos o nome, usar referência à última mensagem
    const lastMessage = sessionMemory.respostasUsuario[sessionMemory.respostasUsuario.length - 1];
    const userWords = lastMessage.split(/\s+/).filter(w => w.length > 3).slice(0, 2);
    if (userWords.length > 0) {
      const reference = userWords.join(' ');
      if (idioma === "pt" && !personalizedResponse.includes(reference)) {
        personalizedResponse = personalizedResponse.replace(/amigo|cara|você/i, `sobre "${reference}"`);
      } else if (idioma === "en" && !personalizedResponse.includes(reference)) {
        personalizedResponse = personalizedResponse.replace(/friend|buddy|pal|you/i, `about "${reference}"`);
      }
    }
  }
  
  // Título da seção de perguntas - sem usar símbolos # que afetam leitura por áudio
  const questionsTitle = idioma === "pt" ? "Vamos explorar mais:" : "Let's explore further:";
  
  // Texto de instrução para as perguntas
  const instructionText = idioma === "pt" 
    ? "Escolha uma das opções abaixo para continuarmos:" 
    : "Choose one of the options below to continue:";
  
  // Construir a resposta formatada
  let response = `${personalizedResponse}\n\n${questionsTitle}\n${instructionText}\n\n`;
  
  // Adicionar perguntas clicáveis
  followupQuestions.forEach((question, index) => {
    // Criar um data attribute com a pergunta codificada para ser capturada pelo JavaScript do frontend
    response += `<div class="clickable-question" data-question="${encodeURIComponent(question)}" onclick="handleQuestionClick(this)">
      ${index + 1}. ${question}
    </div>\n`;
  });
  
  return response;
}

// Função para formatar a resposta com explicação científica e perguntas clicáveis
function formatResponse(symptomContext, idioma) {
  const { intro, scientificExplanation, followupQuestions } = symptomContext;
  
  // Determinar a fase atual do funil
  const currentFunnelPhase = Math.min(sessionMemory.funnelPhase || 1, 6);
  
  // Personalizar a introdução com o nome do usuário ou referência à mensagem
  let personalizedIntro = intro;
  if (sessionMemory.nome) {
    // Se temos o nome do usuário, personalizar a introdução
    const userName = sessionMemory.nome;
    if (idioma === "pt") {
      personalizedIntro = intro.replace(/amigo/gi, userName);
    } else {
      personalizedIntro = intro.replace(/friend|buddy|pal/gi, userName);
    }
  } else if (sessionMemory.respostasUsuario && sessionMemory.respostasUsuario.length > 0) {
    // Se não temos o nome, usar referência à última mensagem
    const lastMessage = sessionMemory.respostasUsuario[sessionMemory.respostasUsuario.length - 1];
    const userWords = lastMessage.split(/\s+/).filter(w => w.length > 3).slice(0, 2);
    if (userWords.length > 0) {
      const reference = userWords.join(' ');
      if (idioma === "pt") {
        if (!personalizedIntro.includes(reference)) {
          personalizedIntro = personalizedIntro.replace(/amigo/i, `sobre "${reference}"`);
        }
      } else {
        if (!personalizedIntro.includes(reference)) {
          personalizedIntro = personalizedIntro.replace(/friend|buddy|pal/i, `about "${reference}"`);
        }
      }
    }
  }
  
  // Título da seção científica - sem usar símbolos # que afetam leitura por áudio
  const scientificTitle = idioma === "pt" ? "Análise Científica:" : "Scientific Analysis:";
  
  // Título da seção de perguntas
  const questionsTitle = idioma === "pt" ? "Vamos explorar mais:" : "Let's explore further:";
  
  // Texto de instrução para as perguntas
  const instructionText = idioma === "pt" 
    ? "Escolha uma das opções abaixo para continuarmos:" 
    : "Choose one of the options below to continue:";
  
  // Conteúdo específico para cada fase do funil
  let phaseContent = "";
  if (idioma === "pt") {
    switch(currentFunnelPhase) {
      case 1:
        phaseContent = `${scientificExplanation}\n\nExistem soluções rápidas que podem ajudar a aliviar esses sintomas temporariamente, mas é importante entender a causa raiz.`;
        break;
      case 2:
        phaseContent = `${scientificExplanation}\n\nSe você continuar ignorando esses sinais, as consequências podem ser sérias. Muitas pessoas acabam desenvolvendo condições crônicas porque não deram atenção aos primeiros sinais de alerta.`;
        break;
      case 3:
        phaseContent = `O que você está realmente arriscando é muito mais grave do que imagina. Esses sintomas podem evoluir para problemas crônicos que afetam sua qualidade de vida diariamente. Estudos mostram que 68% das pessoas que ignoram esses sinais acabam com problemas de saúde mais sérios em menos de um ano.`;
        break;
      case 4:
        phaseContent = `Seu corpo precisa de nutrientes específicos para funcionar corretamente. Vitaminas do complexo B, magnésio, ômega-3 e antioxidantes são essenciais para combater esses sintomas. Plantas como valeriana, camomila e ashwagandha também podem ajudar a equilibrar seu sistema.`;
        break;
      case 5:
        phaseContent = `A solução mais completa seria um suplemento que combine todos os nutrientes e extratos de plantas que seu corpo precisa. Um bom suplemento multifuncional pode fornecer o equilíbrio perfeito de vitaminas, minerais e fitonutrientes para resolver esse problema pela raiz.`;
        break;
      case 6:
        phaseContent = `Se você não quiser usar suplementos, uma alternativa é reformular completamente sua alimentação e estilo de vida. Isso exigirá muito mais disciplina e tempo, mas também pode trazer resultados. O importante é não continuar ignorando esses sinais que seu corpo está enviando.`;
        break;
      default:
        phaseContent = scientificExplanation;
    }
  } else {
    switch(currentFunnelPhase) {
      case 1:
        phaseContent = `${scientificExplanation}\n\nThere are quick solutions that can help alleviate these symptoms temporarily, but it's important to understand the root cause.`;
        break;
      case 2:
        phaseContent = `${scientificExplanation}\n\nIf you continue ignoring these signals, the consequences can be serious. Many people end up developing chronic conditions because they didn't pay attention to the first warning signs.`;
        break;
      case 3:
        phaseContent = `What you're really risking is much more serious than you imagine. These symptoms can evolve into chronic problems that affect your quality of life daily. Studies show that 68% of people who ignore these signs end up with more serious health problems in less than a year.`;
        break;
      case 4:
        phaseContent = `Your body needs specific nutrients to function properly. B-complex vitamins, magnesium, omega-3, and antioxidants are essential to combat these symptoms. Plants like valerian, chamomile, and ashwagandha can also help balance your system.`;
        break;
      case 5:
        phaseContent = `The most complete solution would be a supplement that combines all the nutrients and plant extracts your body needs. A good multifunctional supplement can provide the perfect balance of vitamins, minerals, and phytonutrients to solve this problem at its root.`;
        break;
      case 6:
        phaseContent = `If you don't want to use supplements, an alternative is to completely reformulate your diet and lifestyle. This will require much more discipline and time, but it can also bring results. The important thing is not to continue ignoring these signals your body is sending.`;
        break;
      default:
        phaseContent = scientificExplanation;
    }
  }
  
  // Construir a resposta formatada
  let response = `${personalizedIntro}\n\n${scientificTitle}\n${phaseContent}\n\n${questionsTitle}\n${instructionText}\n\n`;
  
  // Adicionar perguntas clicáveis
  followupQuestions.forEach((question, index) => {
    // Criar um data attribute com a pergunta codificada para ser capturada pelo JavaScript do frontend
    response += `<div class="clickable-question" data-question="${encodeURIComponent(question)}" onclick="handleQuestionClick(this)">
      ${index + 1}. ${question}
    </div>\n`;
  });
  
  return response;
}

// Adicione este script ao seu HTML ou como um arquivo JavaScript separado
/*
<script>
  function handleQuestionClick(element) {
    const question = decodeURIComponent(element.getAttribute('data-question'));
    
    // Adicionar a pergunta selecionada ao campo de entrada
    document.getElementById('message-input').value = question;
    
    // Ou enviar diretamente para o backend
    fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        selectedQuestion: question,
        name: sessionStorage.getItem('userName') || '',
        age: sessionStorage.getItem('userAge') || '',
        sex: sessionStorage.getItem('userSex') || '',
        weight: sessionStorage.getItem('userWeight') || ''
      }),
    })
    .then(response => response.json())
    .then(data => {
      // Processar a resposta e atualizar a interface
      displayBotResponse(data.choices[0].message.content);
    })
    .catch(error => {
      console.error('Error:', error);
    });
  }
  
  // Função para estilizar as perguntas clicáveis
  document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
      .clickable-question {
        padding: 10px 15px;
        margin: 5px 0;
        background-color: #f0f7ff;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .clickable-question:hover {
        background-color: #d0e5ff;
      }
    `;
    document.head.appendChild(style);
  });
</script>
*/
