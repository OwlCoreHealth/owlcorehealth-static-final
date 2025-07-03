import path from "path";
import fs from "fs";
import cosineSimilarity from "cosine-similarity";

// Lê o catálogo de suplementos
const catalogPath = path.join(process.cwd(), "api", "data", "symptoms_catalog.json");
const supplementsCatalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

const logsDir = "/tmp/logs";
if (!fs.existsSync(logsDir)) {
  try { fs.mkdirSync(logsDir, { recursive: true }); } catch (e) {}
}
function logEvent(event, data) {
  const logPath = logsDir + "/chat.log";
  const log = `[${new Date().toISOString()}] [${event}] ${JSON.stringify(data)}\n`;
  try { fs.appendFileSync(logPath, log); } catch (e) {}
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GPT_MODEL = "gpt-4o-mini";

let sessionMemory = {};
const QUESTION_LIMIT = 15;

// === Perguntas prontos para cada fase e idioma ===
const FUNIL_QUESTIONS = {
  pt: {
    1: [
      nome => `Sr(a). ${nome}, já percebeu como pequenos sintomas podem esconder algo maior? Quer saber o que seu corpo está tentando avisar?`,
      nome => `Sr(a). ${nome}, sabia que muitas pessoas ignoram esses sinais? Quer entender por que isso acontece?`,
      nome => `Sr(a). ${nome}, você sente que está sempre tentando algo novo, mas nada resolve de verdade? Gostaria de saber o motivo?`
    ],
    2: [
      nome => `Sr(a). ${nome}, você sabia que ignorar esse sintoma pode levar a consequências sérias? Quer conhecer casos reais?`,
      nome => `Sr(a). ${nome}, alguma vez já pensou nos riscos de deixar esse desconforto para depois? Quer saber como evitar complicações?`,
      nome => `Sr(a). ${nome}, se esse sintoma piorar, já imaginou como pode impactar seu dia a dia? Gostaria de saber mais?`
    ],
    3: [
      nome => `Sr(a). ${nome}, gostaria de ver provas científicas de que é possível melhorar esse quadro?`,
      nome => `Sr(a). ${nome}, você quer saber quais estudos comprovam que esse sintoma pode ser revertido?`,
      nome => `Sr(a). ${nome}, sabia que milhares de pessoas já superaram isso com base em evidências? Quer conhecer exemplos?`
    ],
    4: [
      nome => `Sr(a). ${nome}, quer descobrir quais ativos naturais podem ajudar no seu caso?`,
      nome => `Sr(a). ${nome}, você gostaria de saber como a natureza pode ser sua aliada nessa jornada?`,
      nome => `Sr(a). ${nome}, posso te contar quais ingredientes são reconhecidos por melhorar essa condição?`
    ],
    5: [
      nome => `Sr(a). ${nome}, quer saber qual solução natural pode transformar seu bem-estar?`,
      nome => `Sr(a). ${nome}, posso mostrar um caminho simples para começar a se sentir melhor ainda hoje?`,
      nome => `Sr(a). ${nome}, está pronto para dar o próximo passo e experimentar uma abordagem diferente?`
    ]
  },
  en: {
    1: [
      name => `Mr./Ms. ${name}, have you noticed how small symptoms can hide bigger issues? Want to know what your body is trying to tell you?`,
      name => `Mr./Ms. ${name}, did you know many people ignore these signals? Curious to find out why?`,
      name => `Mr./Ms. ${name}, do you feel like you keep trying new things but nothing really works? Want to know the real reason?`
    ],
    2: [
      name => `Mr./Ms. ${name}, did you know ignoring this symptom can lead to serious consequences? Want to hear real stories?`,
      name => `Mr./Ms. ${name}, have you ever thought about the risks of leaving this discomfort unchecked? Want to learn how to avoid complications?`,
      name => `Mr./Ms. ${name}, if this gets worse, can you imagine how it might affect your daily life? Want to know more?`
    ],
    3: [
      name => `Mr./Ms. ${name}, would you like to see scientific proof that this can be improved?`,
      name => `Mr./Ms. ${name}, want to know which studies show this symptom can be reversed?`,
      name => `Mr./Ms. ${name}, did you know thousands have overcome this based on real evidence? Want to see examples?`
    ],
    4: [
      name => `Mr./Ms. ${name}, want to discover which natural actives can help in your case?`,
      name => `Mr./Ms. ${name}, would you like to know how nature could be your ally in this journey?`,
      name => `Mr./Ms. ${name}, can I tell you which ingredients are proven to help this condition?`
    ],
    5: [
      name => `Mr./Ms. ${name}, want to know which natural solution can transform your well-being?`,
      name => `Mr./Ms. ${name}, can I show you a simple path to start feeling better today?`,
      name => `Mr./Ms. ${name}, are you ready to take the next step and try a different approach?`
    ]
  }
};

// === Utilitário: sorteia pergunta por fase, idioma e nome ===
function getRandomQuestion(phase, idioma, userName) {
  const arr = (FUNIL_QUESTIONS[idioma] && FUNIL_QUESTIONS[idioma][phase]) || [];
  if (arr.length === 0) return "";
  return arr[Math.floor(Math.random() * arr.length)](userName || "");
}

// ==== FUNÇÕES AUXILIARES ====

// Fuzzy (cosine)
function textToVector(text) {
  if (!text || typeof text !== "string") return {};
  const words = text.toLowerCase().split(/\s+/);
  const freq = {};
  words.forEach(w => freq[w] = (freq[w] || 0) + 1);
  return freq;
}
function fuzzyFindSymptom(userInput) {
  const allSymptoms = supplementsCatalog.flatMap(s => s.symptoms || []);
  const symptomNames = Array.from(new Set(allSymptoms));
  const userVecObj = textToVector(userInput);
  let bestScore = -1, bestSymptom = null;
  for (const symptom of symptomNames) {
    const symVecObj = textToVector(symptom);
    const allKeys = Array.from(new Set([...Object.keys(userVecObj), ...Object.keys(symVecObj)]));
    const userVec = allKeys.map(k => userVecObj[k] || 0);
    const symVec = allKeys.map(k => symVecObj[k] || 0);
    const score = cosineSimilarity(userVec, symVec);
    if (score > bestScore) {
      bestScore = score;
      bestSymptom = symptom;
    }
  }
  return bestScore > 0.5 ? bestSymptom : null;
}

// GPT: busca pelo nome exato de sintoma (backup do fuzzy)
async function findClosestSymptom(userInput, idioma = "en") {
  const allSymptoms = supplementsCatalog.flatMap(s => s.symptoms || []);
  const symptomNames = Array.from(new Set(allSymptoms));
  const prompt = idioma === "pt"
    ? `A lista de sintomas é: ${symptomNames.join(", ")}.\nUsuário escreveu: "${userInput}".\nResponda SOMENTE com o nome exato de um sintoma da lista (copie igual!), ou "unknown".`
    : `The list of symptoms is: ${symptomNames.join(", ")}.\nUser wrote: "${userInput}".\nReply ONLY with the exact symptom name from the list (copy exactly!), or "unknown".`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: GPT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 20
    })
  });
  const data = await res.json();
  const match = data.choices?.[0]?.message?.content?.trim();
  if (!match) return "unknown";
  return symptomNames.find(s => s.toLowerCase() === match.toLowerCase()) || "unknown";
}

