import { getSymptomContext } from "./notion.mjs";
import { fallbackTextsBySymptom } from "./fallbackTextsBySymptom.js";

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

// Função rewriteWithGPT adaptada para traduzir se idioma for pt
async function rewriteWithGPT(baseText, sintoma, idioma, funnelPhase) {
  const prompt = idioma === "pt"
    ? `Use the following English text as a base. Translate it to Portuguese and rewrite it with 30% creative freedom, making it more natural, engaging, and human. Do not change the topic and keep focus on: ${sintoma}\n\nBase text:\n${baseText}`
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
        messages: [{ role: "system", content: prompt }],
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

// Geração de perguntas finais
async function generateFollowUpQuestions(context, idioma) {
  const usedQuestions = sessionMemory.usedQuestions || [];
  const symptom = context.sintoma || "symptom";
  const phase = context.funnelPhase || 1;

  const promptPT = `
Você é um assistente de saúde inteligente e provocador. Com base no sintoma "${symptom}" e na fase do funil ${phase}, gere 3 perguntas curtas, provocativas e instigantes que levem o usuário para a próxima etapa. 
Evite repetir estas perguntas já feitas: ${usedQuestions.join("; ")}.
As perguntas devem ser distintas, relacionadas ao sintoma e fase, e ter gancho forte de curiosidade, dor, emergência ou solução.

Retorne apenas as 3 perguntas numeradas.
`;

  const promptEN = `
You are a smart and provocative health assistant. Based on the symptom "${symptom}" and funnel phase ${phase}, generate 3 short, provocative, and engaging questions to guide the user to the next step.
Avoid repeating these previously asked questions: ${usedQuestions.join("; ")}.
Questions must be distinct, related to the symptom and phase, with strong hooks around curiosity, pain, urgency or solution.

Return only the 3 numbered questions.
`;

  const prompt = idioma === "pt" ? promptPT : promptEN;

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
        temperature: 0.75,
        max_tokens: 300
      })
    });

    const data = await response.json();
    let questionsRaw = data.choices?.[0]?.message?.content || "";
    let questions = questionsRaw.split(/\d+\.\s+/).filter(Boolean).slice(0, 3);

    // Filtrar perguntas repetidas (exato match)
    questions = questions.filter(q => !usedQuestions.includes(q));

    // Atualiza as perguntas usadas na sessão
    sessionMemory.usedQuestions.push(...questions);

    // Se menos de 3 perguntas após filtro, adiciona fallback interno
    const fallbackPT = [
      "Você já tentou mudar sua alimentação ou rotina?",
      "Como você acha que isso está afetando seu dia a dia?",
      "Está disposto(a) a descobrir uma solução mais eficaz agora?"
    ];
    const fallbackEN = [
      "Have you tried adjusting your diet or lifestyle?",
      "How do you think this is affecting your daily life?",
      "Are you ready to explore a better solution now?"
    ];

    if (questions.length < 3) {
      const fallback = idioma === "pt" ? fallbackPT : fallbackEN;
      for (const fq of fallback) {
        if (questions.length >= 3) break;
        if (!sessionMemory.usedQuestions.includes(fq)) {
          questions.push(fq);
          sessionMemory.usedQuestions.push(fq);
        }
      }
    }

    return questions.slice(0, 3);

  } catch (err) {
    console.warn("❗️Erro ao gerar perguntas com GPT:", err);
    return idioma === "pt"
      ? [
          "Você já tentou mudar sua alimentação ou rotina?",
          "Como você acha que isso está afetando seu dia a dia?",
          "Está disposto(a) a descobrir uma solução mais eficaz agora?"
        ]
      : [
          "Have you tried adjusting your diet or lifestyle?",
          "How do you think this is affecting your daily life?",
          "Are you ready to explore a better solution now?"
        ];
  }
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
      response += `<div class="clickable-question" data-question="${encodeURIComponent(q)}" onclick="handleQuestionClick(this)">${i + 1}. ${q}</div>\n`;
    });
  }

  return response;
}

