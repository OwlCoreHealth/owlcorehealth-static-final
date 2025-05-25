const { getSymptomContext } = require('./notion.mjs');

// Memória de sessão para manter contexto entre interações
let sessionMemory = {
  userName: "",
  userAge: "",
  userWeight: "",
  userSex: "",
  sintomaAtual: null,
  funnelPhase: 1,
  respostasUsuario: [],
  previousQuestions: []
};

// Função para determinar a fase do funil com base no histórico e palavras-chave
function determineFunnelPhase(sessionMemory) {
  // Se não houver histórico, começar na fase 1
  if (!sessionMemory.respostasUsuario || sessionMemory.respostasUsuario.length === 0) {
    return 1;
  }
  
  // Número de interações determina fase mínima
  const interacoes = sessionMemory.respostasUsuario.length;
  let novaFase = sessionMemory.funnelPhase; // Manter fase atual por padrão
  
  // Progressão baseada no número de interações (mais rápida)
  if (interacoes >= 6) {
    novaFase = Math.max(novaFase, 5); // Fase 5 (Suplemento) após 6 interações
  } else if (interacoes >= 4) {
    novaFase = Math.max(novaFase, 4); // Fase 4 (Nutrientes) após 4 interações
  } else if (interacoes >= 3) {
    novaFase = Math.max(novaFase, 3); // Fase 3 (Agravamento) após 3 interações
  } else if (interacoes >= 2) {
    novaFase = Math.max(novaFase, 2); // Fase 2 (Consequências) após 2 interações
  }
  
  // Verificar palavras-chave na última resposta do usuário para possível avanço adicional
  const ultimaResposta = sessionMemory.respostasUsuario[sessionMemory.respostasUsuario.length - 1].toLowerCase();
  
  // Palavras que indicam interesse em soluções (avançar para fase 4)
  if (novaFase < 4 && (
    ultimaResposta.includes("solução") || 
    ultimaResposta.includes("solution") ||
    ultimaResposta.includes("remédio") || 
    ultimaResposta.includes("remedy") ||
    ultimaResposta.includes("tratamento") || 
    ultimaResposta.includes("treatment") ||
    ultimaResposta.includes("planta") || 
    ultimaResposta.includes("plant") ||
    ultimaResposta.includes("natural") ||
    ultimaResposta.includes("nutriente") || 
    ultimaResposta.includes("nutrient")
  )) {
    novaFase = 4; // Avançar para Fase 4 (Nutrientes)
  }
  
  // Palavras que indicam interesse em produto (avançar para fase 5)
  if (novaFase < 5 && (
    ultimaResposta.includes("suplemento") || 
    ultimaResposta.includes("supplement") ||
    ultimaResposta.includes("produto") || 
    ultimaResposta.includes("product") ||
    ultimaResposta.includes("comprar") || 
    ultimaResposta.includes("buy") ||
    ultimaResposta.includes("onde") || 
    ultimaResposta.includes("where")
  )) {
    novaFase = 5; // Avançar para Fase 5 (Suplemento)
  }
  
  // Se o usuário continua após fase 5, ir para plano B
  if (novaFase === 5 && interacoes > 7) {
    novaFase = 6; // Plano B
  }
  
  // Chance aleatória de avançar (para evitar estagnação)
  const chanceAleatoria = Math.random();
  if (chanceAleatoria < 0.3 && novaFase < 5) { // 30% de chance
    novaFase += 1;
  }
  
  return Math.min(novaFase, 6); // Máximo fase 6 (Plano B)
}

// Função para obter título da fase atual
function getTitleForPhase(phase, language) {
  const titles = {
    1: {
      pt: "A verdade que você precisa ouvir:",
      en: "The truth you need to hear:"
    },
    2: {
      pt: "Consequências que você está ignorando:",
      en: "Consequences you're ignoring:"
    },
    3: {
      pt: "O que você está realmente arriscando:",
      en: "What you're really risking:"
    },
    4: {
      pt: "Soluções que realmente funcionam:",
      en: "Solutions that actually work:"
    },
    5: {
      pt: "A solução definitiva para seu problema:",
      en: "The definitive solution to your problem:"
    },
    6: {
      pt: "Pense bem antes de decidir:",
      en: "Think carefully before deciding:"
    }
  };
  
  return titles[phase][language] || titles[1][language];
}

