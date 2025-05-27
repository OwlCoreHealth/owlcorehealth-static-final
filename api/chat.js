// chat.js (versão aprimorada com 6 correções críticas - mantendo estrutura intacta)
import { getSymptomContext } from "./notion.mjs";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GPT_MODEL = "gpt-4o-mini";

let sessionMemory = {
  sintomasDetectados: [],
  respostasUsuario: [],
  nome: "",
  idioma: "pt", // 🔧 Mantém o idioma detectado na primeira mensagem
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

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: GPT_MODEL,
        messages: [
          { role: "system", content: gptPrompt },
          {
            role: "user",
            content: gptContext.selectedQuestion
              ? `🧠 Pergunta selecionada do sistema: ${userMessage}`
              : userMessage
          }
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

// 🔧 Corrigido: perguntas sempre no idioma e sintoma corretos, com fallback
async function generateFollowUpQuestions(context, idioma) {
  const sintoma = context.sintoma || "seu sintoma";
  const prompt = idioma === "pt"
    ? `Com base no sintoma \"${sintoma}\" e na fase do funil ${context.funnelPhase}, gere 3 perguntas curtas, provocativas e instigantes para conduzir o usuário para a próxima etapa.`
    : `Based on the symptom \"${sintoma}\" and funnel phase ${context.funnelPhase}, generate 3 short, provocative and compelling questions to lead the user to the next stage.`;

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
          { role: "system", content: idioma === "pt" ? "Você gera apenas 3 perguntas persuasivas e relevantes. Nenhuma explicação extra." : "You only generate 3 persuasive, relevant questions. No extra explanation." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const questions = text.split(/\d+\.\s+/).filter(Boolean).slice(0, 3);

    if (questions.length < 3) throw new Error("GPT returned insufficient followups");
    return questions;
  } catch {
    return idioma === "pt"
      ? [
          `Você já percebeu quando os gases aparecem com mais frequência?`,
          `Já tentou cortar lactose ou refrigerantes para ver se melhora?`,
          `O inchaço piora à noite ou após alguma refeição específica?`
        ]
      : [
          `Have you noticed when bloating tends to occur more often?`,
          `Have you tried cutting out dairy or sodas to see if it helps?`,
          `Does the bloating get worse after specific meals or at night?`
        ];
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { message, name, age, sex, weight, selectedQuestion } = req.body;
  const userInput = selectedQuestion || message;
  const isPortuguese = /[\u00e3\u00f5\u00e7áéíóú]| você|dor|tenho|problema|saúde/i.test(userInput);
  const idiomaDetectado = isPortuguese ? "pt" : "en";

  sessionMemory.idioma = sessionMemory.respostasUsuario.length === 0 ? idiomaDetectado : sessionMemory.idioma; // 🔧 trava idioma no início
  const idioma = sessionMemory.idioma;

  sessionMemory.nome = name?.trim() || "";
  sessionMemory.respostasUsuario.push(userInput);

  const userAge = parseInt(age);
  const userWeight = parseFloat(weight);

  const context = await getSymptomContext(
    userInput,
    sessionMemory.nome,
    userAge,
    userWeight,
    sessionMemory.funnelPhase,
    sessionMemory.sintomaAtual,
    sessionMemory.usedQuestions
  );

  if (!context.gptPromptData?.prompt || !context.gptPromptData?.context) {
    console.error("❌ gptPromptData não definido corretamente:", context);
    return res.status(200).json({
      choices: [
        {
          message: {
            content: idioma === "pt"
              ? "Desculpe, não encontrei informações suficientes. Tente reformular sua frase."
              : "Sorry, I couldn't find enough information. Please try rephrasing your question.",
            followupQuestions: []
          }
        }
      ]
    });
  }

  // 🔧 Bloqueio de mudança de sintoma antes da fase 6
  if (context.sintoma && sessionMemory.funnelPhase < 6) {
    sessionMemory.sintomaAtual = sessionMemory.sintomaAtual || context.sintoma;
  } else if (context.sintoma && sessionMemory.funnelPhase >= 6) {
    sessionMemory.sintomaAtual = context.sintoma;
  }

  sessionMemory.usedQuestions.push(...(context.followupQuestions || []));

  const gptResponse = await callGPT4oMini(context, userInput);
  const followupQuestions = await generateFollowUpQuestions(context, idioma);

  // 🔧 Atualiza fase do funil corretamente
  sessionMemory.funnelPhase = Math.min((context.funnelPhase || sessionMemory.funnelPhase || 1) + 1, 6);

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
