// chat.js - Versão adaptada do código funcional com integração GPT-4o mini

// Configuração da API OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "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
"; // Substitua pela sua chave API ou use variável de ambiente
const GPT_MODEL = "gpt-4o-mini"; // Modelo GPT-4o mini

// Importação da função getSymptomContext do notion.mjs
import { getSymptomContext } from "./notion.mjs";

// Memória da sessão para rastrear interações
let sessionMemory = {
  sintomasDetectados: [],
  respostasUsuario: [],
  nome: "",
  idioma: "pt",
  sintomaAtual: null,
  funnelPhase: 1,
  contadorPerguntas: {},
  ultimasPerguntas: [],
  usedQuestions: [] // Rastreia todas as perguntas já usadas para evitar repetição
};

// Função para chamar o GPT-4o mini
async function callGPT4oMini(prompt, context, userMessage) {
  try {
    console.log("🤖 Iniciando chamada ao GPT-4o mini...");
    
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
            content: `Você é Owl Savage, um assistente de saúde com personalidade única: informal, direto e motivador. 
            Você fornece explicações científicas em linguagem acessível e guia os usuários através de um funil de conversão.
            
            Fase atual do funil: ${context.funnelPhase}
            Sintoma relatado: ${context.symptom}
            Idioma: ${context.language}
            Nome do usuário: ${context.userName || 'não fornecido'}
            
            Regras importantes:
            1. Nunca use símbolos # ou markdown em suas respostas
            2. Mantenha o tom informal mas informativo
            3. Personalize a resposta usando o nome do usuário quando disponível
            4. Siga a estrutura do funil para a fase ${context.funnelPhase}
            5. Não repita perguntas já feitas anteriormente
            6. Mantenha a resposta no idioma ${context.language === 'pt' ? 'português' : 'inglês'}`
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error("❌ Erro na API do GPT:", data.error);
      return null;
    }
    
    console.log("✅ Resposta do GPT recebida com sucesso!");
    return data.choices[0].message.content;
  } catch (error) {
    console.error("❌ Erro ao chamar GPT-4o mini:", error);
    return null;
  }
}

// Função para formatar a resposta do GPT
function formatGPTResponse(gptResponse, symptomContext) {
  // Se não houver resposta do GPT, retornar null para usar o fallback
  if (!gptResponse) return null;
  
  const { title, closing, followupQuestions } = symptomContext;
  const language = symptomContext.language || 'pt';
  
  // Formatar perguntas clicáveis
  const formattedQuestions = followupQuestions.map((question, index) => {
    return `<div class="clickable-question" data-question="${encodeURIComponent(question)}" onclick="handleQuestionClick(this)">
      ${index + 1}. ${question}
    </div>`;
  }).join('\n');
  
  // Construir a resposta completa
  const response = `${gptResponse}

${closing}
${language === "pt" ? "Escolha uma opção:" : "Choose an option:"}

${formattedQuestions}`;

  return response;
}

// Função para formatar resposta rica de fallback (sem GPT)
function formatRichFallbackResponse(symptomContext) {
  const { intro, scientificExplanation, followupQuestions, title, closing } = symptomContext;
  const language = symptomContext.language || 'pt';
  
  // Formatar perguntas clicáveis
  const formattedQuestions = followupQuestions.map((question, index) => {
    return `<div class="clickable-question" data-question="${encodeURIComponent(question)}" onclick="handleQuestionClick(this)">
      ${index + 1}. ${question}
    </div>`;
  }).join('\n');
  
  // Construir a resposta completa
  const response = `${intro}

${title}
${scientificExplanation}

${closing}
${language === "pt" ? "Escolha uma opção:" : "Choose an option:"}

${formattedQuestions}`;

  return response;
}

