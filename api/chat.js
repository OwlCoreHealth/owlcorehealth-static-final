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
     // response += renderEmailPrompt(idioma);
    }
  }

  return response;
}

async function classifyUserIntent(userInput, idioma) {
  const prompt = idioma === "pt"
    ? `Você é um classificador de intenção. Receberá mensagens de usuários e deve responder com uma das seguintes intenções:

- sintoma
- saudação
- curiosidade
- pergunta funcional
- dúvida vaga
- outro

Mensagem do usuário: "${userInput}"
Resposta (apenas a intenção):`
    : `You are an intent classifier. You’ll receive a user message and must reply with one of the following labels:

- symptom
- greeting
- curiosity
- functional_question
- vague_doubt
- other

User message: "${userInput}"
Answer (intent only):`;

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
        temperature: 0,
        max_tokens: 10
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

async function rewriteWithGPT(baseText, sintoma, idioma, funnelPhase, categoria, promptCustom = null) {
  const prompt = promptCustom || (idioma === "pt"
    ? `Use o seguinte texto como base, mantendo o conteúdo e estrutura, mas reescrevendo com 30% de liberdade criativa, usando linguagem mais fluida, provocadora e humana. Mantenha o foco exclusivamente no sintoma: ${sintoma} e na categoria: ${categoria}. Não aborde outros temas. Não mude o tema e mantenha o foco em: ${sintoma}\n\nTexto-base:\n${baseText}`
    : `Use the following text as a base. Keep the core message and structure, but rewrite with 30% creative freedom in a more natural, engaging, and human tone. Keep the focus exclusively on the symptom: ${sintoma} and category: ${categoria}. Do not address other topics. Do not change the topic and keep the focus on: ${sintoma}\n\nBase text:\n${baseText}`);

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

// <<< Aqui, logo após fechar a função rewriteWithGPT, cole a função countWords >>>

function countWords(str) {
  return str.trim().split(/\s+/).length;
}

async function expandResponseWithGPT(text, sintoma, idioma, funnelPhase, categoria) {
  const prompt = idioma === "pt"
    ? `O texto abaixo tem menos de 100 palavras. Expanda-o para pelo menos 100 palavras mantendo o foco no sintoma "${sintoma}" e na categoria "${categoria}". Use linguagem humana, fluida e provocadora:\n\n${text}`
    : `The text below has less than 100 words. Expand it to at least 100 words keeping focus on the symptom "${sintoma}" and category "${categoria}". Use human, fluid and provocative language:\n\n${text}`;

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
        temperature: 0.7,
        max_tokens: 300
      })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || text;
  } catch (e) {
    console.error("Erro ao expandir resposta com GPT:", e);
    return text;
  }
}

