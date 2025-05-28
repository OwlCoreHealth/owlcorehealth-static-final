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

// Prompt global de personalidade para o GPT em todas as fases
const PERSONALITY_PROMPT_PT = `
Você é um assistente de saúde digital com personalidade empática, provocadora e humana.
Sua missão é educar o usuário com explicações claras, dados científicos reais, estatísticas impactantes e soluções práticas.
Use linguagem acessível, leve humor sutil e provoque a curiosidade e reflexão do usuário, sem ser alarmista.
Adapte o tom conforme a fase do funil para criar conexão e engajamento.
`;

const PERSONALITY_PROMPT_EN = `
You are a digital health assistant with an empathetic, provocative, and human personality.
Your mission is to educate the user with clear explanations, real scientific data, impactful statistics, and practical solutions.
Use accessible language, subtle humor, and provoke curiosity and reflection, without being alarmist.
Adapt your tone according to the funnel phase to create connection and engagement.
`;

// Função para reescrever texto com prompts diferenciados por fase do funil
async function rewriteWithGPT(baseText, sintoma, idioma, funnelPhase) {
  let promptBase = idioma === "pt"
    ? PERSONALITY_PROMPT_PT
    : PERSONALITY_PROMPT_EN;

  // Ajuste do prompt por fase do funil
  let phasePrompt = "";
  switch (funnelPhase) {
    case 1: // Explicação científica + soluções práticas
      phasePrompt = idioma === "pt"
        ? `Explique detalhadamente o sintoma "${sintoma}", incluindo funcionamento biológico, causas e efeitos. Inclua 2 a 3 soluções práticas imediatas que o usuário possa aplicar para aliviar ou prevenir o problema. Use dados e referências científicas para dar credibilidade.`
        : `Explain in detail the symptom "${sintoma}", including biological function, causes, and effects. Include 2 to 3 practical solutions the user can apply immediately to relieve or prevent the problem. Use data and scientific references to provide credibility.`;
      break;
    case 2: // Riscos e consequências
      phasePrompt = idioma === "pt"
        ? `Explique os riscos e consequências de ignorar o sintoma "${sintoma}", incluindo estatísticas reais e linguagem urgente, porém sem alarmismo.`
        : `Explain the risks and consequences of ignoring the symptom "${sintoma}", including real statistics and urgent but non-alarmist language.`;
      break;
    case 3: // Estatísticas impactantes
      phasePrompt = idioma === "pt"
        ? `Apresente estatísticas impactantes e dados sobre o sintoma "${sintoma}" para aumentar a consciência e urgência do usuário.`
        : `Present impactful statistics and data about the symptom "${sintoma}" to raise user awareness and urgency.`;
      break;
    case 4: // Nutrientes e plantas naturais
      phasePrompt = idioma === "pt"
        ? `Liste as plantas naturais específicas ligadas ao suplemento para o sintoma "${sintoma}". Explique seus mecanismos de ação, benefícios e inclua referências científicas e depoimentos que valorizem essas plantas.`
        : `List the specific natural plants linked to the supplement for the symptom "${sintoma}". Explain their mechanisms of action, benefits, and include scientific references and testimonials that highlight these plants.`;
      break;
    case 5: // Apresentação sutil do suplemento + CTA
      phasePrompt = idioma === "pt"
        ? `Apresente o suplemento relacionado ao sintoma "${sintoma}" de forma discreta e estratégica. Inclua dados de eficácia, certificações e diferenciais importantes, criando senso de urgência e exclusividade. Não mencione o nome do suplemento diretamente. Desperte a curiosidade para que o usuário peça mais informações.`
        : `Present the supplement related to the symptom "${sintoma}" discreetly and strategically. Include efficacy data, certifications, and important differentials, creating a sense of urgency and exclusivity. Do not mention the supplement's name directly. Arouse curiosity so the user asks for more information.`;
      break;
    default:
      phasePrompt = idioma === "pt"
        ? `Reescreva o texto mantendo o tema "${sintoma}" com linguagem natural, fluida, provocadora e humana.`
        : `Rewrite the text keeping the topic "${sintoma}" with natural, fluid, provocative, and human language.`;
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

// Função para normalizar perguntas para evitar repetições falsas
function normalizeQuestion(q) {
  return q.toLowerCase().trim();
}

async function generateFollowUpQuestions(context, idioma) {
  const usedQuestions = sessionMemory.usedQuestions.map(normalizeQuestion) || [];
  const symptom = context.sintoma || "symptom";
  const phase = context.funnelPhase || 1;

  const promptPT = `
Você é um assistente de saúde inteligente, empático e provocador.
Com base no sintoma "${symptom}" e na fase do funil ${phase}, gere 3 perguntas curtas, provocativas e instigantes que levem o usuário para a próxima etapa.
As perguntas devem ser distintas entre si e diferentes das já feitas, que são: ${usedQuestions.join("; ")}.
Use variações de tom que explorem curiosidade, medo, urgência e solução.
Retorne apenas as 3 perguntas numeradas, sem explicações extras.
`;

  const promptEN = `
You are a smart, empathetic, and provocative health assistant.
Based on the symptom "${symptom}" and funnel phase ${phase}, generate 3 short, provocative, and engaging questions to guide the user to the next step.
The questions must be distinct from each other and different from those already asked, which are: ${usedQuestions.join("; ")}.
Use tone variations exploring curiosity, fear, urgency, and solution.
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

    // Normalizar e filtrar perguntas repetidas (mesmo texto normalizado)
    questions = questions.filter(q => !usedQuestions.includes(normalizeQuestion(q)));

    // Atualiza as perguntas usadas na sessão (normalizadas para evitar repetição)
    questions.forEach(q => sessionMemory.usedQuestions.push(q.trim()));

    // Se menos de 3 perguntas após filtro, adiciona fallback interno com mais variações
    const fallbackPT = [
      "Você já tentou mudar sua alimentação ou rotina?",
      "Como você acha que isso está afetando seu dia a dia?",
      "Está disposto(a) a descobrir uma solução mais eficaz agora?",
      "Qual o maior medo que esse sintoma gera em você?",
      "Você sabe quais hábitos podem piorar esse problema?",
      "Quer entender como evitar que isso evolua para algo pior?"
    ];
    const fallbackEN = [
      "Have you tried adjusting your diet or lifestyle?",
      "How do you think this is affecting your daily life?",
      "Are you ready to explore a better solution now?",
      "What is your biggest concern about this symptom?",
      "Do you know which habits could worsen this issue?",
      "Would you like to learn how to prevent this from getting worse?"
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
    // fallback direto sem usar GPT
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

  const { message, name, age, sex, weight, selectedQuestion } = req.body;
  const userInput = selectedQuestion || message;
  const isFollowUp = Boolean(selectedQuestion);

  // Detecta idioma do input
  const isPortuguese = /[\u00e3\u00f5\u00e7áéíóú]| você|dor|tenho|problema|saúde/i.test(userInput);
  const idiomaDetectado = isPortuguese ? "pt" : "en";
  sessionMemory.idioma = sessionMemory.respostasUsuario.length === 0 ? idiomaDetectado : sessionMemory.idioma;
  const idioma = sessionMemory.idioma;

  // Prepara lista de sintomas para identificação
  const allSymptoms = Object.keys(fallbackTextsBySymptom);

  // Identifica o sintoma mais próximo do input usando GPT
  const identifiedSymptom = await identifySymptom(userInput, allSymptoms, idioma);

  // Atualiza sintomaAtual para a busca, ou usa o texto do usuário se não identificar
  sessionMemory.sintomaAtual = identifiedSymptom === "unknown" ? userInput.toLowerCase() : identifiedSymptom;

  sessionMemory.nome = name?.trim() || "";
  sessionMemory.respostasUsuario.push(userInput);

  const userAge = parseInt(age);
  const userWeight = parseFloat(weight);

  // Busca contexto do sintoma identificado no Notion
  let context = await getSymptomContext(
    sessionMemory.sintomaAtual,
    sessionMemory.nome,
    userAge,
    userWeight,
    sessionMemory.funnelPhase,
    sessionMemory.sintomaAtual,
    sessionMemory.usedQuestions
  );

  // Mantém sintoma e categoria para contexto coerente
  if (context.sintoma && !sessionMemory.sintomaAtual) sessionMemory.sintomaAtual = context.sintoma;
  if (context.categoria && !sessionMemory.categoriaAtual) sessionMemory.categoriaAtual = context.categoria;

  // Se não achar textos na tabela, usa fallback por sintoma ou categoria
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
    // Passa funnelPhase para reescrita contextualizada
    const fallbackResponse = await rewriteWithGPT(baseText, sessionMemory.sintomaAtual, idioma, sessionMemory.funnelPhase);
    const fallbackQuestions = await generateFollowUpQuestions(context, idioma);

    const content = formatHybridResponse(context, fallbackResponse, fallbackQuestions, idioma);
    return res.status(200).json({
      choices: [{ message: { content, followupQuestions: fallbackQuestions || [] } }]
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
      idioma === "pt"
        ? "Desculpe, ainda não temos conteúdo para esse sintoma e etapa. Tente outro sintoma ou reformule sua pergunta."
        : "Sorry, we don’t have content for this symptom and phase yet. Please try another symptom or rephrase your query."
    ];
  }

  const baseText = funnelTexts[Math.floor(Math.random() * funnelTexts.length)];

  // Passa funnelPhase para reescrita contextualizada
  const gptResponse = baseText
    ? await rewriteWithGPT(baseText, sessionMemory.sintomaAtual, idioma, sessionMemory.funnelPhase)
    : await rewriteWithGPT(
        `Explain clearly about the symptom ${sessionMemory.sintomaAtual} in phase ${sessionMemory.funnelPhase}, focusing on phase key ${funnelKey}`,
        sessionMemory.sintomaAtual,
        idioma,
        sessionMemory.funnelPhase
      );

  const followupQuestions = await generateFollowUpQuestions(
    { sintoma: sessionMemory.sintomaAtual, funnelPhase: sessionMemory.f
