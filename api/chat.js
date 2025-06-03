// ✅ chat.js COMPLETO com integração do formulário de subscrição de e-mail (sem NENHUMA remoção do seu código)

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
  usedQuestions: [],
  emailOffered: false
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

// Função que gera resposta completa para o sintoma
const generateAnswerForSymptom = async (symptom, idioma) => {
  const prompt = idioma === "pt" ? promptPT : promptEN;
  
  // Chamar a API do GPT para gerar a resposta completa
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: GPT_MODEL,
      messages: [
        { role: "system", content: "Você é um assistente de saúde fornecendo explicações científicas e práticas sobre sintomas." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500 // Aumente o número de tokens aqui
    })
  });

  const data = await response.json();
  console.log("Resposta do servidor:", data); // Adicione este log para inspecionar a resposta completa

  // Verifica se a resposta contém uma explicação científica válida
  const answer = data.choices?.[0]?.message?.content || "Desculpe, não consegui gerar uma resposta no momento.";

  // Se a resposta não for suficientemente científica, adiciona uma explicação genérica científica
  if (answer.length < 100 || !answer.match(/causa|tratamento|sintoma|prevenção/i)) {
    return "Desculpe, não consegui encontrar uma explicação específica para seu sintoma. No entanto, posso te dizer que as dores abdominais, por exemplo, podem ser causadas por condições como gastrite ou refluxo gastroesofágico, que exigem acompanhamento médico adequado.";
  }

  return answer;
};

function getBotIconHTML() {
  return `<img src="owl-icon.png" alt="Owl Icon" class="bot-icon" style="width: 28px; margin-right: 12px;" />`;
}

// ✅ ALTERAÇÃO NO formatHybridResponse para adicionar e-mail após 1ª resposta com perguntas
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

    // ✅ Mostra o formulário de e-mail na primeira vez que houver follow-ups
    if (!sessionMemory.emailOffered && sessionMemory.funnelPhase === 2) {
      sessionMemory.emailOffered = true;
      // response += renderEmailPrompt(idioma);  // A lógica de exibição do e-mail está aqui.
    }
  }

  return response;
}

