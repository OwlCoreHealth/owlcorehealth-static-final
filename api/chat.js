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
  // Perguntas estratégicas que guiam o usuário para a próxima fase do funil
  // Cada fase tem perguntas completamente distintas que conduzem para a próxima etapa
  const questions = {
    pt: {
      1: [ // Fase 1: Perguntas para entender o problema e levar à fase de consequências
        "Como tem sido a qualidade do seu sono ultimamente?",
        "Esse problema interfere nas suas atividades diárias?",
        "Já notou algum padrão em quando esses sintomas aparecem?",
        "Esse sintoma surgiu de repente ou foi gradual?",
        "Existe algum fator que parece piorar ou melhorar o que você sente?"
      ],
      2: [ // Fase 2: Perguntas para criar consciência das consequências e levar à fase de agravamento
        "Quer saber o que acontece quando esses sintomas são ignorados por muito tempo?",
        "Já conheceu alguém que teve problemas semelhantes e ignorou os sinais?",
        "Sabia que esse problema pode estar conectado a outros sistemas do seu corpo?",
        "Já pensou em como isso pode estar afetando sua produtividade diária?",
        "Tem ideia de quanto tempo seu corpo aguenta esse desequilíbrio antes de colapsar?"
      ],
      3: [ // Fase 3: Perguntas para mostrar riscos graves e levar à fase de nutrientes
        "Está ciente de como esse problema pode se transformar em algo crônico?",
        "Já considerou os efeitos a longo prazo desse desequilíbrio no seu organismo?",
        "Quer entender o que realmente está acontecendo dentro do seu corpo agora?",
        "Sabia que esse sintoma pode ser apenas a ponta do iceberg de um problema maior?",
        "Está disposto a fazer algumas mudanças para evitar complicações sérias?"
      ],
      4: [ // Fase 4: Perguntas sobre nutrientes para levar à fase de suplementos
        "Sabia que existem plantas medicinais específicas para esse problema?",
        "Sua alimentação atual fornece todos os nutrientes que seu corpo precisa?",
        "Já ouviu falar sobre os compostos bioativos que combatem esse sintoma?",
        "Conseguiria incluir 7-9 alimentos específicos na sua dieta diariamente?",
        "Quer conhecer quais nutrientes são essenciais para resolver esse desequilíbrio?"
      ],
      5: [ // Fase 5: Perguntas sobre suplementos para levar à decisão final
        "Prefere uma solução natural concentrada ou continuar lidando com os sintomas?",
        "Quanto tempo você acha razoável esperar para ver resultados?",
        "Já imaginou como seria sua vida sem esse problema te incomodando?",
        "Quer conhecer a solução que combina todos esses nutrientes em uma única dose?",
        "O que seria mais valioso para você: resolver o problema rapidamente ou economizar dinheiro?"
      ],
      6: [ // Fase 6: Perguntas para direcionar à decisão de compra do suplemento
        "Gostaria de conhecer o suplemento que contém todos esses nutrientes essenciais?",
        "Prefere ver primeiro as avaliações de outras pessoas que usaram esse suplemento?",
        "Quer conhecer a ciência por trás da formulação desse suplemento?",
        "Está pronto para dar o próximo passo e resolver esse problema de vez?",
        "Prefere ver o vídeo explicativo ou ir direto para a página do produto?"
      ]
    },
    en: {
      1: [ // Phase 1: Questions to understand the problem and lead to consequences phase
        "How has your sleep quality been lately?",
        "Does this problem interfere with your daily activities?",
        "Have you noticed any pattern in when these symptoms appear?",
        "Did this symptom come on suddenly or gradually?",
        "Is there anything that seems to make what you're feeling worse or better?"
      ],
      2: [ // Phase 2: Questions to create awareness of consequences and lead to aggravation phase
        "Want to know what happens when these symptoms are ignored for too long?",
        "Do you know anyone who had similar problems and ignored the signs?",
        "Did you know this problem might be connected to other systems in your body?",
        "Have you thought about how this might be affecting your daily productivity?",
        "Any idea how long your body can handle this imbalance before it collapses?"
      ],
      3: [ // Phase 3: Questions to show serious risks and lead to nutrients phase
        "Are you aware of how this problem can transform into something chronic?",
        "Have you considered the long-term effects of this imbalance in your body?",
        "Want to understand what's really happening inside your body right now?",
        "Did you know this symptom might just be the tip of the iceberg of a bigger problem?",
        "Are you willing to make some changes to avoid serious complications?"
      ],
      4: [ // Phase 4: Questions about nutrients to lead to supplements phase
        "Did you know there are specific medicinal plants for this problem?",
        "Does your current diet provide all the nutrients your body needs?",
        "Have you heard about the bioactive compounds that fight this symptom?",
        "Could you include 7-9 specific foods in your diet daily?",
        "Want to know which nutrients are essential to solve this imbalance?"
      ],
      5: [ // Phase 5: Questions about supplements to lead to final decision
        "Do you prefer a concentrated natural solution or continuing to deal with the symptoms?",
        "How long do you think is reasonable to wait for results?",
        "Have you imagined what your life would be like without this problem bothering you?",
        "Want to know the solution that combines all these nutrients in a single dose?",
        "What would be more valuable to you: solving the problem quickly or saving money?"
      ],
      6: [ // Phase 6: Questions to direct to supplement purchase decision
        "Would you like to know about the supplement that contains all these essential nutrients?",
        "Would you prefer to see reviews from other people who have used this supplement first?",
        "Want to know the science behind this supplement's formulation?",
        "Are you ready to take the next step and solve this problem once and for all?",
        "Would you prefer to see the explanatory video or go directly to the product page?"
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
  
  // Personalizar a introdução com o nome do usuário ou referência à mensagem - personalização agressiva
  let personalizedIntro = intro;
  if (sessionMemory.nome) {
    // Se temos o nome do usuário, personalizar a introdução de forma agressiva
    const userName = sessionMemory.nome;
    if (idioma === "pt") {
      // Substituir todas as ocorrências de termos genéricos pelo nome do usuário
      personalizedIntro = personalizedIntro.replace(/amigo|cara|você|olha|ei|veja|escuta/gi, userName);
      // Se ainda não tiver o nome na introdução, adicionar no início
      if (!personalizedIntro.includes(userName)) {
        personalizedIntro = `${userName}, ${personalizedIntro.charAt(0).toLowerCase()}${personalizedIntro.slice(1)}`;
      }
    } else {
      // Versão em inglês
      personalizedIntro = personalizedIntro.replace(/friend|buddy|pal|you|hey|look|listen/gi, userName);
      if (!personalizedIntro.includes(userName)) {
        personalizedIntro = `${userName}, ${personalizedIntro.charAt(0).toLowerCase()}${personalizedIntro.slice(1)}`;
      }
    }
  } else if (sessionMemory.respostasUsuario && sessionMemory.respostasUsuario.length > 0) {
    // Se não temos o nome, usar referência à última mensagem de forma mais agressiva
    const lastMessage = sessionMemory.respostasUsuario[sessionMemory.respostasUsuario.length - 1];
    const userWords = lastMessage.split(/\s+/).filter(w => w.length > 3).slice(0, 2);
    if (userWords.length > 0) {
      const reference = userWords.join(' ');
      if (idioma === "pt") {
        if (!personalizedIntro.includes(reference)) {
          personalizedIntro = personalizedIntro.replace(/amigo|cara|você|olha|ei|veja|escuta/i, `sobre "${reference}"`);
          if (personalizedIntro === intro) { // Se não houve substituição
            personalizedIntro = `Sobre "${reference}", ${personalizedIntro.charAt(0).toLowerCase()}${personalizedIntro.slice(1)}`;
          }
        }
      } else {
        if (!personalizedIntro.includes(reference)) {
          personalizedIntro = personalizedIntro.replace(/friend|buddy|pal|you|hey|look|listen/i, `about "${reference}"`);
          if (personalizedIntro === intro) { // Se não houve substituição
            personalizedIntro = `About "${reference}", ${personalizedIntro.charAt(0).toLowerCase()}${personalizedIntro.slice(1)}`;
          }
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
  
  // Conteúdo específico para cada fase do funil - totalmente reescrito para máxima distinção
  let phaseContent = "";
  if (idioma === "pt") {
    switch(currentFunnelPhase) {
      case 1: // Fase 1: Explicação científica simples + soluções rápidas
        phaseContent = `${scientificExplanation}\n\nExistem algumas soluções rápidas que podem aliviar temporariamente o que você está sentindo, como ajustes na postura, respiração profunda ou compressas. Mas isso é apenas um band-aid temporário - precisamos entender a causa raiz do problema para uma solução real.`;
        break;
      case 2: // Fase 2: Consequências se não tomar cuidados
        phaseContent = `Ignorar esses sintomas é como ignorar a luz de advertência no painel do carro - parece inofensivo até que o motor exploda na estrada.\n\nEstudos mostram que 73% das pessoas que negligenciam esses sinais acabam com problemas crônicos em menos de 8 meses. Seu corpo está literalmente implorando por atenção, e você está colocando os fones de ouvido no volume máximo para não ouvir.`;
        break;
      case 3: // Fase 3: O que está realmente arriscando (agravamento)
        phaseContent = `O que você está realmente arriscando é muito mais sério do que imagina. Esses sintomas podem evoluir para condições debilitantes que afetarão cada aspecto da sua vida - trabalho, relacionamentos, sono, humor.\n\nA inflamação crônica que começa como um pequeno incômodo pode se espalhar silenciosamente pelo corpo, afetando órgãos vitais e funções neurológicas. É como um incêndio florestal que começa com uma única faísca.`;
        break;
      case 4: // Fase 4: Nutrientes e plantas naturais
        phaseContent = `Seu corpo está desesperadamente precisando de nutrientes específicos para combater isso. Pesquisas recentes mostram que deficiências de magnésio, zinco e vitaminas do complexo B estão diretamente ligadas aos sintomas que você descreve.\n\nAs plantas medicinais contêm até 50x mais nutrientes bioativos do que alimentos comuns. Ashwagandha, por exemplo, contém mais de 80 compostos que regulam inflamação e estresse oxidativo. Rhodiola e ginseng têm potentes adaptógenos que reequilibram sistemas inteiros do corpo.`;
        break;
      case 5: // Fase 5: Suplemento como solução completa
        phaseContent = `As plantas medicinais que mencionei são extremamente poderosas, mas existe um problema: você precisaria consumir quantidades enormes diariamente para obter todos os nutrientes necessários.\n\nA ciência moderna conseguiu extrair e concentrar esses compostos bioativos em suplementos específicos, fornecendo o equivalente a quilos de plantas em uma única dose. Um suplemento bem formulado pode entregar exatamente o que seu corpo precisa, na dosagem correta, para resolver o problema pela raiz.`;
        break;
      case 6: // Fase 6: Plano B (abordagem alternativa) + direcionamento para suplemento
        phaseContent = `Existem duas abordagens possíveis agora:\n\n1) Você pode tentar o caminho mais longo: reformular completamente sua alimentação, incluir dezenas de alimentos específicos, plantas medicinais raras, e seguir um protocolo rigoroso por vários meses.\n\n2) Ou pode optar pela solução mais eficiente: um suplemento cientificamente formulado que combina todos os nutrientes e extratos de plantas que seu corpo precisa, na dosagem exata, para resolver esse problema rapidamente.\n\nA escolha é sua, mas lembre-se que cada dia que passa sem ação adequada é um dia a mais de sofrimento desnecessário.`;
        break;
      default:
        phaseContent = scientificExplanation;
    }
  } else {
    switch(currentFunnelPhase) {
      case 1: // Phase 1: Simple scientific explanation + quick solutions
        phaseContent = `${scientificExplanation}\n\nThere are some quick fixes that can temporarily relieve what you're feeling, like posture adjustments, deep breathing, or compresses. But this is just a temporary band-aid - we need to understand the root cause of the problem for a real solution.`;
        break;
      case 2: // Phase 2: Consequences if not taking care
        phaseContent = `Ignoring these symptoms is like ignoring the warning light on your car's dashboard - it seems harmless until the engine explodes on the road.\n\nStudies show that 73% of people who neglect these signs end up with chronic problems in less than 8 months. Your body is literally begging for attention, and you're putting on headphones at maximum volume to avoid hearing it.`;
        break;
      case 3: // Phase 3: What you're really risking (aggravation)
        phaseContent = `What you're really risking is much more serious than you imagine. These symptoms can evolve into debilitating conditions that will affect every aspect of your life - work, relationships, sleep, mood.\n\nThe chronic inflammation that starts as a small discomfort can silently spread throughout the body, affecting vital organs and neurological functions. It's like a forest fire that starts with a single spark.`;
        break;
      case 4: // Phase 4: Nutrients and natural plants
        phaseContent = `Your body is desperately in need of specific nutrients to combat this. Recent research shows that deficiencies in magnesium, zinc, and B-complex vitamins are directly linked to the symptoms you're describing.\n\nMedicinal plants contain up to 50x more bioactive nutrients than common foods. Ashwagandha, for example, contains more than 80 compounds that regulate inflammation and oxidative stress. Rhodiola and ginseng have potent adaptogens that rebalance entire body systems.`;
        break;
      case 5: // Phase 5: Supplement as complete solution
        phaseContent = `The medicinal plants I mentioned are extremely powerful, but there's a problem: you would need to consume enormous amounts daily to get all the necessary nutrients.\n\nModern science has managed to extract and concentrate these bioactive compounds into specific supplements, providing the equivalent of pounds of plants in a single dose. A well-formulated supplement can deliver exactly what your body needs, in the correct dosage, to solve the problem at its root.`;
        break;
      case 6: // Phase 6: Plan B (alternative approach) + directing to supplement
        phaseContent = `There are two possible approaches now:\n\n1) You can try the longer path: completely reformulate your diet, include dozens of specific foods, rare medicinal plants, and follow a strict protocol for several months.\n\n2) Or you can opt for the more efficient solution: a scientifically formulated supplement that combines all the nutrients and plant extracts your body needs, in the exact dosage, to quickly solve this problem.\n\nThe choice is yours, but remember that each day that passes without proper action is another day of unnecessary suffering.`;
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
