// chat.js (ajuste para manter o sintoma em follow-ups)
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

function getFunnelKey(phase) {
  switch (phase) {
    case 1: return "base";
    case 2: return "gravidade";
    case 3: return "estatisticas";
    case 4: return "nutrientes";
    case 5: return "suplemento";
    case 6: return "cta";
    default: return "base";
  }
}

async function rewriteWithGPT(baseText, sintoma, idioma) {
  const prompt = idioma === "pt"
    ? `Use o seguinte texto como base, mantendo o conteúdo e estrutura, mas reescrevendo com 30% de liberdade criativa, usando linguagem mais fluida, provocadora e humana. Não mude o tema e mantenha o foco em: ${sintoma}\n\nTexto-base:\n${baseText}`
    : `Use the following text as a base. Keep the core message and structure, but rewrite with 30% creative freedom in a more natural, engaging, and human tone. Do not change the topic and keep the focus on: ${sintoma}\n\nBase text:\n${baseText}`;

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
          { role: "system", content: prompt }
        ],
        temperature: 0.65,
        max_tokens: 600
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || baseText;
  } catch (e) {
    console.error("Erro ao reescrever com GPT:", e);
    return baseText;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { message, name, age, sex, weight, selectedQuestion } = req.body;
  const userInput = selectedQuestion || message;
  const isFollowUp = Boolean(selectedQuestion); // 🔧 identificar se é pergunta clicada
  const inputForSearch = isFollowUp ? sessionMemory.sintomaAtual : userInput; // 🔧 manter sintoma original em follow-ups

  const isPortuguese = /[\u00e3\u00f5\u00e7áéíóú]| você|dor|tenho|problema|saúde/i.test(userInput);
  const idiomaDetectado = isPortuguese ? "pt" : "en";

  sessionMemory.idioma = sessionMemory.respostasUsuario.length === 0 ? idiomaDetectado : sessionMemory.idioma;
  const idioma = sessionMemory.idioma;

  sessionMemory.nome = name?.trim() || "";
  sessionMemory.respostasUsuario.push(userInput);

  const userAge = parseInt(age);
  const userWeight = parseFloat(weight);

  const context = await getSymptomContext(
    inputForSearch,
    sessionMemory.nome,
    userAge,
    userWeight,
    sessionMemory.funnelPhase,
    sessionMemory.sintomaAtual,
    sessionMemory.usedQuestions
  );

  if (!context.funnelTexts) {
    console.error("❌ funnelTexts não definido corretamente:", context);
    return res.status(200).json({
      choices: [
        {
          message: {
            content: idioma === "pt"
              ? "Desculpe, não encontrei informações suficientes para essa fase. Tente reformular sua frase."
              : "Sorry, I couldn't find enough information for this step. Please try rephrasing your input.",
            followupQuestions: []
          }
        }
      ]
    });
  }

  if (context.sintoma && sessionMemory.funnelPhase < 6) {
    sessionMemory.sintomaAtual = sessionMemory.sintomaAtual || context.sintoma;
  } else if (context.sintoma && sessionMemory.funnelPhase >= 6) {
    sessionMemory.sintomaAtual = context.sintoma;
  }

  sessionMemory.usedQuestions.push(...(context.followupQuestions || []));

  const funnelKey = getFunnelKey(sessionMemory.funnelPhase);
  const funnelTexts = context.funnelTexts?.[funnelKey] || [];
  const baseText = funnelTexts.length > 0
    ? funnelTexts[Math.floor(Math.random() * funnelTexts.length)]
    : null;

  const gptResponse = baseText
    ? await rewriteWithGPT(baseText, sessionMemory.sintomaAtual, idioma)
    : "We couldn't find the right content for this step.";

  const followupQuestions = await generateFollowUpQuestions(context, idioma);
  sessionMemory.funnelPhase = Math.min((context.funnelPhase || sessionMemory.funnelPhase || 1) + 1, 6);

  // 🔧 DEBUG LOGS
  console.log("🧪 Sintoma detectado:", context.sintoma);
  console.log("🧪 Fase atual:", sessionMemory.funnelPhase);
  console.log("🧪 Texto da fase:", funnelKey, funnelTexts);

  const content = formatHybridResponse(context, gptResponse, followupQuestions, idioma);

  return res.status(200).json({
    choices: [
      {
        message: {
          content,
          followupQuestions: followupQuestions || []
        }
      }
    ]
  });
}

function formatHybridResponse(context, gptResponse, followupQuestions, idioma) {
  const phaseTitle = idioma === "pt" ? "Vamos explorar mais:" : "Let's explore further:";
  const instruction = idioma === "pt"
    ? "Escolha uma das opções abaixo para continuarmos:"
    : "Choose one of the options below to continue:";

  let response = gptResponse?.trim() || "";

  if (followupQuestions.length) {
    response += `\n\n${phaseTitle}\n${instruction}\n\n`;
    followupQuestions.slice(0, 3).forEach((q, i) => {
      response += `<div class=\"clickable-question\" data-question=\"${encodeURIComponent(q)}\" onclick=\"handleQuestionClick(this)\">${i + 1}. ${q}</div>\n`;
    });
  }

  return response;
}

// 🔧 generateFollowUpQuestions função segue abaixo...
// (essa parte você já incluiu corretamente antes)
// 🔧 Função para gerar perguntas finais com fallback
async function generateFollowUpQuestions(context, idioma) {
  const prompt = idioma === "pt"
    ? `Com base no sintoma \"${context.sintoma}\" e na fase do funil ${context.funnelPhase}, gere 3 perguntas curtas, provocativas e instigantes para conduzir o usuário para a próxima etapa.`
    : `Based on the symptom \"${context.sintoma}\" and funnel phase ${context.funnelPhase}, generate 3 short, provocative, and engaging questions to guide the user to the next step.`;

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
          { role: "system", content: "You generate only 3 relevant and persuasive questions. No extra explanation." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    return text.split(/\d+\.\s+/).filter(Boolean).slice(0, 3);
  } catch (err) {
    console.warn("❗️Erro ao gerar perguntas com GPT:", err);
    return [
      idioma === "pt" ? "Você já tentou mudar sua alimentação ou rotina?" : "Have you tried adjusting your diet or lifestyle?",
      idioma === "pt" ? "Como você acha que isso está afetando seu dia a dia?" : "How do you think this is affecting your daily life?",
      idioma === "pt" ? "Está disposto(a) a descobrir uma solução mais eficaz agora?" : "Are you ready to explore a better solution now?"
    ];
  }
}