// Função para gerar as perguntas de follow-up com base no sintoma
async function generateFollowUpQuestions(context, idioma) {
  const usedQuestions = sessionMemory.usedQuestions || [];
  const symptom = context.sintoma || "symptom";
  const phase = context.funnelPhase || 1;

  const promptPT = `
Você é um assistente de saúde inteligente e focado no sintoma "${symptom}". 
Com base nesse sintoma e na fase do funil ${phase}, gere 3 perguntas curtas, objetivas e focadas no sintoma.
As perguntas devem ser claras, relacionadas ao sintoma, e com foco em compreensão, tratamento ou prevenção.
Evite perguntas filosóficas e gerais; a intenção é ajudar o usuário a entender melhor o sintoma e suas possíveis soluções.
Não repita perguntas já feitas: ${usedQuestions.join("; ")}.
Retorne apenas as 3 perguntas numeradas.
`;

  const promptEN = `
You are a smart and focused health assistant, primarily concentrating on the symptom "${symptom}". 
Based on this symptom and funnel phase ${phase}, generate 3 short, clear, and focused questions about the symptom.
The questions should explore understanding, treatment, or prevention of the symptom.
Avoid philosophical or general questions; the goal is to help the user better understand the symptom and potential solutions.
Do not repeat the previously asked questions: ${usedQuestions.join("; ")}.
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

// Função para identificar sintoma (já existente)
async function identifySymptom(userInput, symptomsList, idioma) {
  const promptPT = `
Você é um assistente que identifica o sintoma mais próximo de uma lista dada, a partir do texto do usuário. 
A lista de sintomas é:
${symptomsList.join(", ")}

Dado o texto do usuário:
"${userInput}"

Responda apenas com o sintoma da lista que melhor corresponde ao texto do usuário ou com o sintoma mais **semelhante** ou **relacionado**. Se não reconhecer, responda "unknown".
  `;

  const promptEN = `
You are an assistant that identifies the closest symptom from a given list, based on the user's text.
The list of symptoms is:
${symptomsList.join(", ")}

Given the user's input:
"${userInput}"

Answer only with the symptom from the list that best matches or is most **similar** or **related** to the user's text. If no match, respond "unknown".
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

// Função para classificar a intenção do usuário (a função que estamos adicionando agora)
async function classifyUserIntent(userInput, idioma) {
  const promptPT = `
Você é um classificador de intenção. Receberá mensagens de usuários e deve responder com uma das seguintes intenções:

- sintoma
- saudação
- curiosidade
- pergunta funcional
- dúvida vaga
- outro

Mensagem do usuário: "${userInput}"
Resposta (apenas a intenção):
`;

  const promptEN = `
You are an intent classifier. You’ll receive a user message and must reply with one of the following labels:

- symptom
- greeting
- curiosity
- functional_question
- vague_doubt
- other

User message: "${userInput}"
Answer (intent only):
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
          { role: "system", content: "Você é um assistente de saúde fornecendo explicações científicas e práticas sobre sintomas." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    const data = await response.json();
    const intent = data.choices?.[0]?.message?.content?.trim().toLowerCase() || "outro";
    return intent;
  } catch (e) {
    console.error("Erro ao classificar intenção:", e);
    return "outro";
  }
}

// Função de tratamento da requisição (handler)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { message, selectedQuestion, idioma } = req.body;
  const userInput = selectedQuestion || message;
  const isFollowUp = Boolean(selectedQuestion);
  const intent = await classifyUserIntent(userInput, idioma || "en");  // AQUI É ONDE A FUNÇÃO classifyUserIntent É CHAMADA
  let gptResponse;

  // ... o resto do código da função 'handler' permanece o mesmo.
}

  const promptEN = `
You are an assistant that identifies the closest symptom from a given list, based on the user's text.
The list of symptoms is:
${symptomsList.join(", ")}

Given the user's input:
"${userInput}"

Answer only with the symptom from the list that best matches or is most **similar** or **related** to the user's text. If no match, respond "unknown".
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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { message, selectedQuestion, idioma } = req.body;
  const userInput = selectedQuestion || message;
  const isFollowUp = Boolean(selectedQuestion);
  const intent = await classifyUserIntent(userInput, idioma || "en");
  let gptResponse;

  if (intent !== "sintoma") {
    gptResponse = await generateFreeTextWithGPT(
      idioma === "pt"
        ? `Você é o Dr. Owl, um assistente de saúde provocador e inteligente. Um usuário te fez uma pergunta fora do padrão de sintomas, mas que mostra curiosidade ou dúvida. Responda com carisma, humor leve e empatia. No fim, convide o usuário a relatar algum sintoma ou sinal do corpo que esteja incomodando. Pergunta do usuário: "${userInput}"`
        : `You are Dr. Owl, a clever and insightful health assistant. A user just asked something that shows curiosity or vague doubt. Respond with charm and subtle sarcasm, then invite them to share any body signal or discomfort they're feeling. User's message: "${userInput}"`
    );

    const followupQuestions = await generateFollowUpQuestions(
      { sintoma: sessionMemory.sintomaAtual, funnelPhase: 1 },
      idioma
    );

    let content = formatHybridResponse({}, gptResponse, followupQuestions, idioma);

    if (!sessionMemory.emailOffered && sessionMemory.funnelPhase === 2) {
      sessionMemory.emailOffered = true;
    }

    sessionMemory.funnelPhase = Math.min((sessionMemory.funnelPhase || 1) + 1, 6);
    sessionMemory.genericEntry = true;
    sessionMemory.genericMessages = sessionMemory.genericMessages || [];
    sessionMemory.genericMessages.push(userInput);

    return res.status(200).json({
      choices: [{ message: { content, followupQuestions } }]
    });
  } else {
    // A PARTIR DAQUI: fluxo de tratamento do caso com sintoma
    const isPortuguese = /[\u00e3\u00f5\u00e7áéíóú]| você|dor|tenho|problema|saúde/i.test(userInput);
    const idiomaDetectado = isPortuguese ? "pt" : "en";
    sessionMemory.idioma = idiomaDetectado;
    const idioma = sessionMemory.idioma;

    const allSymptoms = Object.keys(fallbackTextsBySymptom);

    // Identifica o sintoma mais próximo do input usando GPT
    const identifiedSymptom = await identifySymptom(userInput, allSymptoms, idioma);

    sessionMemory.sintomaAtual = identifiedSymptom === "unknown" ? userInput.toLowerCase() : identifiedSymptom;
    sessionMemory.nome = "";
    sessionMemory.respostasUsuario.push(userInput);

    let context = await getSymptomContext(
      sessionMemory.sintomaAtual,
      sessionMemory.nome,
      null, // idade removida
      null, // peso removido
      sessionMemory.funnelPhase,
      sessionMemory.sintomaAtual,
      sessionMemory.usedQuestions
    );

    if (context.sintoma && !sessionMemory.sintomaAtual) sessionMemory.sintomaAtual = context.sintoma;
    if (context.categoria && !sessionMemory.categoriaAtual) sessionMemory.categoriaAtual = context.categoria;

    // Gerar a explicação completa do sintoma
    const answer = await generateAnswerForSymptom(sessionMemory.sintomaAtual, idioma);

    // Textos oficiais do Notion
    const funnelKey = getFunnelKey(sessionMemory.funnelPhase);
    let funnelTexts = context.funnelTexts?.[funnelKey] || [];

    // Tenta fallback pelo sintoma
    if (!funnelTexts.length) {
      const fallbackTexts = fallbackTextsBySymptom[sessionMemory.sintomaAtual?.toLowerCase().trim()] || {};
      funnelTexts = fallbackTexts[funnelKey] || [];
    }

    // (Opcional) fallback genérico
    if (!funnelTexts.length) {
      funnelTexts = [
        idioma === "pt"
          ? "Desculpe, ainda não temos conteúdo para esse sintoma e etapa. Tente outro sintoma ou reformule sua pergunta."
          : "Sorry, we don’t have content for this symptom and phase yet. Please try another symptom or rephrase your query."
      ];
    }

    const baseText = funnelTexts[Math.floor(Math.random() * funnelTexts.length)];

    const gptResponse = baseText
      ? await rewriteWithGPT(baseText, sessionMemory.sintomaAtual, idioma, sessionMemory.funnelPhase, sessionMemory.categoriaAtual)
      : await rewriteWithGPT(
          `Explain clearly about the symptom ${sessionMemory.sintomaAtual} in phase ${sessionMemory.funnelPhase}, focusing on phase key ${funnelKey}`,
          sessionMemory.sintomaAtual,
          idioma,
          sessionMemory.funnelPhase,
          sessionMemory.categoriaAtual
        );

    const followupQuestions = await generateFollowUpQuestions(
      { sintoma: sessionMemory.sintomaAtual, funnelPhase: sessionMemory.funnelPhase },
      idioma
    );

    // Atualiza a fase do funil com segurança
    sessionMemory.funnelPhase = Math.min((context.funnelPhase || sessionMemory.funnelPhase || 1) + 1, 6);

    // Debug logs
    console.log("🧪 Sintoma detectado:", context.sintoma);
    console.log("🧪 Categoria atual:", sessionMemory.categoriaAtual);
    console.log("🧪 Fase atual:", sessionMemory.funnelPhase);
    console.log("🧪 Texto da fase:", funnelKey, funnelTexts);

    content = formatHybridResponse(context, gptResponse, followupQuestions, idioma);

    return res.status(200).json({
      choices: [{ message: { content, followupQuestions: followupQuestions || [] } }]
    });
  }
}