// Identificação primária do sintoma (exata)
async function identifySymptom(userInput, symptomsList, idioma) {
  const promptPT = `
Você é um assistente que identifica o sintoma mais próximo de uma lista dada, a partir do texto do usuário. 
A lista de sintomas é:
${symptomsList.join(", ")}

Dado o texto do usuário:
"${userInput}"

Responda apenas com o sintoma da lista que melhor corresponde ao texto do usuário. Use exatamente o texto da lista. Se não reconhecer, responda "unknown".
  `;

  const promptEN = `
You are an assistant that identifies the closest symptom from a given list, based on the user's text.
The list of symptoms is:
${symptomsList.join(", ")}

Given the user's input:
"${userInput}"

Answer only with the symptom from the list that best matches the user's text. Use the exact text from the list. If no match, respond "unknown".
  `;

  const prompt = idioma === "pt" ? promptPT : promptEN;

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
          { role: "system", content: "You are a precise symptom matcher." },
          { role: "user", content: prompt }
        ],
        temperature: 0,
        max_tokens: 20
      })
    });

    const data = await response.json();
    const match = data.choices?.[0]?.message?.content.trim() || "unknown";
    return match.toLowerCase();
  } catch (e) {
    console.error("Erro ao identificar sintoma:", e);
    return "unknown";
  }
}

