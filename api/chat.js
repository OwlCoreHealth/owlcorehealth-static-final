// chat.js - Implementação com progressão de funil e prevenção de repetição de perguntas
import { getSymptomContext, detectSymptomAndLanguage } from './notion.mjs';

// Memória da sessão para rastrear interações e perguntas já usadas
let sessionMemory = {
  sintomasDetectados: [],
  respostasUsuario: [],
  nome: "",
  idioma: "pt",
  sintomaAtual: null,
  categoriaAtual: null,
  funnelPhase: 1,
  usedQuestions: [], // Rastrear perguntas já usadas para evitar repetição
  ultimasPerguntas: []
};

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
    const { language } = detectSymptomAndLanguage(userInput);
    const idioma = language;
    
    // Processar dados do usuário
    const userName = name?.trim() || sessionMemory.nome || "";
    const userAge = parseInt(age) || "";
    const userSex = (sex || "").toLowerCase();
    const userWeight = parseFloat(weight) || "";
    const hasForm = userName && !isNaN(userAge) && userSex && !isNaN(userWeight);

    // Atualizar a memória da sessão
    sessionMemory.nome = userName;
    sessionMemory.idioma = idioma;
    sessionMemory.respostasUsuario.push(userInput);

    // Determinar a fase atual do funil baseada no número de interações
    const numInteractions = sessionMemory.respostasUsuario.length;
    
    // Progressão do funil baseada no número de interações
    // Ajustado para progressão mais gradual
    if (numInteractions >= 12) {
      sessionMemory.funnelPhase = 6; // Plano B
    } else if (numInteractions >= 9) {
      sessionMemory.funnelPhase = 5; // Suplemento
    } else if (numInteractions >= 6) {
      sessionMemory.funnelPhase = 4; // Nutrientes e Plantas
    } else if (numInteractions >= 4) {
      sessionMemory.funnelPhase = 3; // Agravamento
    } else if (numInteractions >= 2) {
      sessionMemory.funnelPhase = 2; // Consequências
    } else {
      sessionMemory.funnelPhase = 1; // Explicação inicial
    }
    
    // Obter contexto do sintoma com a fase do funil atual
    const symptomContext = getSymptomContext(
      userInput, 
      userName, 
      userAge, 
      userWeight,
      sessionMemory.funnelPhase,
      sessionMemory.sintomaAtual,
      sessionMemory.usedQuestions
    );
    
    // Atualizar a memória da sessão com o sintoma detectado
    if (symptomContext.sintoma) {
      sessionMemory.sintomaAtual = symptomContext.sintoma;
    }
    
    // Adicionar as perguntas desta resposta à lista de perguntas já usadas
    sessionMemory.usedQuestions = [
      ...sessionMemory.usedQuestions,
      ...symptomContext.followupQuestions
    ];
    
    // Limitar o tamanho da lista de perguntas usadas (manter as 50 mais recentes)
    if (sessionMemory.usedQuestions.length > 50) {
      sessionMemory.usedQuestions = sessionMemory.usedQuestions.slice(-50);
    }

    // Construir a resposta formatada com base na fase do funil
    let responseContent = formatResponse(symptomContext, idioma, sessionMemory.funnelPhase, { 
      name: userName, 
      age: userAge, 
      weight: userWeight 
    });
    
    // Armazenar as últimas perguntas para referência futura
    sessionMemory.ultimasPerguntas = symptomContext.followupQuestions;

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
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}

// Função para formatar a resposta com base na fase do funil
function formatResponse(symptomContext, idioma, funnelPhase, userData) {
  const { intro, scientificExplanation, followupQuestions } = symptomContext;
  const { name, age, weight } = userData || {};
  const hasUserData = name && age && weight;
  
  // Títulos para cada fase do funil
  const phaseTitles = {
    1: {
      pt: "### O que está acontecendo:",
      en: "### What's happening:"
    },
    2: {
      pt: "### Consequências se não tratado:",
      en: "### Consequences if untreated:"
    },
    3: {
      pt: "### O que você está realmente arriscando:",
      en: "### What you're really risking:"
    },
    4: {
      pt: "### Nutrientes e plantas que podem ajudar:",
      en: "### Nutrients and plants that can help:"
    },
    5: {
      pt: "### A solução completa para seu problema:",
      en: "### The complete solution for your problem:"
    },
    6: {
      pt: "### Pense bem sobre isso:",
      en: "### Think carefully about this:"
    }
  };
  
  // Texto de fechamento para cada fase
  const closingText = {
    1: {
      pt: "Vamos explorar mais?",
      en: "Let's explore further?"
    },
    2: {
      pt: "Vamos entender melhor?",
      en: "Let's understand better?"
    },
    3: {
      pt: "Vamos considerar opções?",
      en: "Let's consider options?"
    },
    4: {
      pt: "Quer saber mais sobre soluções naturais?",
      en: "Want to know more about natural solutions?"
    },
    5: {
      pt: "Pronto para uma solução completa?",
      en: "Ready for a complete solution?"
    },
    6: {
      pt: "Alguma outra dúvida?",
      en: "Any other questions?"
    }
  };
  
  // Obter o título e fechamento apropriados para a fase atual
  const title = phaseTitles[funnelPhase]?.[idioma] || phaseTitles[1][idioma];
  const closing = closingText[funnelPhase]?.[idioma] || closingText[1][idioma];
  
  // Personalização baseada nos dados do usuário (se disponíveis)
  let personalizedIntro = intro;
  if (hasUserData) {
    // Adicionar nome do usuário se não estiver já incluído na introdução
    if (name && !personalizedIntro.includes(name)) {
      personalizedIntro = personalizedIntro.replace("Olá!", `Olá, ${name}!`).replace("Hello!", `Hello, ${name}!`);
    }
  }
  
  // Formatar as perguntas de follow-up como elementos clicáveis
  const formattedQuestions = followupQuestions.map((question, index) => {
    return `<div class="clickable-question" data-question="${encodeURIComponent(question)}" onclick="handleQuestionClick(this)">
      ${index + 1}. ${question}
    </div>`;
  }).join('\n');
  
  // Montar a resposta completa
  const response = `${personalizedIntro}

${title}
${scientificExplanation}

### ${closing}
${idioma === "pt" ? "Escolha uma opção:" : "Choose an option:"}

${formattedQuestions}`;

  return response;
}

// Função para o frontend - Manipular cliques nas perguntas
function handleQuestionClick(element) {
  const question = decodeURIComponent(element.getAttribute('data-question'));
  
  // Adicionar a pergunta selecionada ao campo de entrada ou enviar diretamente
  // Esta função deve ser implementada no frontend
  
  // Exemplo de como enviar diretamente para o backend
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

// Função para estilizar as perguntas clicáveis (CSS para o frontend)
const clickableQuestionStyles = `
.clickable-question {
  padding: 12px 15px;
  margin: 8px 0;
  background-color: #f0f7ff;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid #3498db;
}

.clickable-question:hover {
  background-color: #d0e5ff;
  transform: translateX(5px);
}
`;

// Exportar funções adicionais se necessário
export { handleQuestionClick, clickableQuestionStyles };
