// ES Modules format - Adaptado para GPT-3.5 gratuito
import { getSymptomContext } from './notion.mjs';

// Função principal para processar a mensagem do usuário - versão adaptada para GPT-3.5
async function processMessage(userMessage, sessionMemory = {}) {
  try {
    console.log("🔄 Iniciando processamento da mensagem...");
    
    // Garantir que userMessage seja uma string
    const messageText = typeof userMessage === 'string' ? userMessage : 
                        (userMessage && typeof userMessage === 'object') ? 
                        (userMessage.text || userMessage.message || userMessage.content || userMessage.input || String(userMessage)) : 
                        String(userMessage);
    
    // Inicializar a memória da sessão se não existir
    if (!sessionMemory.respostasUsuario) {
      sessionMemory.respostasUsuario = [];
    }
    
    // Adicionar a mensagem atual à memória (como string)
    sessionMemory.respostasUsuario.push(messageText);
    
    // Extrair dados do usuário da memória da sessão
    const userName = sessionMemory.userName || "";
    const userAge = sessionMemory.userAge || "";
    const userWeight = sessionMemory.userWeight || "";
    
    // Rastrear perguntas já selecionadas para evitar repetição
    if (!sessionMemory.previouslySelectedQuestions) {
      sessionMemory.previouslySelectedQuestions = [];
    }
    
    // Determinar a fase atual do funil - simplificado
    const numInteractions = sessionMemory.respostasUsuario.length;
    let funnelPhase = sessionMemory.funnelPhase || 1;
    
    // Progressão simplificada do funil baseada apenas no número de interações
    if (numInteractions >= 10) {
      funnelPhase = 6; // Plano B
    } else if (numInteractions >= 8) {
      funnelPhase = 5; // Suplemento
    } else if (numInteractions >= 6) {
      funnelPhase = 4; // Nutrientes e Plantas
    } else if (numInteractions >= 4) {
      funnelPhase = 3; // Agravamento
    } else if (numInteractions >= 2) {
      funnelPhase = 2; // Consequências
    }
    
    sessionMemory.funnelPhase = funnelPhase;
    
    // Manter o sintoma anterior para continuidade
    const previousSymptom = sessionMemory.sintomaAtual || null;
    
    // Obter o contexto do sintoma - versão adaptada para GPT-3.5
    const symptomContext = getSymptomContext(
      messageText, 
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
    
    // Limitar o tamanho da lista de perguntas anteriores
    if (sessionMemory.previouslySelectedQuestions.length > 20) {
      sessionMemory.previouslySelectedQuestions = sessionMemory.previouslySelectedQuestions.slice(-20);
    }
    
    // Formatar a resposta - versão adaptada para GPT-3.5
    const { intro, scientificExplanation, followupQuestions } = symptomContext;
    const language = symptomContext.language || "en";
    
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
    const title = phaseTitles[funnelPhase]?.[language] || phaseTitles[1][language];
    
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
    const closing = closingText[funnelPhase]?.[language] || closingText[1][language];
    
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

    console.log("✅ Processamento concluído com sucesso!");
    // Retornar a resposta e a memória atualizada
    return {
      response,
      sessionMemory
    };
    
  } catch (error) {
    console.error("❌ Erro ao processar mensagem:", error);
    // Retornar uma resposta de erro amigável
    return {
      response: `Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente com uma pergunta mais simples.`,
      sessionMemory
    };
  }
}

// Exportar usando default export (função principal)
export default processMessage;
