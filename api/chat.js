// chat.js - Integração com GPT-4o mini e progressão de funil
import { getSymptomContext } from './notion.mjs';
import fetch from 'node-fetch';

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

// Configuração da API OpenAI
const OPENAI_API_KEY = "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"; 
const GPT_MODEL = "gpt-4o-mini"; // Modelo GPT-4o mini

// Função para chamar a API do GPT-4o mini
async function callGPT4oMini(prompt, context, userMessage) {
  try {
    const messages = [
      {
        role: "system",
        content: prompt
      },
      {
        role: "user",
        content: JSON.stringify({
          message: userMessage,
          context: context
        })
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: GPT_MODEL,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        timeout: 30 // Timeout em segundos para evitar bloqueios
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro na API do OpenAI:", errorData);
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Erro ao chamar GPT-4o mini:", error);
    // Retornar null para usar fallback
    return null;
  }
}

export default async function handler(req, res) {
  try {
    // Verificar método HTTP
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed. Use POST." });
    }

    // Extrair dados da requisição
    const { message, name, age, sex, weight, selectedQuestion } = req.body;
    if (!message && !selectedQuestion) {
      return res.status(400).json({ error: "No message or selected question provided." });
    }

    // Usar a pergunta selecionada se disponível, caso contrário usar a mensagem do usuário
    const userInput = selectedQuestion || message;
    
    // Processar dados do usuário
    const userName = name?.trim() || sessionMemory.nome || "";
    const userAge = parseInt(age) || "";
    const userSex = (sex || "").toLowerCase();
    const userWeight = parseFloat(weight) || "";
    
    // Atualizar a memória da sessão
    sessionMemory.nome = userName;
    sessionMemory.respostasUsuario.push(userInput);

    // Determinar a fase atual do funil baseada no número de interações
    const numInteractions = sessionMemory.respostasUsuario.length;
    
    // Progressão do funil baseada no número de interações
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
    const symptomContext = await getSymptomContext(
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

    // Tentar obter resposta do GPT-4o mini
    let gptResponse = null;
    try {
      if (symptomContext.gptPromptData) {
        gptResponse = await callGPT4oMini(
          symptomContext.gptPromptData.prompt,
          symptomContext.gptPromptData.context,
          userInput
        );
      }
    } catch (gptError) {
      console.error("Erro ao chamar GPT-4o mini:", gptError);
      // Continuar com fallback
    }

    // Construir a resposta final (usando GPT se disponível, ou fallback)
    let responseContent;
    if (gptResponse) {
      // Usar a resposta do GPT, mas garantir que as perguntas de follow-up sejam as nossas
      responseContent = formatGPTResponse(gptResponse, symptomContext);
    } else {
      // Usar o fallback com nossa estrutura
      responseContent = formatResponse(symptomContext, symptomContext.language, sessionMemory.funnelPhase, { 
        name: userName, 
        age: userAge, 
        weight: userWeight 
      });
    }
    
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

// Função para formatar a resposta do GPT, garantindo que as perguntas de follow-up sejam as nossas
function formatGPTResponse(gptResponse, symptomContext) {
  try {
    // Extrair o conteúdo principal da resposta do GPT
    let mainContent = gptResponse;
    
    // Remover qualquer seção de perguntas que o GPT possa ter gerado
    const questionSectionMarkers = [
      "Escolha uma opção:",
      "Choose an option:",
      "Escolha seu próximo passo:",
      "Choose your next step:",
      "Perguntas:",
      "Questions:"
    ];
    
    for (const marker of questionSectionMarkers) {
      const index = mainContent.indexOf(marker);
      if (index !== -1) {
        mainContent = mainContent.substring(0, index);
      }
    }
    
    // Formatar as perguntas de follow-up como elementos clicáveis
    const formattedQuestions = symptomContext.followupQuestions.map((question, index) => {
      return `<div class="clickable-question" data-question="${encodeURIComponent(question)}" onclick="handleQuestionClick(this)">
        ${index + 1}. ${question}
      </div>`;
    }).join('\n');
    
    // Adicionar título para a seção de perguntas
    const questionTitle = symptomContext.language === "pt" ? 
      "Escolha uma opção:" : 
      "Choose an option:";
    
    // Montar a resposta completa
    return `${mainContent.trim()}

${questionTitle}

${formattedQuestions}`;
  } catch (error) {
    console.error("Erro ao formatar resposta do GPT:", error);
    // Fallback para formatação padrão
    return formatResponse(symptomContext, symptomContext.language, symptomContext.funnelPhase, {
      name: sessionMemory.nome,
      age: "",
      weight: ""
    });
  }
}

// Função para formatar a resposta com base na fase do funil (fallback)
function formatResponse(symptomContext, idioma, funnelPhase, userData) {
  const { intro, scientificExplanation, followupQuestions } = symptomContext;
  const { name, age, weight } = userData || {};
  
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
  
  // Formatar as perguntas de follow-up como elementos clicáveis
  const formattedQuestions = followupQuestions.map((question, index) => {
    return `<div class="clickable-question" data-question="${encodeURIComponent(question)}" onclick="handleQuestionClick(this)">
      ${index + 1}. ${question}
    </div>`;
  }).join('\n');
  
  // Montar a resposta completa
  const response = `${intro}

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