// GPT: fallback semântico e mapeamento ao suplemento mais próximo
async function semanticSymptomSupplementMatch(userInput, idioma = "en") {
  const allSymptoms = supplementsCatalog.flatMap(s => s.symptoms || []);
  const allSupplements = supplementsCatalog.map(s => ({
    name: s.supplementName,
    symptoms: s.symptoms,
    keywords: s.keywords,
    categories: s.mainCategory
  }));

  const prompt = idioma === "pt"
    ? `O usuário escreveu: "${userInput}". Dada a lista de sintomas: [${allSymptoms.join(", ")}] e suplementos: ${JSON.stringify(allSupplements)}. Qual sintoma da lista mais se relaciona com o texto do usuário? Qual suplemento cobre esse sintoma? Responda em JSON: {"symptom": "nome do sintoma", "supplement": "nome do suplemento"}.`
    : `User wrote: "${userInput}". Given this list of symptoms: [${allSymptoms.join(", ")}] and this list of supplements: ${JSON.stringify(allSupplements)}. Which symptom from the list is most related to the user's input? Which supplement best covers this symptom? Reply as JSON: {"symptom": "symptom name", "supplement": "supplement name"}.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: GPT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.12,
      max_tokens: 100
    })
  });
  const data = await res.json();
  try {
    let result = JSON.parse(data.choices?.[0]?.message?.content);
    if (result?.symptom && result?.supplement) return result;
    return null;
  } catch { return null; }
}

// Detecta idioma (PT padrão para pt-br/pt-pt)
async function detectLanguage(text) {
  // Heurística para PT-BR/PT-PT mesmo sem acentos
  const ptKeywords = [
    " de ", " que ", "não", "para", "por", "com", "uma", "se ", "tenho", "dor", "dores", "cabeça", "cabeca", "você", "voce", "é ", "esta", "está", "estou", "minha", "meu", "sentindo"
  ];
  const hasAccent = /[áéíóúãõçêâôíàéúóàêãõ]/i.test(text);
  const lower = ` ${text.toLowerCase()} `; // facilita busca por palavra isolada
  const hasPTKeyword = ptKeywords.some(word => lower.includes(word));
  if (hasAccent || hasPTKeyword) return "pt";
  return "en";
}

// Responde curiosidade sobre o Dr. Owl ou perguntas abertas do usuário
function drOwlAbout(idioma = "en") {
  return idioma === "pt"
    ? "Eu sou o Dr. Owl, seu especialista virtual em saúde natural e prevenção. Minha missão é ouvir sua história, analisar seus sintomas e, com base em ciência, te ajudar a cuidar do seu corpo de forma inteligente, humana e personalizada. Tudo com empatia, sem julgamentos e sempre pensando no seu bem-estar! Pode perguntar o que quiser — estou aqui para você."
    : "I'm Dr. Owl, your virtual specialist in natural health and prevention. My mission is to listen to your story, analyze your symptoms, and, based on science, help you take care of your body in a smart, human, and personalized way. Always empathetic, never judgmental, and always focused on your well-being. You can ask me anything—I'm here for you!";
}

// Arrays de triggers para identificar perguntas abertas de curiosidade ou sobre o bot
const BOT_TRIGGERS = [
  /como você pode ajudar/i, /como podes ajudar/i, /como funciona/i, /fala sobre ti/i, /quem é você/i,
  /who are you/i, /what can you do/i, /how can you help/i, /tell me about yourself/i, /your story/i
];

// ==== Perguntas por fase (usando arrays prontos)
async function generateFollowUps(supplement, symptom, phase, idioma = "en", userName = null) {
  if (!symptom || !supplement) return [];
  if (!userName) userName = ""; // fallback

  // Array de perguntas prontos (usando nome!)
  let perguntasFase = [];
  if (phase >= 1 && phase <= 5) {
    perguntasFase.push(getRandomQuestion(phase, idioma, userName));
    // Você pode adicionar sorteio de 2 a 3 perguntas por vez, se desejar
    while (perguntasFase.length < 3) {
      const q = getRandomQuestion(phase, idioma, userName);
      if (!perguntasFase.includes(q)) perguntasFase.push(q);
    }
  }
  return perguntasFase.filter(Boolean);
}

// Geração da resposta do funil (personalizada)
async function generateFunnelResponse(symptom, phase, idioma = "en", userName = null, tipo = null) {
  // Identifica perguntas abertas para respostas do Dr. Owl sobre si
  for (const regex of BOT_TRIGGERS) {
    if (typeof symptom === "string" && regex.test(symptom)) {
      return drOwlAbout(idioma);
    }
  }

  const catalogItem = supplementsCatalog.find(item =>
    (item.symptoms && item.symptoms.map(s => s.toLowerCase()).includes(symptom?.toLowerCase())) ||
    (item.keywords && item.keywords.map(k => k.toLowerCase()).includes(symptom?.toLowerCase()))
  );

  // Detecta sexo
  let sexo = null;
  if (userName) {
    const nameTrim = userName.trim();
    const isFeminine = /a$|ia$|eia$|ita$|ina$|ara$/i.test(nameTrim);
    const isMasculine = /o$|io$|eo$|ito$|ino$|aro$/i.test(nameTrim);
    if (isFeminine) sexo = "f";
    else if (isMasculine) sexo = "m";
  }
  function getTitlePrefix(userName, idioma = "pt", sexo = null) {
    if (!userName) return "";
    if (idioma === "pt") {
      if (sexo === "f") return `Sra. ${userName}`;
      if (sexo === "m") return `Sr. ${userName}`;
      return `Sr(a). ${userName}`;
    } else {
      if (sexo === "f") return `Ms. ${userName}`;
      if (sexo === "m") return `Mr. ${userName}`;
      return `${userName}`;
    }
  }
  const prefixName = getTitlePrefix(userName, idioma, sexo);

  // Mensagem fallback se não encontrar o sintoma
  if (!catalogItem) {
    const fallback = idioma === "pt"
      ? `Desculpe, não consegui identificar seu sintoma. Pode reformular?`
      : `Sorry, I couldn't identify your symptom. Can you rephrase?`;
    return prefixName ? `${prefixName}, ${fallback.charAt(0).toLowerCase()}${fallback.slice(1)}` : fallback;
  }

  const ingredients = (catalogItem.ingredients || []).join(", ");
  const benefits = (catalogItem.benefits || []).join(" ");
  const studies = (catalogItem.studies || []).join(" ");

  // --- ALTERAÇÃO ABAIXO ---
  let prompt = "";
  if (tipo === "historia") {
    prompt = idioma === "pt"
      ? `Conte uma história real, interessante e empática sobre uma pessoa que tinha o sintoma "${symptom}" e alcançou grandes melhorias após buscar ajuda natural. Não cite nomes reais, mas faça parecer um caso de sucesso de verdade, com detalhes humanos.`
      : `Share a real, interesting, and empathetic story about someone who suffered from "${symptom}" and experienced major improvements after seeking natural help. Do not mention real names, but make it feel like a true success case, with human details.`;
  } else if (tipo === "prova") {
    prompt = idioma === "pt"
      ? `Cite um estudo científico ou evidência relevante sobre como o sintoma "${symptom}" pode ser tratado ou melhorado com recursos naturais, mostrando dados ou resultados concretos, de forma didática e fácil de entender.`
      : `Provide a scientific study or relevant evidence about how "${symptom}" can be treated or improved with natural resources, showing data or concrete results in an educational, easy-to-understand way.`;
  } else if (tipo === "curiosidade") {
    prompt = idioma === "pt"
      ? `Compartilhe uma curiosidade, mito ou fato surpreendente sobre o sintoma "${symptom}" relacionado à saúde natural. Faça a curiosidade prender a atenção, sendo curta e interessante.`
      : `Share a curiosity, myth, or surprising fact about the symptom "${symptom}" related to natural health. Make the curiosity catchy, short, and interesting.`;
  } else {
    // Seu funil original por fase
    switch (phase) {
      case 1:
        prompt = idioma === "pt"
          ? `Você é Dr. Owl, especialista em saúde natural. Fale SOMENTE da FASE 1 do funil (conscientização) para o sintoma: "${symptom}". Comece com uma pergunta provocativa ou frase de impacto curta, gerando empatia. Mostre que muitas pessoas passam por isso sem saber o real motivo, que muitas tentam de tudo mas o sintoma persiste. Explique de forma simples, humana e científica por que esse sintoma é um alerta importante do corpo. NÃO cite ingredientes, soluções, suplementos ou marcas. Finalize com um gancho provocando curiosidade.`
          : `You are Dr. Owl, a natural health expert. ONLY discuss FUNNEL PHASE 1 (awareness) for the symptom: "${symptom}". Start with a provocative question or impactful statement to create empathy. Mention that thousands struggle without knowing the cause, even after trying everything. Explain simply, empathetically, and scientifically why this symptom is a body signal. DO NOT mention ingredients, solutions, supplements, or brands. End with a curiosity hook.`;
        break;
      case 2:
        prompt = idioma === "pt"
          ? `Você é Dr. Owl. Fale apenas sobre a gravidade de ignorar o sintoma "${symptom}". Use exemplos reais, nunca exagere. Não cite soluções ou ingredientes. Finalize com uma pergunta provocativa.`
          : `You are Dr. Owl. Talk only about the risks of ignoring "${symptom}". Use real-world examples, don't exaggerate. Do not mention solutions or ingredients. End with a provocative question.`;
        break;
      case 3:
        prompt = idioma === "pt"
          ? `Você é Dr. Owl. Prove cientificamente como o sintoma "${symptom}" pode ser revertido ou melhorado. Use dados, estatísticas ou resultados de estudos, de forma breve. NÃO cite suplemento ou solução, só prova.`
          : `You are Dr. Owl. Provide scientific proof that "${symptom}" can be improved or reversed. Use stats, studies or data, briefly. DO NOT mention supplements or solutions, just proof.`;
        break;
      case 4:
        prompt = idioma === "pt"
          ? `Você é Dr. Owl. Fale apenas sobre ativos naturais relacionados a "${symptom}". Explique benefícios, fatos curiosos e como eles ajudam, sem citar marcas ou nomes de suplementos.`
          : `You are Dr. Owl. Speak only about natural actives related to "${symptom}". Explain benefits, curiosities, and how they help, without brand or supplement names.`;
        break;
      case 5:
        prompt = idioma === "pt"
          ? `Você é Dr. Owl. Apresente, de forma indireta e objetiva, um suplemento natural como solução para "${symptom}" (não cite o nome, só descreva benefícios e ativos: ${ingredients}, ${benefits}).`
          : `You are Dr. Owl. Present, indirectly and objectively, a natural supplement as a solution for "${symptom}" (don't mention the name, only describe benefits and actives: ${ingredients}, ${benefits}).`;
        break;
      default:
        prompt = idioma === "pt"
          ? `Explique de forma empática e científica sobre o sintoma: "${symptom}".`
          : `Explain empathetically and scientifically about the symptom: "${symptom}".`;
    }
  }
  // --- FIM DAS ALTERAÇÕES ---

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: GPT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.41,
      max_tokens: 320
    })
  });
  const data = await res.json();
  let response = data.choices?.[0]?.message?.content?.trim() || prompt;

  // Aplica prefixo Sr./Sra./Mr./Ms. Nome, caso ainda não exista na resposta final!
  if (prefixName && !response.toLowerCase().startsWith(prefixName.toLowerCase())) {
    response = `${prefixName}, ${response.charAt(0).toLowerCase()}${response.slice(1)}`;
  }

  return response;
}

