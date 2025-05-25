import { getSymptomContext } from "./notion.mjs"; 

// Memória de sessão para manter contexto e progressão do funil
let sessionMemory = {
  sintomasDetectados: [],
  respostasUsuario: [],
  nome: "",
  idioma: "pt",
  sintomaAtual: null,
  funnelPhase: 1,
  ultimasPerguntas: [],
  lastSelectedQuestion: ""
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
    
    // Detectar idioma na primeira mensagem e manter consistente
    if (sessionMemory.respostasUsuario.length === 0) {
      const isPortuguese = /[ãõçáéíóú]| você|dor|tenho|problema|saúde/i.test(userInput);
      sessionMemory.idioma = isPortuguese ? "pt" : "en";
    }
    
    const userName = name?.trim() || sessionMemory.nome || "";
    const userAge = parseInt(age) || null;
    const userSex = (sex || "").toLowerCase();
    const userWeight = parseFloat(weight) || null;
    
    // Atualizar memória da sessão
    sessionMemory.nome = userName;
    sessionMemory.respostasUsuario.push(userInput);
    
    // Verificar se a pergunta selecionada indica avanço no funil
    if (selectedQuestion) {
      sessionMemory.lastSelectedQuestion = selectedQuestion;
      
      // Avançar fase do funil com base na pergunta selecionada
      if (shouldAdvanceFunnel(selectedQuestion)) {
        sessionMemory.funnelPhase = Math.min(sessionMemory.funnelPhase + 1, 4);
      }
    }
    
    // Forçar avanço do funil após várias interações
    if (sessionMemory.respostasUsuario.length > 3 && sessionMemory.funnelPhase < 2) {
      sessionMemory.funnelPhase = 2;
    }
    if (sessionMemory.respostasUsuario.length > 5 && sessionMemory.funnelPhase < 3) {
      sessionMemory.funnelPhase = 3;
    }
    if (sessionMemory.respostasUsuario.length > 7 && sessionMemory.funnelPhase < 4) {
      sessionMemory.funnelPhase = 4;
    }

    // Obter contexto do sintoma com a fase atual do funil
    const symptomContext = await getSymptomContext(
      userInput, 
      userName, 
      userAge, 
      userWeight, 
      sessionMemory.funnelPhase
    );
    
    // Atualizar a memória da sessão com o sintoma detectado
    if (symptomContext.sintoma) {
      sessionMemory.sintomaAtual = symptomContext.sintoma;
    }

    // Construir a resposta formatada com explicação e perguntas clicáveis
    let responseContent = formatResponse(symptomContext, sessionMemory.idioma, { 
      name: userName, 
      age: userAge, 
      weight: userWeight,
      funnelPhase: sessionMemory.funnelPhase
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

// Função para verificar se deve avançar no funil com base na pergunta selecionada
function shouldAdvanceFunnel(question) {
  const lowerQuestion = question.toLowerCase();
  
  // Palavras-chave que indicam interesse em avançar no funil
  const advancementKeywords = [
    "plant", "planta", "natural", "supplement", "suplemento", 
    "nutrient", "nutriente", "solution", "solução", "option", "opção",
    "risk", "risco", "danger", "perigo", "worse", "pior",
    "try", "experimentar", "know", "conhecer", "learn", "aprender"
  ];
  
  // Verificar se a pergunta contém palavras-chave de avanço
  return advancementKeywords.some(keyword => lowerQuestion.includes(keyword));
}

// Função para formatar a resposta com explicação e perguntas clicáveis
function formatResponse(symptomContext, idioma, userData) {
  const { intro, scientificExplanation, followupQuestions } = symptomContext;
  const { name, funnelPhase } = userData || {};
  
  // Títulos adaptados à fase do funil e idioma
  let titleSection, questionsTitle;
  
  if (idioma === "pt") {
    // Títulos em português
    switch(funnelPhase) {
      case 1:
        titleSection = "### A verdade que você precisa ouvir:";
        questionsTitle = "### E agora, o que você vai fazer a respeito?";
        break;
      case 2:
        titleSection = "### O que você está realmente arriscando:";
        questionsTitle = "### Está pronto para agir ou prefere continuar sofrendo?";
        break;
      case 3:
        titleSection = "### Soluções que realmente funcionam:";
        questionsTitle = "### Quer saber mais ou vai continuar ignorando?";
        break;
      case 4:
        titleSection = "### A solução que você precisa agora:";
        questionsTitle = "### Pronto para transformar sua saúde?";
        break;
      default:
        titleSection = "### A verdade que você precisa ouvir:";
        questionsTitle = "### E agora, o que você vai fazer a respeito?";
    }
  } else {
    // Títulos em inglês
    switch(funnelPhase) {
      case 1:
        titleSection = "### The truth you need to hear:";
        questionsTitle = "### And now, what are you going to do about it?";
        break;
      case 2:
        titleSection = "### What you're really risking:";
        questionsTitle = "### Are you ready to act or do you prefer to keep suffering?";
        break;
      case 3:
        titleSection = "### Solutions that actually work:";
        questionsTitle = "### Want to know more or will you keep ignoring it?";
        break;
      case 4:
        titleSection = "### The solution you need right now:";
        questionsTitle = "### Ready to transform your health?";
        break;
      default:
        titleSection = "### The truth you need to hear:";
        questionsTitle = "### And now, what are you going to do about it?";
    }
  }
  
  // Texto de instrução para as perguntas
  const instructionText = idioma === "pt" 
    ? "Escolha seu próximo passo (se tiver coragem):"
    : "Choose your next step (if you have the courage):";
  
  // Construir a resposta formatada
  let response = `${intro}\n\n${titleSection}\n${scientificExplanation}\n\n${questionsTitle}\n${instructionText}\n\n`;
  
  // Adicionar perguntas clicáveis
  followupQuestions.forEach((question, index) => {
    response += `<div class="clickable-question" data-question="${encodeURIComponent(question)}" onclick="handleQuestionClick(this)">
      ${index + 1}. ${question}
    </div>\n`;
  });
  
  // Adicionar CTA específico na fase 4
  if (funnelPhase === 4) {
    const ctaText = idioma === "pt"
      ? `<div class="supplement-cta">Clique aqui para conhecer o suplemento que já ajudou milhares de pessoas com os mesmos sintomas que você!</div>`
      : `<div class="supplement-cta">Click here to discover the supplement that has already helped thousands of people with the same symptoms as you!</div>`;
    
    response += `\n${ctaText}`;
  }
  
  return response;
}
