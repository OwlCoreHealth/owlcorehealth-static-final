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

// Owl Savage versão suave, persuasiva e informativa
const PERSONALITY_PROMPT_PT = `
Você é Owl Savage, um assistente de saúde digital com personalidade persuasiva, empática e informativa.  
Sua missão é entregar explicações detalhadas, baseadas em ciência e fatos surpreendentes, que façam o usuário pensar "UAU, sério? Não sabia disso!".  
Use linguagem clara, acessível, com um toque leve de provocação para engajar, sempre guiando o usuário para agir e seguir o funil de forma natural.  
Inclua curiosidades, dados científicos pouco conhecidos e exemplos práticos para valorizar a informação.  
Evite sarcasmo agressivo; prefira uma provocação leve, educada e motivadora.
`;

const PERSONALITY_PROMPT_EN = `
You are Owl Savage, a digital health assistant with a persuasive, empathetic, and informative personality.  
Your mission is to deliver detailed explanations based on science and surprising facts that make users think "WOW, really? I didn't know that!".  
Use clear, accessible language with a gentle touch of provocation to engage, always guiding the user to act and naturally follow the funnel.  
Include curiosities, lesser-known scientific data, and practical examples to add value.  
Avoid harsh sarcasm; prefer light, polite, and motivating provocation.
`;

function getCtaButton(idioma) {
  if (idioma === "pt") {
    return `<button onclick="window.open('https://seulinkdosuplemento.com','_blank')" style="background:#6a4fbf;color:#fff;padding:12px 25px;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">Clique aqui para saber mais</button>`;
  } else {
    return `<button onclick="window.open('https://yoursupplementlink.com','_blank')" style="background:#6a4fbf;color:#fff;padding:12px 25px;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">Click here to learn more</button>`;
  }
}

async function rewriteWithGPT(baseText, sintoma, idioma, funnelPhase) {
  let promptBase = idioma === "pt" ? PERSONALITY_PROMPT_PT : PERSONALITY_PROMPT_EN;

  let phasePrompt = "";
  switch (funnelPhase) {
    case 1:
      phasePrompt = idioma === "pt"
        ? `Explique com profundidade o sintoma "${sintoma}", detalhando seu funcionamento biológico, causas e efeitos. Inclua fatos surpreendentes e 2 a 3 soluções práticas e imediatas para o usuário aplicar e aliviar o problema. Use dados científicos e curiosidades pouco conhecidos para engajar e motivar ação.`
        : `Explain deeply the symptom "${sintoma}", detailing biological functioning, causes, and effects. Include surprising facts and 2 to 3 practical, immediate solutions for the user to apply and relieve the problem. Use scientific data and little-known curiosities to engage and motivate action.`;
      break;
    case 2:
      phasePrompt = idioma === "pt"
        ? `Apresente os riscos e consequências de ignorar o sintoma "${sintoma}" com dados reais e linguagem persuasiva e urgente. Use estatísticas impactantes e exemplos que provoquem reflexão e senso de urgência.`
        : `Present the risks and consequences of ignoring the symptom "${sintoma}" with real data and persuasive, urgent language. Use impactful statistics and examples that provoke reflection and urgency.`;
      break;
    case 3:
      phasePrompt = idioma === "pt"
        ? `Mostre estatísticas impactantes e dados pouco conhecidos sobre o sintoma "${sintoma}" para aumentar o senso de urgência e curiosidade, usando linguagem clara e persuasiva.`
        : `Show impactful statistics and lesser-known data about the symptom "${sintoma}" to increase urgency and curiosity, using clear and persuasive language.`;
      break;
    case 4:
      phasePrompt = idioma === "pt"
        ? `Explique os nutrientes e plantas naturais específicos do suplemento que ajudam no sintoma "${sintoma}". Destaque que, devido ao estresse, alimentos processados e fatores modernos, a alimentação não supre esses nutrientes, tornando o suplemento necessário. Valorize as plantas com dados científicos, estatísticas e depoimentos reais ou simulados para agregar credibilidade. Termine com uma pergunta provocativa convidando o usuário a conhecer um suplemento com essas plantas e nutrientes, sem mencionar o nome do suplemento.`
        : `Explain the nutrients and natural plants in the supplement that help with the symptom "${sintoma}". Highlight that due to stress, processed foods, and modern factors, diet alone doesn't provide these nutrients, making the supplement necessary. Value the plants with scientific data, statistics, and real or simulated testimonials to add credibility. End with a provocative question inviting the user to learn about a supplement with these plants and nutrients, without mentioning the supplement's name.`;
      break;
    case 5:
      const cta = getCtaButton(idioma);
      phasePrompt = idioma === "pt"
        ? `Apresente de forma persuasiva e informativa o suplemento contendo as plantas e nutrientes para o sintoma "${sintoma}". Destaque diferenciais, certificações, eficácia clínica, e benefícios para o usuário, sem mencionar o nome do suplemento. Termine com o botão CTA abaixo para despertar curiosidade e incentivar a ação:\n\n${cta}`
        : `Persuasively and informatively present the supplement containing the plants and nutrients for the symptom "${sintoma}". Highlight differentiators, certifications, clinical efficacy, and benefits for the user without mentioning the supplement's name. End with the CTA button below to spark curiosity and encourage action:\n\n${cta}`;
      break;
    default:
      phasePrompt = idioma === "pt"
        ? `Reescreva com liberdade criativa o texto mantendo o foco no sintoma "${sintoma}", com linguagem persuasiva, informativa e humana, seguindo a personalidade Owl Savage suave.`
        : `Rewrite creatively the text keeping focus on the symptom "${sintoma}", using persuasive, informative and human language, following the gentle Owl Savage personality.`;
  }

  const prompt = `${promptBase}\n\n${phasePrompt}\n\nTexto base:\n${baseText}`;

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
    return data.choices?.[0]?.message?.content?.trim() || baseText;
  } catch (e) {
    console.error("Erro ao reescrever com GPT:", e);
    return baseText;
  }
}