// ==== HANDLER PRINCIPAL ====
async function processSymptomFlow(session, message, res, sessionId) {
  let fuzzy = fuzzyFindSymptom(message);
  if (fuzzy) {
    session.symptom = fuzzy;
  } else {
    let gptClosest = await findClosestSymptom(message, session.idioma);
    if (gptClosest && gptClosest !== "unknown") {
      session.symptom = gptClosest;
    } else {
      let semanticFallback = await semanticSymptomSupplementMatch(message, session.idioma);
      if (semanticFallback && semanticFallback.symptom) {
        session.symptom = semanticFallback.symptom;
      } else {
        session.symptom = message; // fallback absoluto, nunca trava
      }
    }
  }
  session.phase = 1;
  session.count = 1;

  // Busca suplemento relacionado
  const supplement = supplementsCatalog.find(s =>
    Array.isArray(s.symptoms) &&
    s.symptoms.some(sym => sym.toLowerCase() === session.symptom?.toLowerCase())
  );

  // 1. MICRO-EMPATIA & HISTÓRICO
  let empathyMsg = "";
  if (session.symptom) {
    if (session.idioma === "pt") {
      empathyMsg = `Sinto muito que esteja passando por "${session.symptom}". Você não está sozinho(a), muitas pessoas também passam por isso — mas cada caso é único e vamos juntos entender o seu.`;
    } else {
      empathyMsg = `I'm sorry you're experiencing "${session.symptom}". You're not alone—many people go through this, but every case is unique and we'll figure out yours together.`;
    }
    // Se já houver respostas investigativas anteriores, personalize mais (opcional)
    if (session.lastCauses) {
      empathyMsg += session.idioma === "pt"
        ? ` Você já mencionou: ${session.lastCauses.join(", ")}. Isso me ajuda a te entender melhor.`
        : ` You previously mentioned: ${session.lastCauses.join(", ")}. That helps me understand you better.`;
    }
  }

  // 2. RESPOSTA DO FUNIL
 // === NOVO BLOCO: PERGUNTAS INVESTIGATIVAS AUTOMÁTICAS GPT ===

const dynamicPrompt = session.idioma === "pt"
  ? `Usuário relatou o sintoma: "${session.symptom}". Liste até 3 possíveis causas comuns desse sintoma e elabore 2 ou 3 perguntas curtas, empáticas, como um profissional humano, para investigar o contexto do usuário. As perguntas devem ser investigativas e empáticas. Responda em JSON: {"causas": [], "perguntas": []}`
  : `User reported the symptom: "${session.symptom}". List up to 3 possible common causes of this symptom and write 2 or 3 brief, empathetic investigative questions a human professional would ask to better understand the user's context. Reply in JSON: {"causes": [], "questions": []}`;

const gptInvestigativeRes = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${OPENAI_API_KEY}`
  },
  body: JSON.stringify({
    model: GPT_MODEL,
    messages: [{ role: "user", content: dynamicPrompt }],
    temperature: 0.2,
    max_tokens: 220
  })
});
const gptInvestigativeData = await gptInvestigativeRes.json();

let causes = [], questions = [];
try {
  const parsed = JSON.parse(gptInvestigativeData.choices?.[0]?.message?.content);
  causes = parsed.causas || parsed.causes || [];
  questions = parsed.perguntas || parsed.questions || [];
} catch {}

/// 2. Só exibe perguntas investigativas NA PRIMEIRA interação sobre o sintoma, junto com resposta empática do funil:
if (!session.investigationAsked) {
  session.investigationAsked = true;

  // 1. Resposta empática/consciente sobre o sintoma (Fase 1 do funil)
  const answer = await generateFunnelResponse(session.symptom, 1, session.idioma, session.userName);

  // 2. Texto para avisar sobre as perguntas investigativas
  let avisoPerguntas = "";
  if (questions.length) {
    avisoPerguntas = (session.idioma === "pt"
      ? "Posso te perguntar algumas coisas para entender melhor e te orientar da melhor forma? Clique numa opção abaixo:"
      : "Can I ask you a few questions to better understand your situation and guide you? Click on one of the options below:");
  }

  // 3. Aviso ético
  let ethicalNotice = session.idioma === "pt"
    ? "\n\nLembrando: minhas respostas não substituem uma consulta médica, mas posso te orientar com informações baseadas em ciência e bem-estar."
    : "\n\nJust a reminder: my answers do not replace a doctor's visit, but I can guide you with science-based wellness information.";

  // 4. Resposta final
  const fullEmpatia = [answer, avisoPerguntas, ethicalNotice].filter(Boolean).join("\n\n");

  logEvent("chat", {
    sessionId,
    phase: session.phase,
    supplement: supplement?.supplementName,
    symptom: session.symptom,
    idioma: session.idioma,
    userName: session.userName,
    message,
    answer: fullEmpatia,
    followupQuestions: questions
  });

  return res.status(200).json({
    reply: fullEmpatia,
    followupQuestions: questions, // PERGUNTAS INVESTIGATIVAS CLIQUE
    type: "investigative",
    metadata: {
      supplement: supplement?.supplementName,
      supplementId: supplement?.supplementId,
      symptom: session.symptom,
      phase: session.phase,
      idioma: session.idioma,
      sessionId,
      count: session.count,
      userName: session.userName
    },
    legacyContent: fullEmpatia + "\n\n" +
      (questions.length
        ? (session.idioma === "pt" ? "Responda para continuar:\n" : "Answer to continue:\n") +
          questions.map((q, i) => `${i + 1}. ${q}`).join("\n")
        : "")
  });
}

// Se já respondeu investigativas, segue fluxo normal:
const answer = await generateFunnelResponse(session.symptom, session.phase, session.idioma, session.userName);
const followupQuestions = await generateFollowUps(supplement?.supplementName, session.symptom, session.phase, session.idioma, session.userName);

let ethicalNotice = session.idioma === "pt"
  ? "\n\nLembrando: minhas respostas não substituem uma consulta médica, mas posso te orientar com informações baseadas em ciência e bem-estar."
  : "\n\nJust a reminder: my answers do not replace a doctor's visit, but I can guide you with science-based wellness information.";

const finalReply = [
  empathyMsg,
  answer,
  ethicalNotice
].filter(Boolean).join('\n\n');

  logEvent("chat", {
    sessionId,
    phase: session.phase,
    supplement: supplement?.supplementName,
    symptom: session.symptom,
    idioma: session.idioma,
    userName: session.userName,
    message,
    answer,
    followupQuestions
  });

  return res.status(200).json({
    reply: finalReply,
    followupQuestions,
    type: "default",
    metadata: {
      supplement: supplement?.supplementName,
      supplementId: supplement?.supplementId,
      symptom: session.symptom,
      phase: session.phase,
      idioma: session.idioma,
      sessionId,
      count: session.count,
      userName: session.userName
    },
    legacyContent: finalReply + "\n\n" +
      (followupQuestions.length
        ? (session.idioma === "pt" ? "Vamos explorar mais:\nEscolha uma opção:\n" : "Let's explore further:\nChoose an option:\n") +
          followupQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")
        : "")
  });
}

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, selectedQuestion, sessionId, userName } = req.body;
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Mensagem vazia ou inválida." });
  }

  if (!sessionMemory[sessionId]) sessionMemory[sessionId] = { phase: 1, symptom: null, count: 0, idioma: "en", userName: null, anonymous: false, sessionId };
  const session = sessionMemory[sessionId];

 if (!session.idioma) session.idioma = await detectLanguage(message);

  // ==== NOVO BLOCO para captura de nome + sintoma ====
 if (!session.userName && !session.anonymous) {
  // Permite seguir anônimo com qualquer variação básica
  if (/^(skip|pular|anônim[oa]|anonymous)$/i.test(message.trim())) {
    session.anonymous = true;
    // PROCESSA imediatamente o possível sintoma anterior
    if (session.lastSymptomMessage) {
      return await processSymptomFlow(session, session.lastSymptomMessage, res, sessionId);
    }
    // Se não tinha nada antes, pergunta pelo sintoma normalmente
    return res.status(200).json({
      reply: session.idioma === "pt"
        ? "Pode me contar qual sintoma mais incomoda você? (Exemplo: dores, cansaço, digestão...)"
        : "Can you tell me which symptom is bothering you the most? (Example: pain, fatigue, digestion...)",
      followupQuestions: []
    });
  }
  // Aceita nome só se for curto (máx. 2 palavras)
  if (/^[a-zA-Zà-úÀ-Ú']{2,30}( [a-zA-Zà-úÀ-Ú']{2,30})?$/.test(message.trim())) {
    session.userName = message.trim().replace(/^\w/, c => c.toUpperCase());
    // PROCESSA imediatamente o possível sintoma anterior
    if (session.lastSymptomMessage) {
      return await processSymptomFlow(session, session.lastSymptomMessage, res, sessionId);
    }
    // Se não tinha nada antes, pergunta pelo sintoma normalmente
    return res.status(200).json({
      reply: session.idioma === "pt"
        ? `Obrigado, ${session.userName}! Agora me conte: qual sintoma mais incomoda você?`
        : `Thank you, ${session.userName}! Now, tell me: which symptom is bothering you the most?`,
      followupQuestions: []
    });
  }
  // Se não é nome/anônimo, guarda mensagem para processar depois
  session.lastSymptomMessage = message;
  // SÓ PEDE O NOME UMA VEZ! (Frontend cuida do clique "continuar sem se identificar")
  return res.status(200).json({
    reply: session.idioma === "pt"
      ? `Aqui no consultório do Dr. Owl, cada história é especial. Me conta: como você gostaria de ser chamado(a) por mim? Pode ser seu nome, apelido, até um codinome — prometo guardar com carinho esse segredo! Se não quiser contar, clique em "Continuar sem se identificar".`
      : `Here in Dr. Owl's office, every story is unique. Tell me: how would you like me to call you? It can be your first name, a nickname, or even a secret agent name—I promise to keep it safe! If you prefer not to share, just click "Continue without identifying".`,
    followupQuestions: []
  });
}
  // Sintoma: fuzzy > GPT exact > fallback semântico suplemento
  let supplementName = null;
  if (!selectedQuestion) {
    let fuzzy = fuzzyFindSymptom(message);
    if (fuzzy) {
      session.symptom = fuzzy;
    } else {
      let gptClosest = await findClosestSymptom(message, session.idioma);
      if (gptClosest && gptClosest !== "unknown") {
        session.symptom = gptClosest;
      } else {
        let fallback = await semanticSymptomSupplementMatch(message, session.idioma);
        if (fallback && fallback.symptom) {
          session.symptom = fallback.symptom;
          supplementName = fallback.supplement;
        } else {
          session.symptom = message;
        }
      }
    }
    session.phase = 1;
    session.count = 1;
  } else {
    session.phase = Math.min(session.phase + 1, 5);
    session.count++;
  }

  if (session.count > QUESTION_LIMIT) {
    return res.status(200).json({
      content: session.idioma === "pt"
        ? "Você atingiu o limite de perguntas nesta sessão. Deseja continuar por e-mail?"
        : "You have reached the question limit for this session. Want to continue by email?",
      followupQuestions: []
    });
  }

  let supplement = supplementName
    ? supplementsCatalog.find(s => s.supplementName === supplementName)
    : supplementsCatalog.find(s =>
        Array.isArray(s.symptoms) &&
        s.symptoms.some(sym => sym.toLowerCase() === session.symptom?.toLowerCase())
      );

  // PERSONALIZAÇÃO
  const answer = await generateFunnelResponse(session.symptom, session.phase, session.idioma, session.userName);
  const followupQuestions = await generateFollowUps(
    supplement?.supplementName,
    session.symptom,
    session.phase,
    session.idioma,
    session.userName
  );

  logEvent("chat", {
    sessionId,
    phase: session.phase,
    supplement: supplement?.supplementName,
    symptom: session.symptom,
    idioma: session.idioma,
    userName: session.userName,
    message,
    answer,
    followupQuestions
  });

 // USE ESTE BLOCO:
return res.status(200).json({
  reply: finalReply,          // <<<< AGORA SIM! Aqui vai a resposta humanizada!
  followupQuestions,
  type: "default",
  metadata: {
    supplement: supplement?.supplementName,
    supplementId: supplement?.supplementId,
    symptom: session.symptom,
    phase: session.phase,
    idioma: session.idioma,
    sessionId,
    count: session.count,
    userName: session.userName
  },
  legacyContent: finalReply + "\n\n" +
    (followupQuestions.length
      ? (session.idioma === "pt" ? "Vamos explorar mais:\nEscolha uma opção:\n" : "Let's explore further:\nChoose an option:\n") +
        followupQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")
      : "")
});
}

export default handler;
