// ES Modules format
import { getSymptomContext } from './notion.mjs';

// Função para determinar a fase do funil com base no histórico de conversa
function determineFunnelPhase(sessionMemory) {
  // Se não houver memória de sessão, começar na fase 1
  if (!sessionMemory || !sessionMemory.respostasUsuario) {
    return 1;
  }
  
  // Número de interações
  const numInteractions = sessionMemory.respostasUsuario.length;
  
  // Fase atual (se já estiver definida)
  const currentPhase = sessionMemory.funnelPhase || 1;
  
  // Verificar palavras-chave na última mensagem do usuário para possível avanço
  const lastUserMessage = sessionMemory.respostasUsuario[sessionMemory.respostasUsuario.length - 1] || "";
  const lowerMessage = lastUserMessage.toLowerCase();
  
  // Palavras-chave que podem acelerar o avanço no funil
  const phase2Keywords = ["consequência", "consequencia", "risco", "piorar", "consequence", "risk", "worsen"];
  const phase3Keywords = ["grave", "sério", "serio", "perigo", "serious", "danger", "severe"];
  const phase4Keywords = ["nutriente", "planta", "natural", "nutrient", "plant", "herb"];
  const phase5Keywords = ["suplemento", "comprar", "supplement", "buy", "purchase"];
  
  // Verificar se há palavras-chave para avançar
  let shouldAdvance = false;
  
  if (currentPhase === 1 && phase2Keywords.some(keyword => lowerMessage.includes(keyword))) {
    shouldAdvance = true;
  } else if (currentPhase === 2 && phase3Keywords.some(keyword => lowerMessage.includes(keyword))) {
    shouldAdvance = true;
  } else if (currentPhase === 3 && phase4Keywords.some(keyword => lowerMessage.includes(keyword))) {
    shouldAdvance = true;
  } else if (currentPhase === 4 && phase5Keywords.some(keyword => lowerMessage.includes(keyword))) {
    shouldAdvance = true;
  }
  
  // Chance aleatória de avançar (30%) para evitar estagnação
  const randomAdvance = Math.random() < 0.3;
  
  // Lógica de progressão do funil
  if (shouldAdvance || randomAdvance) {
    // Avançar para a próxima fase
    return Math.min(currentPhase + 1, 6); // Máximo é fase 6 (Plano B)
  } else if (numInteractions >= 10) {
    // Após 10 interações, ir para o Plano B (fase 6)
    return 6;
  } else if (numInteractions >= 8) {
    // Após 8 interações, ir para fase 5 (Suplemento)
    return 5;
  } else if (numInteractions >= 6) {
    // Após 6 interações, ir para fase 4 (Nutrientes e Plantas)
    return 4;
  } else if (numInteractions >= 4) {
    // Após 4 interações, ir para fase 3 (Agravamento)
    return 3;
  } else if (numInteractions >= 2) {
    // Após 2 interações, ir para fase 2 (Consequências)
    return 2;
  }
  
  // Caso contrário, manter a fase atual
  return currentPhase;
}

