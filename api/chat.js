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

// Prompt Owl Savage - personalidade forte, sarcástica, empática, científica e provocadora
const PERSONALITY_PROMPT_PT = `
Você é Owl Savage, um assistente de saúde digital com personalidade dura, sarcástica, provocadora e direta. 
Sua missão é educar o usuário com explicações científicas profundas, dados reais e estatísticas impactantes, mas sempre com humor ácido e ironia inteligente. 
Nunca perca o tom provocador, desafiador e empático. Use metáforas e analogias que cutuquem, mas sempre com respeito e profissionalismo. 
Adapte a linguagem para o sintoma e fase do funil, entregando conteúdo relevante e levando o usuário a refletir, agir e querer saber mais.
`;

const PERSONALITY_PROMPT_EN = `
You are Owl Savage, a digital health assistant with a tough, sarcastic, provocative, and direct personality.
Your mission is to educate users with deep scientific explanations, real data, and impactful statistics, always with sharp humor and intelligent irony.
Never lose your provocative, challenging, and empathetic tone. Use metaphors and analogies that poke, but always respectfully and professionally.
Adapt language to the symptom and funnel phase, delivering relevant content that makes the user reflect, act, and crave more.
`;

// Geração do botão CTA disfarçado
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
        ? `Explique com profundidade o sintoma "${sintoma}", detalhando seu funcionamento biológico, causas e efeitos. Inclua de forma provocadora 2 a 3 soluções práticas e imediatas para o usuário aplicar e aliviar o problema. Use dados científicos reais e metáforas afiadas para cutucar o usuário a agir.`
        : `Explain deeply the symptom "${sintoma}", detailing biological functioning, causes, and effects. Include 2 to 3 practical, immediate solutions in a provocative tone to push the user to act. Use real scientific data and sharp metaphors to challenge the user.`;
      break;
    case 2:
      phasePrompt = idioma === "pt"
        ? `Apresente os riscos e consequências de ignorar o sintoma "${sintoma}" com dados reais e uma linguagem urgente e cortante, sem exageros. Use estatísticas para provocar um choque consciente.`
        : `Present the risks and consequences of ignoring the symptom "${sintoma}" with real data and urgent, cutting language without exaggeration. Use statistics to provoke conscious shock.`;
      break;
    case 3:
      phasePrompt = idioma === "pt"
        ? `Mostre estatísticas impactantes sobre o sintoma "${sintoma}" para aumentar o senso de urgência, usando linguagem direta e provocativa.`
        : `Show impactful statistics about the symptom "${sintoma}" to increase urgency, using direct and provocative language.`;
      break;
    case 4:
      phasePrompt = idioma === "pt"
        ? `Explique quais nutrientes e plantas naturais específicos do suplemento ajudam no sintoma "${sintoma}". Ressalte que, com o estresse do dia a dia e alimentos processados, a alimentação não supre esses nutrientes, tornando o suplemento essencial. Valorize as plantas com dados científicos, estatísticas e depoimentos reais. Termine com uma pergunta provocativa convidando o usuário a conhecer um suplemento com essas plantas e nutrientes, sem mencionar o nome do suplemento.`
        : `Explain which specific nutrients and natural plants in the supplement help with the symptom "${sintoma}". Emphasize that due to daily stress and processed foods, diet alone doesn’t provide these nutrients, making the supplement essential. Highlight the plants with scientific data, statistics, and real testimonials. End with a provocative question inviting the user to learn about a supplement with these plants and nutrients, without mentioning the supplement's name.`;
      break;
    case 5:
      const cta = getCtaButton(idioma);
      phasePrompt = idioma === "pt"
        ? `Faça uma apresentação estratégica e provocadora do suplemento que contém as plantas e nutrientes para o sintoma "${sintoma}". Destaque diferenciais, certificações e eficácia clínica, mas nunca diga o nome do suplemento. Termine com o botão CTA abaixo para estimular a curiosidade e ação:\n\n${cta}`
        : `Make a strategic and provocative presentation of the supplement containing the plants and nutrients for the symptom "${sintoma}". Highlight differentiators, certifications, and clinical efficacy, but never mention the supplement's name. End with the CTA button below to stimulate curiosity and action:\n\n${cta}`;
      break;
    default:
      phasePrompt = idioma === "pt"
        ? `Reescreva com liberdade criativa o texto mantendo o foco no sintoma "${sintoma}", com linguagem provocadora e humana, seguindo a personalidade Owl Savage.`
        : `Rewrite creatively the text keeping focus on the symptom "${sintoma}", using provocative and human language, following Owl Savage personality.`;
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

// Normalização para evitar repetições
function normalizeQuestion(q) {
  return q.toLowerCase().trim();
}

async function generateFollowUpQuestions(context, idioma) {
  const usedQuestions = sessionMemory.usedQuestions.map(normalizeQuestion) || [];
  const symptom = context.sintoma || "symptom";
  const phase = context.funnelPhase || 1;

  const promptPT = `
Você é Owl Savage, assistente de saúde provocador e direto.
Baseado no sintoma "${symptom}" e fase do funil ${phase}, gere 3 perguntas curtas, impactantes e variadas para avançar o funil.
Não repita perguntas já feitas: ${usedQuestions.join("; ")}.
Use tons que provoquem curiosidade, medo, urgência e solução.
Retorne somente as 3 perguntas numeradas, sem explicações.
`;

  const promptEN = `
You are Owl Savage, a provocative and direct health assistant.
Based on the symptom "${symptom}" and funnel phase ${phase}, generate 3 short, impactful, and varied questions to advance the funnel.
Do not repeat questions already asked: ${usedQuestions.join("; ")}.
Use tones that provoke curiosity, fear, urgency, and solution.
Return only the 3 numbered questions, no explanations.
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
          { role: "system", content: "Generate only 3 relevant and provocative questions." },
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
      "Você já tentou mudar sua alimentação ou rotina?",
      "Como isso está afetando seu dia a dia?",
      "Está pronto(a) para descobrir uma solução eficaz agora?",
      "Qual o maior medo que esse sintoma gera em você?",
      "Quer saber como evitar que isso piore?",
      "Está cansado de sofrer calado?"
    ];
    const fallbackEN = [
      "Have you tried adjusting your diet or lifestyle?",
      "How is this affecting your daily life?",
      "Are you ready to discover an effective solution now?",
      "What is your biggest fear about this symptom?",
      "Want to know how to prevent it from getting worse?",
      "Tired of suffering in silence?"
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
          "Você já tentou mudar sua alimentação ou rotina?",
          "Como isso está afetando seu dia a dia?",
          "Está pronto(a) para descobrir uma solução eficaz agora?"
        ]
      : [
          "Have you tried adjusting your diet or lifestyle?",
          "How is this affecting your daily life?",
          "Are you ready to discover an effective solution now?"
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
