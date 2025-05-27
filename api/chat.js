// chat.js (ajustado para perguntas clicáveis geradas por GPT)

import { getSymptomContext } from "./notion.mjs";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GPT_MODEL = "gpt-4o-mini";

let sessionMemory = {
  sintomasDetectados: [],
  respostasUsuario: [],
  nome: "",
  idioma: "pt",
  sintomaAtual: null,
  categoriaAtual: null,
  funnelPhase: 1,
  usedQuestions: []
};

async function callGPT4oMini(symptomContext, userMessage) {
  try {
    const gptPrompt = symptomContext.gptPromptData?.prompt;
    const gptContext = symptomContext.gptPromptData?.context;

    if (!gptPrompt || !gptContext) {
      console.error("❌ Erro: prompt ou contexto não definido no symptomContext.gptPromptData");
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: GPT_MODEL,
        messages: [
          { role: "system", content: gptPrompt },
          { role: "user", content: gptContext.selectedQuestion
            ? `🧠 Pergunta selecionada do sistema: ${userMessage}`
            : userMessage }
        ],
        temperature: 0.7,
        max_tokens: 700
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (data.error) {
      console.error("Erro na API do GPT:", data.error);
      return null;
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error("Erro ao chamar GPT-4o mini:", error);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { message, name, age, sex, weight, selectedQuestion } = req.body;
  const userInput = selectedQuestion || message;
  const isPortuguese = /[ãõçáéíóú]| você|dor|tenho|problema|saúde/i.test(userInput);
  const idioma = sessionMemory.idioma || (isPortuguese ? "pt" : "en");

  const userName = name?.trim() || "";
  sessionMemory.nome = userName;
  sessionMemory.idioma = idioma;
  sessionMemory.respostasUsuario.push(userInput);

  const userAge = parseInt(age);
  const userWeight = parseFloat(weight);
  const hasForm = userName && !isNaN(userAge) && sex && !isNaN(userWeight);

  const context = await getSymptomContext(
    userInput,
    userName,
    userAge,
    userWeight,
    sessionMemory.funnelPhase,
    sessionMemory.sintomaAtual,
    sessionMemory.usedQuestions
  );

  if (!context.gptPromptData?.prompt || !context.gptPromptData?.context) {
    console.error("❌ gptPromptData não definido corretamente:", context);
    return res.status(200).json({
      choices: [{
        message: {
          content: idioma === "pt"
            ? "Desculpe, algo falhou ao processar seu sintoma. Tente reformular sua frase."
            : "Sorry, something went wrong processing your symptom. Please try rephrasing.",
          followupQuestions: []
        }
      }]
    });
  }

  if (context.sintoma) sessionMemory.sintomaAtual = context.sintoma;

  const gptResponse = await callGPT4oMini(context, userInput);
  const followupQuestions = await generateFollowUpQuestions(context);

  sessionMemory.usedQuestions.push(...followupQuestions);
  sessionMemory.funnelPhase = Math.min((sessionMemory.funnelPhase || 1) + 1, 6);

  const content = formatHybridResponse(gptResponse, followupQuestions, idioma);

  return res.status(200).json({
    choices: [{
      message: {
        content,
        followupQuestions
      }
    }]
  });
}

async function generateFollowUpQuestions(context) {
  const followPrompt = `Com base no problema descrito, crie 3 perguntas curtas e provocadoras para conduzir o usuário à próxima etapa do funil. Fase atual: ${context.gptPromptData?.context.funnelPhase}. Idioma: ${context.language}. Apenas as perguntas, sem explicações.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: GPT_MODEL,
        messages: [
          { role: "system", content: followPrompt },
          { role: "user", content: context.sintoma }
        ],
        temperature: 0.6,
        max_tokens: 150
      })
    });

    const data = await response.json();
    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content
        .split("\n")
        .filter(line => line.trim())
        .map(q => q.replace(/^\d+\.\s*/, "").trim())
        .slice(0, 3);
    }
    return [];
  } catch (err) {
    console.error("Erro ao gerar perguntas GPT:", err);
    return [];
  }
}

function formatHybridResponse(gptResponse, followupQuestions, language) {
  const phaseTitle = language === "pt" ? "Vamos explorar mais:" : "Let's explore further:";
  const instruction = language === "pt"
    ? "Escolha uma das opções abaixo para continuarmos:"
    : "Choose one of the options below to continue:";

  let response = gptResponse?.trim() || "";

  if (followupQuestions.length) {
    response += `\n\n${phaseTitle}\n${instruction}\n\n`;
    followupQuestions.forEach((q, i) => {
      response += `<div class="clickable-question" data-question="${encodeURIComponent(q)}" onclick="handleQuestionClick(this)">${i + 1}. ${q}</div>\n`;
    });
  }

  return response;
}