// Função para formatar a resposta com base na fase do funil
function formatResponse(symptomContext, funnelPhase) {
  const { sintoma, intro, scientificExplanation, followupQuestions } = symptomContext;
  const language = intro.includes("você") ? "pt" : "en";
  
  // Títulos para cada fase do funil
  const phaseTitles = {
    1: {
      pt: "O que está realmente acontecendo:",
      en: "What's really happening:"
    },
    2: {
      pt: "Consequências se não tratado:",
      en: "Consequences if untreated:"
    },
    3: {
      pt: "O que você está realmente arriscando:",
      en: "What you're really risking:"
    },
    4: {
      pt: "Nutrientes e plantas que podem ajudar:",
      en: "Nutrients and plants that can help:"
    },
    5: {
      pt: "A solução completa para seu problema:",
      en: "The complete solution for your problem:"
    },
    6: {
      pt: "Pense bem sobre isso:",
      en: "Think carefully about this:"
    }
  };
  
  // Obter o título apropriado para a fase atual
  const title = phaseTitles[funnelPhase][language];
  
  // Texto de fechamento para cada fase
  const closingText = {
    1: {
      pt: "Estas dicas ajudam, mas quer saber mais?",
      en: "These tips help, but want to know more?"
    },
    2: {
      pt: "Está pronto para levar isso a sério?",
      en: "Are you ready to take this seriously?"
    },
    3: {
      pt: "Está pronto para agir ou prefere continuar sofrendo?",
      en: "Are you ready to act or prefer to keep suffering?"
    },
    4: {
      pt: "Quer uma solução mais completa e eficaz?",
      en: "Want a more complete and effective solution?"
    },
    5: {
      pt: "Pronto para transformar sua saúde de uma vez por todas?",
      en: "Ready to transform your health once and for all?"
    },
    6: {
      pt: "A decisão final é sua:",
      en: "The final decision is yours:"
    }
  };
  
  // Obter o texto de fechamento apropriado para a fase atual
  const closing = closingText[funnelPhase][language];
  
  // Formatar as perguntas de follow-up como elementos clicáveis
  const formattedQuestions = followupQuestions.map((question, index) => {
    return `<div class="clickable-question" data-question="${encodeURIComponent(question)}" onclick="handleQuestionClick(this)">
      ${index + 1}. ${question}
    </div>`;
  }).join('\n');
  
  // Montar a resposta completa
  const response = `${intro}

### ${title}
${scientificExplanation}

### ${closing}
Escolha seu próximo passo (se tiver coragem):

${formattedQuestions}`;

  return response;
}

// Função principal para processar a mensagem do usuário
async function processMessage(userMessage, sessionMemory = {}) {
  try {
    // Inicializar a memória da sessão se não existir
    if (!sessionMemory.respostasUsuario) {
      sessionMemory.respostasUsuario = [];
    }
    
    // Adicionar a mensagem atual à memória
    sessionMemory.respostasUsuario.push(userMessage);
    
    // Extrair dados do usuário da memória da sessão
    const userName = sessionMemory.userName || "";
    const userAge = sessionMemory.userAge || "";
    const userWeight = sessionMemory.userWeight || "";
    
    // Rastrear perguntas já selecionadas para evitar repetição
    if (!sessionMemory.previouslySelectedQuestions) {
      sessionMemory.previouslySelectedQuestions = [];
    }
    
    // Determinar a fase atual do funil
    const funnelPhase = determineFunnelPhase(sessionMemory);
    sessionMemory.funnelPhase = funnelPhase;
    
    // Manter o sintoma anterior para continuidade
    const previousSymptom = sessionMemory.sintomaAtual || null;
    
    // Obter o contexto do sintoma
    const symptomContext = await getSymptomContext(
      userMessage, 
      userName, 
      userAge, 
      userWeight, 
      funnelPhase,
      previousSymptom,
      sessionMemory.previouslySelectedQuestions
    );
    
    // Atualizar o sintoma atual na memória
    sessionMemory.sintomaAtual = symptomContext.sintoma;
    
    // Adicionar as novas perguntas à lista de perguntas já usadas
    sessionMemory.previouslySelectedQuestions = [
      ...sessionMemory.previouslySelectedQuestions,
      ...symptomContext.followupQuestions
    ];
    
    // Limitar o tamanho da lista de perguntas anteriores para evitar crescimento excessivo
    if (sessionMemory.previouslySelectedQuestions.length > 20) {
      sessionMemory.previouslySelectedQuestions = sessionMemory.previouslySelectedQuestions.slice(-20);
    }
    
    // Formatar a resposta com base na fase do funil
    const response = formatResponse(symptomContext, funnelPhase);
    
    // Retornar a resposta e a memória atualizada
    return {
      response,
      sessionMemory
    };
    
  } catch (error) {
    console.error("❌ Erro ao processar mensagem:", error);
    return {
      response: "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
      sessionMemory
    };
  }
}

// Exportar usando default export (função principal)
export default processMessage;
