import { getSymptomContext } from "./notion.mjs"; 

// Configuração da API OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "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
"; // Substitua pela sua chave API ou use variável de ambiente
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
    
    // Detectar idioma
    const isPortuguese = /[ãõçáéíóú]| você|dor|tenho|problema|saúde/i.test(userInput);
    const idioma = isPortuguese ? "pt" : "en";
    
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

// Função para formatar a resposta do GPT
function formatGPTResponse(gptResponse, symptomContext, idioma) {
  // Se não houver resposta do GPT, retornar null para usar o fallback
  if (!gptResponse) return null;
  
  const { followupQuestions } = symptomContext;
  
  // Título da seção de perguntas - sem usar símbolos # que afetam leitura por áudio
  const questionsTitle = idioma === "pt" ? "Vamos explorar mais:" : "Let's explore further:";
  
  // Texto de instrução para as perguntas
  const instructionText = idioma === "pt" 
    ? "Escolha uma das opções abaixo para continuarmos:" 
    : "Choose one of the options below to continue:";
  
  // Construir a resposta formatada
  let response = `${gptResponse}\n\n${questionsTitle}\n${instructionText}\n\n`;
  
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
  
  // Título da seção científica - sem usar símbolos # que afetam leitura por áudio
  const scientificTitle = idioma === "pt" ? "Análise Científica:" : "Scientific Analysis:";
  
  // Título da seção de perguntas
  const questionsTitle = idioma === "pt" ? "Vamos explorar mais:" : "Let's explore further:";
  
  // Texto de instrução para as perguntas
  const instructionText = idioma === "pt" 
    ? "Escolha uma das opções abaixo para continuarmos:" 
    : "Choose one of the options below to continue:";
  
  // Construir a resposta formatada
  let response = `${intro}\n\n${scientificTitle}\n${scientificExplanation}\n\n${questionsTitle}\n${instructionText}\n\n`;
  
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