// Função para obter subtítulo da fase atual
function getSubtitleForPhase(phase, language) {
  const subtitles = {
    1: {
      pt: "E agora, o que você vai fazer a respeito?",
      en: "And now, what are you going to do about it?"
    },
    2: {
      pt: "Vai continuar ignorando esses sinais?",
      en: "Will you continue ignoring these signs?"
    },
    3: {
      pt: "Está pronto para agir ou prefere continuar sofrendo?",
      en: "Are you ready to act or do you prefer to keep suffering?"
    },
    4: {
      pt: "Quer saber mais ou vai continuar ignorando?",
      en: "Want to know more or will you keep ignoring it?"
    },
    5: {
      pt: "Pronto para resolver seu problema de uma vez por todas?",
      en: "Ready to solve your problem once and for all?"
    },
    6: {
      pt: "A escolha é sua, mas as consequências também:",
      en: "The choice is yours, but so are the consequences:"
    }
  };
  
  return subtitles[phase][language] || subtitles[1][language];
}

// Função para formatar a resposta final
function formatResponse(symptomContext, funnelPhase) {
  const language = symptomContext.intro.includes("dor de cabeça") ? "pt" : "en";
  const title = getTitleForPhase(funnelPhase, language);
  const subtitle = getSubtitleForPhase(funnelPhase, language);
  
  // Formatar perguntas como elementos clicáveis
  const formattedQuestions = symptomContext.followupQuestions.map((question, index) => {
    return `<div class="clickable-question" data-question="${encodeURIComponent(question)}" onclick="handleQuestionClick(this)">
      ${index + 1}. ${question}
    </div>`;
  }).join('\n');
  
  // Montar resposta completa
  return `${symptomContext.intro}

### ${title}
${symptomContext.scientificExplanation}

### ${subtitle}
Escolha seu próximo passo (se tiver coragem):

${formattedQuestions}`;
}

// Função principal para processar mensagens
async function processMessage(message, name, age, sex, weight) {
  try {
    // Atualizar informações do usuário se fornecidas
    if (name && name.trim() !== "") {
      sessionMemory.userName = name;
    }
    
    if (age && age.trim() !== "") {
      sessionMemory.userAge = parseInt(age);
    }
    
    if (sex && sex.trim() !== "") {
      sessionMemory.userSex = sex;
    }
    
    if (weight && weight.trim() !== "") {
      sessionMemory.userWeight = parseInt(weight);
    }
    
    // Adicionar mensagem ao histórico
    sessionMemory.respostasUsuario.push(message);
    
    // Determinar fase atual do funil
    const funnelPhase = determineFunnelPhase(sessionMemory);
    sessionMemory.funnelPhase = funnelPhase;
    
    // Obter contexto do sintoma
    const symptomContext = await getSymptomContext(
      message, 
      sessionMemory.userName, 
      sessionMemory.userAge, 
      sessionMemory.userWeight, 
      funnelPhase,
      sessionMemory.sintomaAtual,
      sessionMemory.previousQuestions
    );
    
    // Manter contexto do sintoma para próximas interações
    sessionMemory.sintomaAtual = symptomContext.sintoma;
    
    // Registrar perguntas para evitar repetição
    sessionMemory.previousQuestions = [
      ...sessionMemory.previousQuestions,
      ...symptomContext.followupQuestions
    ];
    
    // Limitar tamanho do histórico de perguntas
    if (sessionMemory.previousQuestions.length > 15) {
      sessionMemory.previousQuestions = sessionMemory.previousQuestions.slice(-15);
    }
    
    // Formatar resposta final
    const response = formatResponse(symptomContext, funnelPhase);
    
    return {
      choices: [
        {
          message: {
            content: response
          }
        }
      ]
    };
  } catch (error) {
    console.error("Erro ao processar mensagem:", error);
    return {
      choices: [
        {
          message: {
            content: "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente."
          }
        }
      ]
    };
  }
}

// Exportar usando CommonJS para compatibilidade
module.exports = {
  processMessage
};
