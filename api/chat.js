// chat.js (atualizado para integração total com tabela Notion e funil híbrido)

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

async function callGPT(prompt, context, userMessage) {
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
          { role: "system", content: context.prompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 700
      })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.error("Erro GPT:", err);
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

  if (context.sintoma) sessionMemory.sintomaAtual = context.sintoma;
  sessionMemory.usedQuestions.push(...context.followupQuestions);

  const gptResponse = await callGPT(context.prompt, context.context, userInput);
  const content = formatHybridResponse(context, gptResponse);
  sessionMemory.funnelPhase = Math.min((sessionMemory.funnelPhase || 1) + 1, 6);

  return res.status(200).json({
    choices: [{
      message: {
        content,
        followupQuestions: context.followupQuestions
      }
    }]
  });
}

function formatHybridResponse(context, gptResponse) {
  const { intro, scientificExplanation, followupQuestions, language } = context;
  const phaseTitle = language === "pt" ? "Vamos explorar mais:" : "Let's explore further:";
  const instruction = language === "pt"
    ? "Escolha uma das opções abaixo para continuarmos:"
    : "Choose one of the options below to continue:";

  let response = `${intro}\n\n${scientificExplanation}\n\n${phaseTitle}\n${instruction}\n\n`;
  followupQuestions.forEach((q, i) => {
    response += `<div class="clickable-question" data-question="${encodeURIComponent(q)}" onclick="handleQuestionClick(this)">${i + 1}. ${q}</div>\n`;
  });

  return response;
} 