// Fallback semântico para sintoma similar
async function identifyClosestKnownSymptom(userInput, symptomsList, idioma) {
  const promptPT = `
Você é um assistente que associa a uma lista de sintomas conhecidos o texto do usuário que pode estar descrito de forma vaga ou diferente.
A lista de sintomas é:
${symptomsList.join(", ")}

Dado o texto do usuário:
"${userInput}"

Responda apenas com o sintoma da lista que é semanticamente mais próximo do texto do usuário. Use exatamente o texto da lista. Se não conseguir associar, responda "unknown".
  `;

  const promptEN = `
You are an assistant that associates to a list of known symptoms the user's input text that might be vague or described differently.
The list of symptoms is:
${symptomsList.join(", ")}

Given the user's input:
"${userInput}"

Answer only with the symptom from the list that is semantically closest to the user's text. Use the exact text from the list. If you can't associate, respond "unknown".
  `;

  const prompt = idioma === "pt" ? promptPT : promptEN;

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
          { role: "system", content: "You are a semantic symptom matcher for fallback." },
          { role: "user", content: prompt }
        ],
        temperature: 0,
        max_tokens: 20
      })
    });

    const data = await response.json();
    const match = data.choices?.[0]?.message?.content.trim() || "unknown";
    return match.toLowerCase();
  } catch (e) {
    console.error("Erro ao identificar sintoma fallback:", e);
    return "unknown";
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { message, name, age, sex, weight, selectedQuestion } = req.body;
  const userInput = selectedQuestion || message;

  // Detecta idioma do usuário
  const isPortuguese = /[\u00e3\u00f5\u00e7áéíóú]| você|dor|tenho|problema|saúde/i.test(userInput);
  const idiomaDetectado = isPortuguese ? "pt" : "en";
  sessionMemory.idioma = sessionMemory.respostasUsuario.length === 0 ? idiomaDetectado : sessionMemory.idioma;
  const idioma = sessionMemory.idioma;

  const allSymptoms = Object.keys(fallbackTextsBySymptom);

  // Primeiro tenta identificar sintoma exato
  let identifiedSymptom = await identifySymptom(userInput, allSymptoms, idioma);

  // Se não achar, tenta fallback semântico para sintoma próximo
  if (identifiedSymptom === "unknown") {
    const fallbackSymptom = await identifyClosestKnownSymptom(userInput, allSymptoms, idioma);
    sessionMemory.sintomaAtual = fallbackSymptom !== "unknown" ? fallbackSymptom : userInput.toLowerCase();
  } else {
    sessionMemory.sintomaAtual = identifiedSymptom;
  }

  sessionMemory.nome = name?.trim() || "";
  sessionMemory.respostasUsuario.push(userInput);

  const userAge = parseInt(age);
  const userWeight = parseFloat(weight);

  // Busca contexto da tabela Notion
  let context = await getSymptomContext(
    sessionMemory.sintomaAtual,
    sessionMemory.nome,
    userAge,
    userWeight,
    sessionMemory.funnelPhase,
    sessionMemory.sintomaAtual,
    sessionMemory.usedQuestions
  );

  if (context.sintoma && !sessionMemory.sintomaAtual) sessionMemory.sintomaAtual = context.sintoma;
  if (context.categoria && !sessionMemory.categoriaAtual) sessionMemory.categoriaAtual = context.categoria;

  // Caso não encontre texto na tabela, usa fallback local
  if (!context.funnelTexts || Object.keys(context.funnelTexts).length === 0) {
    const fallbackTexts = fallbackTextsBySymptom[sessionMemory.sintomaAtual?.toLowerCase()] || {};
    const funnelKey = getFunnelKey(sessionMemory.funnelPhase);
    let fallbackPhaseTexts = fallbackTexts[funnelKey] || [];

    if (fallbackPhaseTexts.length === 0) {
      const noContentMsg = idioma === "pt"
        ? "Desculpe, não encontrei informações suficientes para essa fase. Tente reformular sua frase."
        : "Sorry, I couldn't find enough information for this step. Please try rephrasing your input.";

      const fallbackQuestions = await generateFollowUpQuestions(context, idioma);

      const content = formatHybridResponse(context, noContentMsg, fallbackQuestions, idioma);
      return res.status(200).json({
        choices: [{ message: { content, followupQuestions: fallbackQuestions || [] } }]
      });
    }

    const baseText = fallbackPhaseTexts[Math.floor(Math.random() * fallbackPhaseTexts.length)];
    const fallbackResponse = await rewriteWithGPT(baseText, sessionMemory.sintomaAtual, idioma, sessionMemory.funnelPhase);
    const fallbackQuestions = await generateFollowUpQuestions(context, idioma);

    const content = formatHybridResponse(context, fallbackResponse, fallbackQuestions, idioma);
    return res.status(200).json({
      choices: [{ message: { content, followupQuestions: fallbackQuestions || [] } }]
    });
  }

  // Busca texto da fase atual na tabela
  const funnelKey = getFunnelKey(sessionMemory.funnelPhase);
  let funnelTexts = context.funnelTexts?.[funnelKey] || [];

  if (!funnelTexts.length) {
    const fallbackTexts = fallbackTextsBySymptom[sessionMemory.sintomaAtual?.toLowerCase().trim()] || {};
    funnelTexts = fallbackTexts[funnelKey] || [];
  }

  if (!funnelTexts.length) {
    funnelTexts = [
      idioma === "pt"
        ? "Desculpe, ainda não temos conteúdo para esse sintoma e etapa. Tente outro sintoma ou reformule sua pergunta."
        : "Sorry, we don’t have content for this symptom and phase yet. Please try another symptom or rephrase your query."
    ];
  }

  const baseText = funnelTexts[Math.floor(Math.random() * funnelTexts.length)];

  const gptResponse = baseText
    ? await rewriteWithGPT(baseText, sessionMemory.sintomaAtual, idioma, sessionMemory.funnelPhase)
    : await rewriteWithGPT(
        `Explain clearly about the symptom ${sessionMemory.sintomaAtual} in phase ${sessionMemory.funnelPhase}, focusing on phase key ${funnelKey}`,
        sessionMemory.sintomaAtual,
        idioma,
        sessionMemory.funnelPhase
      );

  const followupQuestions = await generateFollowUpQuestions(
    { sintoma: sessionMemory.sintomaAtual, funnelPhase: sessionMemory.funnelPhase },
    idioma
  );

  sessionMemory.funnelPhase = Math.min((context.funnelPhase || sessionMemory.funnelPhase || 1) + 1, 6);

  console.log("🧪 Sintoma detectado:", context.sintoma);
  console.log("🧪 Categoria atual:", sessionMemory.categoriaAtual);
  console.log("🧪 Fase atual:", sessionMemory.funnelPhase);
  console.log("🧪 Texto da fase:", funnelKey, funnelTexts);

  const content = formatHybridResponse(context, gptResponse, followupQuestions, idioma);

  return res.status(200).json({
    choices: [{ message: { content, followupQuestions: followupQuestions || [] } }]
  });
}
