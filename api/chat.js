import { getSymptomContext } from "./notion.mjs"; 

let sessionMemory = {
  sintomasDetectados: [],
  respostasUsuario: [],
  nome: "",
  idioma: "pt",
  sintomaAtual: null,
  categoriaAtual: null,
  contadorPerguntas: {},
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

    // Obter contexto do sintoma do Notion com dados do usuário para personalização
    const symptomContext = await getSymptomContext(userInput, userName, userAge, userWeight);
    
    // Atualizar a memória da sessão com o sintoma detectado
    if (symptomContext.sintoma) {
      sessionMemory.sintomaAtual = symptomContext.sintoma;
    }

    // Construir a resposta formatada com explicação científica e perguntas clicáveis
    let responseContent = formatResponse(symptomContext, idioma, { name: userName, age: userAge, weight: userWeight });
    
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

// Função para formatar a resposta com explicação científica e perguntas clicáveis no estilo Owl Savage
function formatResponse(symptomContext, idioma, userData) {
  const { intro, scientificExplanation, followupQuestions } = symptomContext;
  const { name, age, weight } = userData || {};
  const hasUserData = name && age && weight;
  
  // Título da seção científica com tom provocador
  const scientificTitle = idioma === "pt" ? 
    "### A verdade que você precisa ouvir:" : 
    "### The truth you need to hear:";
  
  // Título da seção de perguntas com desafio
  const questionsTitle = idioma === "pt" ? 
    "### E agora, o que você vai fazer a respeito?" : 
    "### And now, what are you going to do about it?";
  
  // Texto de instrução para as perguntas com tom de desafio
  const instructionText = idioma === "pt" 
    ? "Escolha seu próximo passo (se tiver coragem):" 
    : "Choose your next step (if you have the courage):";
  
  // Construir a resposta formatada com o estilo Owl Savage
  let response = `${intro}\n\n${scientificTitle}\n${scientificExplanation}\n\n${questionsTitle}\n${instructionText}\n\n`;
  
  // Adicionar perguntas clicáveis que conduzem ao funil
  followupQuestions.forEach((question, index) => {
    response += `<div class="clickable-question" data-question="${encodeURIComponent(question)}" onclick="handleQuestionClick(this)">
      ${index + 1}. ${question}
    </div>\n`;
  });
  
  return response;
}

// Função para gerar estatísticas de funil com base na fase atual
function getFunnelStatistics(symptom, phase, language) {
  // Estatísticas para fase de diagnóstico
  const diagnosisStats = {
    pt: [
      "42% das pessoas com seus sintomas estão ignorando um problema potencialmente sério.",
      "Estudos mostram que 38% dos casos como o seu pioram significativamente em 3 meses.",
      "Cerca de 45% das pessoas com seu perfil desenvolvem complicações se não tratarem adequadamente."
    ],
    en: [
      "42% of people with your symptoms are ignoring a potentially serious problem.",
      "Studies show that 38% of cases like yours get significantly worse within 3 months.",
      "About 45% of people with your profile develop complications if they don't treat properly."
    ]
  };
  
  // Estatísticas para fase de agravamento
  const aggravationStats = {
    pt: [
      "67% dos problemas ignorados evoluem para condições crônicas que exigem tratamento prolongado.",
      "Pessoas que adiam o tratamento têm 58% mais chances de desenvolver complicações graves.",
      "73% dos casos não tratados adequadamente resultam em limitações permanentes da qualidade de vida."
    ],
    en: [
      "67% of ignored problems evolve into chronic conditions requiring prolonged treatment.",
      "People who delay treatment are 58% more likely to develop serious complications.",
      "73% of cases not properly treated result in permanent limitations to quality of life."
    ]
  };
  
  // Estatísticas para fase de solução
  const solutionStats = {
    pt: [
      "Plantas medicinais específicas podem reduzir seus sintomas em até 78% em apenas 30 dias.",
      "85% das pessoas que usam suplementos naturais adequados relatam melhora significativa.",
      "Nutrientes específicos podem resolver a causa raiz do seu problema em 92% dos casos."
    ],
    en: [
      "Specific medicinal plants can reduce your symptoms by up to 78% in just 30 days.",
      "85% of people who use appropriate natural supplements report significant improvement.",
      "Specific nutrients can solve the root cause of your problem in 92% of cases."
    ]
  };
  
  // Selecionar conjunto de estatísticas com base na fase
  let statsSet;
  switch(phase) {
    case 1: statsSet = diagnosisStats; break;
    case 2: statsSet = aggravationStats; break;
    case 3: statsSet = solutionStats; break;
    default: statsSet = diagnosisStats;
  }
  
  // Retornar uma estatística aleatória
  return statsSet[language][Math.floor(Math.random() * statsSet[language].length)];
}

// Função para avançar no funil com base no histórico de conversa
function determineFunnelPhase(sessionMemory) {
  const messageCount = sessionMemory.respostasUsuario.length;
  
  // Lógica simples de progressão do funil baseada no número de interações
  if (messageCount <= 2) return 1; // Fase de diagnóstico
  if (messageCount <= 4) return 2; // Fase de agravamento
  return 3; // Fase de solução/suplemento
}