async function generateFreeTextWithGPT(prompt) {
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
        temperature: 0.7,
        max_tokens: 700
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "";
  } catch (e) {
    console.error("Erro ao gerar texto livre com GPT:", e);
    return "";
  }
}

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

    // Adicionar fallback interno, se necessário
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

    // Adicionar pergunta CTA sutil na fase 5
    if (phase === 5) {
      fallbackPT.push("Quer saber qual suplemento pode ajudar você com isso?");
      fallbackEN.push("Want to know which supplement can help you with this?");
    }

    if (questions.length < 3) {
      const fallback = idioma === "pt" ? fallbackPT : fallbackEN;
      for (const fq of fallback) {
        if (questions.length >= 3) break;
        if (!sessionMemory.usedQuestions.includes(fq) && !questions.includes(fq)) {
          questions.push(fq);
        }
      }
    }

    // Atualiza as perguntas usadas na sessão
    questions.forEach(q => {
      if (!sessionMemory.usedQuestions.includes(q)) {
        sessionMemory.usedQuestions.push(q);
      }
    });

    return questions.slice(0, 3);

  } catch (err) {
    console.error("❗️Erro ao gerar perguntas com GPT:", err);
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

// Função nova: identifica sintoma no input do usuário comparando com lista do fallback
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

// Handler principal do bot
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { message, selectedQuestion, idioma } = req.body;
  const userInput = selectedQuestion || message;
  const isFollowUp = Boolean(selectedQuestion);
  const intent = await classifyUserIntent(userInput, idioma || "en");
  let gptResponse; // ✅ Declarado uma vez só aqui

  // Se ainda não temos o nome do usuário, iniciamos a conversa pedindo o nome
  if (!sessionMemory.nome) {
    return res.status(200).json({
      choices: [{
        message: {
          content: "Hello! I’m Dr. Owl. How can I assist you today? May I know your name?",  // Saudação com a pergunta do nome
          followupQuestions: []
        }
      }]
    });
  }

  // Se o nome já foi capturado, saudação personalizada
  return res.status(200).json({
    choices: [{
      message: {
        content: `Nice to meet you, ${sessionMemory.nome}! How can I help you today?`,  // Saudação com o nome
        followupQuestions: []
      }
    }]
  });

  if (intent !== "sintoma") {
    gptResponse = await generateFreeTextWithGPT(
     idioma === "pt"
        ? `Você é o Dr. Owl, um assistente de saúde provocador e inteligente. Um usuário te fez uma pergunta fora do padrão de sintomas, mas que mostra curiosidade ou dúvida. Responda com carisma, humor leve e empatia. No fim, convide o usuário a relatar algum sintoma ou sinal do corpo que esteja incomodando. Pergunta do usuário: "${userInput}"`
        : `You are Dr. Owl, a clever and insightful health assistant. A user just asked something that shows curiosity or vague doubt. Respond with charm and subtle sarcasm, then invite them to share any body signal or discomfort they're feeling. User's message: "${userInput}"`
    );

    const followupQuestions = await generateFollowUpQuestions(
      { sintoma: "entrada genérica", funnelPhase: 1 },
    idioma
    );

    let content = formatHybridResponse({}, gptResponse, followupQuestions, idioma);

    // ✅ Mostrar o formulário de subscrição apenas após a 1ª resposta genérica
    if (!sessionMemory.emailOffered && sessionMemory.funnelPhase === 2) {
      sessionMemory.emailOffered = true;
      // content += renderEmailPrompt(sessionMemory.idioma);
    }

    // Atualiza a fase do funil, avançando no máximo 1 etapa por vez e não mudando de tema antes da fase 6
    const currentPhase = sessionMemory.funnelPhase || 1;
    const nextPhaseFromContext = context.funnelPhase || currentPhase;

    if (currentPhase < 6) {
      // Avança somente uma etapa por vez e não ultrapassa a fase 6
      if (nextPhaseFromContext > currentPhase) {
        sessionMemory.funnelPhase = currentPhase + 1;
      } else {
        sessionMemory.funnelPhase = currentPhase;
      }
    } else {
      // Já está na fase 6 (final), mantém
      sessionMemory.funnelPhase = 6;
    }

    // Registra entrada genérica
    sessionMemory.genericEntry = true;
    sessionMemory.genericMessages = sessionMemory.genericMessages || [];
    sessionMemory.genericMessages.push(userInput);

    return res.status(200).json({
      choices: [{ message: { content, followupQuestions } }]
    });

  // Fim do bloco "intent !== sintoma"
} else {
  // A PARTIR DAQUI: fluxo de tratamento do caso com sintoma
  // Detecta idioma do input
  const isPortuguese = /[\u00e3\u00f5\u00e7áéíóú]| você|dor|tenho|problema|saúde/i.test(userInput);
  const idiomaDetectado = isPortuguese ? "pt" : "en";
  sessionMemory.idioma = idiomaDetectado;

  // Prepara lista de sintomas para identificação
  const allSymptoms = Object.keys(fallbackTextsBySymptom);

  // Identifica o sintoma mais próximo do input usando GPT
  const identifiedSymptom = await identifySymptom(userInput, allSymptoms, idiomaDetectado);

  // Atualiza sintomaAtual para a busca, ou usa o texto do usuário se não identificar
  sessionMemory.sintomaAtual = identifiedSymptom === "unknown" ? userInput.toLowerCase() : identifiedSymptom;

  sessionMemory.nome = "";
  sessionMemory.respostasUsuario.push(userInput);

  // Busca contexto do sintoma identificado no Notion (sem idade/peso)
  let context = await getSymptomContext(
    sessionMemory.sintomaAtual,
    sessionMemory.nome,
    null, // idade removida
    null, // peso removido
    sessionMemory.funnelPhase,
    sessionMemory.sintomaAtual,
    sessionMemory.usedQuestions
  );

  // Mantém sintoma e categoria para contexto coerente
  if (context.sintoma && !sessionMemory.sintomaAtual) sessionMemory.sintomaAtual = context.sintoma;
  if (context.categoria && !sessionMemory.categoriaAtual) sessionMemory.categoriaAtual = context.categoria;

  // Se não achar textos na tabela, usa fallback por sintoma
  if (!context.funnelTexts || Object.keys(context.funnelTexts).length === 0) {
    const freeTextPrompt = idiomaDetectado === "pt"
      ? `Você é um assistente de saúde. Explique detalhadamente e de forma humana o sintoma "${sessionMemory.sintomaAtual}" considerando a categoria "${sessionMemory.categoriaAtual}". Forneça informações úteis e conduza o usuário no funil, mesmo sem textos específicos na base.`
      : `You are a health assistant. Explain in detail and humanly the symptom "${sessionMemory.sintomaAtual}" considering the category "${sessionMemory.categoriaAtual}". Provide useful information and guide the user through the funnel even if no specific texts are available in the database.`;

    const freeTextResponse = await generateFreeTextWithGPT(freeTextPrompt);

    const followupQuestions = await generateFollowUpQuestions(
      { sintoma: sessionMemory.sintomaAtual, funnelPhase: sessionMemory.funnelPhase },
      idiomaDetectado
    );

    const content = formatHybridResponse(context, freeTextResponse, followupQuestions, idiomaDetectado);

    return res.status(200).json({
      choices: [{ message: { content, followupQuestions: followupQuestions || [] } }]
    });
  }

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
      idiomaDetectado === "pt"
        ? "Desculpe, ainda não temos conteúdo para esse sintoma e etapa. Tente outro sintoma ou reformule sua pergunta."
        : "Sorry, we don’t have content for this symptom and phase yet. Please try another symptom or rephrase your query."
    ];
  }

  const baseText = funnelTexts[Math.floor(Math.random() * funnelTexts.length)];

  let gptResponse = baseText
    ? await rewriteWithGPT(baseText, sessionMemory.sintomaAtual, idiomaDetectado, sessionMemory.funnelPhase, sessionMemory.categoriaAtual)
    : await rewriteWithGPT(
        `Explain clearly about the symptom ${sessionMemory.sintomaAtual} in phase ${sessionMemory.funnelPhase}, focusing on phase key ${funnelKey}`,
        sessionMemory.sintomaAtual,
        idiomaDetectado,
        sessionMemory.funnelPhase,
        sessionMemory.categoriaAtual
      );

  // Verifica se a resposta tem menos de 100 palavras e expande se necessário
  if (countWords(gptResponse) < 100) {
    gptResponse = await expandResponseWithGPT(gptResponse, sessionMemory.sintomaAtual, idiomaDetectado, sessionMemory.funnelPhase, sessionMemory.categoriaAtual);
  }

  const followupQuestions = await generateFollowUpQuestions(
    { sintoma: sessionMemory.sintomaAtual, funnelPhase: sessionMemory.funnelPhase },
    idiomaDetectado
  );

  // Atualiza a fase do funil com segurança
  sessionMemory.funnelPhase = Math.min((context.funnelPhase || sessionMemory.funnelPhase || 1) + 1, 6);

  const content = formatHybridResponse(context, gptResponse, followupQuestions, idiomaDetectado);

  return res.status(200).json({
    choices: [{ message: { content, followupQuestions: followupQuestions || [] } }]
  });
}