function normalizeQuestion(q) {
  return q.toLowerCase().trim();
}

async function generateFollowUpQuestions(context, idioma) {
  const usedQuestions = sessionMemory.usedQuestions.map(normalizeQuestion) || [];
  const symptom = context.sintoma || "symptom";
  const phase = context.funnelPhase || 1;

  const promptPT = `
Você é Owl Savage, um assistente de saúde persuasivo, informativo e levemente provocador.
Com base no sintoma "${symptom}" e na fase do funil ${phase}, gere 3 perguntas curtas, impactantes e variadas para conduzir o usuário para a próxima fase.
As perguntas devem ter gancho forte em curiosidade, urgência, risco e solução, evitando perguntas genéricas ou repetidas: ${usedQuestions.join("; ")}.
Retorne apenas as 3 perguntas numeradas, sem explicações adicionais.
`;

  const promptEN = `
You are Owl Savage, a persuasive, informative and lightly provocative health assistant.
Based on the symptom "${symptom}" and funnel phase ${phase}, generate 3 short, impactful, and varied questions to guide the user to the next phase.
Questions must have strong hooks on curiosity, urgency, risk, and solution, avoiding generic or repeated questions: ${usedQuestions.join("; ")}.
Return only the 3 numbered questions, no extra explanations.
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
          { role: "system", content: "Generate only 3 relevant and persuasive questions." },
          { role: "user", content: prompt }
        ],
        temperature: 0.85,
        max_tokens: 300
      })
    });

    const data = await response.json();
    let questionsRaw = data.choices?.[0]?.message?.content || "";
    let questions = questionsRaw.split(/\d+\.\s+/).filter(Boolean).slice(0, 3);

    questions = questions.filter(q => !usedQuestions.includes(normalizeQuestion(q)));

    questions.forEach(q => sessionMemory.usedQuestions.push(q.trim()));

    const fallbackPT = [
      "Quer conhecer as soluções mais rápidas para aliviar seu sintoma?",
      "Está preparado para descobrir os riscos reais que você corre?",
      "Quer saber como evitar que isso piore de vez?",
      "Quanto tempo mais vai deixar esse problema dominar sua vida?",
      "Você sabe qual é a pior consequência se não agir agora?",
      "Pronto para dar o primeiro passo para se sentir melhor?"
    ];
    const fallbackEN = [
      "Want to know the fastest solutions to relieve your symptom?",
      "Are you ready to discover the real risks you face?",
      "Want to learn how to prevent this from getting worse?",
      "How much longer will you let this problem take over your life?",
      "Do you know the worst consequence if you don’t act now?",
      "Ready to take the first step to feel better?"
    ];

    if (questions.length < 3) {
      const fallback = idioma === "pt" ? fallbackPT : fallbackEN;
      for (const fq of fallback) {
        if (questions.length >= 3) break;
        if (!sessionMemory.usedQuestions.some(uq => normalizeQuestion(uq) === normalizeQuestion(fq))) {
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
          "Quer conhecer as soluções mais rápidas para aliviar seu sintoma?",
          "Está preparado para descobrir os riscos reais que você corre?",
          "Quer saber como evitar que isso piore de vez?"
        ]
      : [
          "Want to know the fastest solutions to relieve your symptom?",
          "Are you ready to discover the real risks you face?",
          "Want to learn how to prevent this from getting worse?"
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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { message, name, age, sex, weight, selectedQuestion } = req.body;
  const userInput = selectedQuestion || message;

  const isPortuguese = /[\u00e3\u00f5\u00e7áéíóú]| você|dor|tenho|problema|saúde/i.test(userInput);
  const idiomaDetectado = isPortuguese ? "pt" : "en";
  sessionMemory.idioma = sessionMemory.respostasUsuario.length === 0 ? idiomaDetectado : sessionMemory.idioma;
  const idioma = sessionMemory.idioma;

  const allSymptoms = Object.keys(fallbackTextsBySymptom);

  const identifiedSymptom = await identifySymptom(userInput, allSymptoms, idioma);

  sessionMemory.sintomaAtual = identifiedSymptom === "unknown" ? userInput.toLowerCase() : identifiedSymptom;

  sessionMemory.nome = name?.trim() || "";
  sessionMemory.respostasUsuario.push(userInput);

  const userAge = parseInt(age);
  const userWeight = parseFloat(weight);

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

  if (!context.funnelTexts || Object.keys(context.funnelTexts).length === 0) {
    const fallbackTexts = fallbackTextsBySymptom[sessionMemory.sintomaAtual?.toLowerCase()] || {};
    const funnelKey = getFunnelKey(sessionMemory.funnelPhase);
    let fallbackPhaseTexts = fallbackTexts[funnelKey] || [];

    if (fallbackPhaseTexts.length === 0 && sessionMemory.categoriaAtual) {
      fallbackPhaseTexts = fallbackTextsByCategory[sessionMemory.categoriaAtual]?.[funnelKey] || [];
    }

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