// Handler principal para processar requisições
export default async function handler(req, res) {
  try {
    // Verificar método HTTP
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed. Use POST." });
    }

    // Extrair dados da requisição com validação robusta
    let userInput, userName, userAge, userSex, userWeight;
    
    // Aceitar múltiplos formatos de entrada
    if (typeof req.body === 'string') {
      // Caso seja uma string direta
      userInput = req.body;
    } else if (req.body && typeof req.body === 'object') {
      // Extrair campos do objeto
      const { message, selectedQuestion, name, age, sex, weight, userInput: inputField, userName: nameField, text, input, query } = req.body;
      
      // Priorizar campos na ordem: selectedQuestion > userInput > message > text > input > query
      userInput = selectedQuestion || inputField || message || text || input || query;
      
      // Se ainda não encontrou, procurar por qualquer campo com string
      if (!userInput) {
        for (const key in req.body) {
          if (typeof req.body[key] === 'string' && req.body[key].trim() && key !== 'name' && key !== 'userName') {
            userInput = req.body[key];
            break;
          }
        }
      }
      
      // Extrair nome do usuário (várias opções)
      userName = name || nameField || req.body.user || '';
      
      // Extrair outros dados do usuário
      userAge = parseInt(age || req.body.userAge || '0');
      userSex = (sex || req.body.userSex || '').toLowerCase();
      userWeight = parseFloat(weight || req.body.userWeight || '0');
    }
    
    // Validar se temos uma entrada do usuário
    if (!userInput) {
      return res.status(400).json({ 
        error: "Input is required", 
        message: "Please provide user input in one of these formats: userInput, message, selectedQuestion, text, input, query, or as a direct string."
      });
    }

    console.log(`✅ Dados da requisição validados com sucesso: { userInput: '${userInput}', userName: '${userName}' }`);
    console.log(`🔍 Processando entrada do usuário: ${userInput}`);
    
    // Atualizar memória da sessão
    if (userName) sessionMemory.nome = userName.trim();
    sessionMemory.respostasUsuario.push(userInput);
    
    // Determinar a fase atual do funil (incrementar a cada interação, máximo 6)
    const currentFunnelPhase = Math.min(sessionMemory.funnelPhase || 1, 6);
    console.log(`🔄 Fase atual do funil: ${currentFunnelPhase}`);
    
    // Obter contexto do sintoma do Notion com prevenção de repetição
    const symptomContext = await getSymptomContext(
      userInput, 
      sessionMemory.nome, 
      currentFunnelPhase,
      sessionMemory.usedQuestions
    );
    
    // Atualizar a memória da sessão com o sintoma e idioma detectados
    if (symptomContext.sintoma) {
      sessionMemory.sintomaAtual = symptomContext.sintoma;
    }
    if (symptomContext.language) {
      sessionMemory.idioma = symptomContext.language;
    }
    
    console.log(`🔤 Idioma detectado: ${symptomContext.language}`);
    console.log(`🩺 Sintoma detectado: ${symptomContext.sintoma}`);
    
    // Rastrear perguntas usadas para evitar repetição
    if (symptomContext.followupQuestions && symptomContext.followupQuestions.length > 0) {
      sessionMemory.ultimasPerguntas = symptomContext.followupQuestions;
      sessionMemory.usedQuestions = [...sessionMemory.usedQuestions, ...symptomContext.followupQuestions];
    }
    
    // Tentar obter resposta do GPT-4o mini
    let gptResponse = null;
    try {
      if (symptomContext.gptPromptData) {
        console.log("🔄 Tentando obter resposta do GPT-4o mini...");
        gptResponse = await callGPT4oMini(
          symptomContext.gptPromptData.prompt,
          symptomContext.gptPromptData.context,
          userInput
        );
        console.log("🔄 Resposta do GPT obtida:", gptResponse ? "Sim" : "Não");
      }
    } catch (gptError) {
      console.error("❌ Erro ao chamar GPT-4o mini:", gptError);
      gptResponse = null;
    }

    // Construir a resposta final (usando GPT se disponível, ou fallback)
    let responseContent;
    if (gptResponse) {
      console.log("🤖 Usando resposta do GPT");
      responseContent = formatGPTResponse(gptResponse, symptomContext);
    } else {
      console.log("📋 Usando fallback com conteúdo rico");
      responseContent = formatRichFallbackResponse(symptomContext);
    }
    
    // Incrementar a fase do funil para a próxima interação
    sessionMemory.funnelPhase = Math.min(currentFunnelPhase + 1, 6);
    
    // Enviar a resposta para o frontend no formato esperado
    return res.status(200).json({
      choices: [{ 
        message: { 
          content: responseContent,
          followupQuestions: symptomContext.followupQuestions 
        } 
      }]
    });

  } catch (err) {
    console.error("❌ Erro interno do servidor:", err.message);
    
    // Resposta de erro com fallback para garantir que o frontend não quebre
    return res.status(200).json({
      choices: [{ 
        message: { 
          content: sessionMemory.idioma === 'pt' 
            ? "Desculpe, tive um problema ao processar sua mensagem. Poderia tentar novamente?"
            : "Sorry, I had a problem processing your message. Could you try again?",
          followupQuestions: [
            sessionMemory.idioma === 'pt' ? "Podemos tentar de novo?" : "Can we try again?",
            sessionMemory.idioma === 'pt' ? "Quer falar sobre outro assunto?" : "Want to talk about something else?",
            sessionMemory.idioma === 'pt' ? "Precisa de ajuda com algo específico?" : "Need help with something specific?"
          ]
        } 
      }]
    });
  }
}
