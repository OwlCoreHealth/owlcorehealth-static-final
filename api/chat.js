import path from "path";
import fs from "fs";
import cosineSimilarity from "cosine-similarity";

// Lê o catalogo de suplementos
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
const QUESTION_LIMIT = 8;

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

// Detecta idioma
async function detectLanguage(text) {
  return /[áéíóúãõç]/i.test(text) ? "pt" : "en";
}

async function generateFollowUps(supplement, symptom, phase, idioma = "en", userName = null) {
  if (!symptom || !supplement) return [];

  // Detecta sexo com base na terminação do nome
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

  const prompt = idioma === "pt"
    ? `Considere o suplemento (não cite o nome): "${supplement}". Crie 3 perguntas curtas, provocativas e pessoais para avançar no funil sobre o sintoma "${symptom}", fase ${phase}. Todas as perguntas DEVEM começar com o nome "${prefixName}". Exemplo de temas: 1. Consequências, 2. Curiosidade pessoal, 3. Solução natural. Não repita o sintoma, não use termos vagos.`
    : `Consider the supplement (never say its name): "${supplement}". Create 3 short, provocative, and personal questions to move forward in the funnel about the symptom "${symptom}", phase ${phase}. All questions MUST start with the name "${prefixName}". Example topics: 1. Consequences, 2. Personal curiosity, 3. Natural solution. Don't repeat the symptom, don't use generic terms.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: GPT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.57,
      max_tokens: 120
    })
  });
  const data = await res.json();
  const questions = data.choices?.[0]?.message?.content
    ?.split(/\d+\.\s*|\n|\r/)
    .map(q => q.trim())
    .filter(q => q.length > 7 && !/^undefined/i.test(q))
    .slice(0, 3) || [];

  // Pós-processamento: força início com “Sr./Sra. Nome” ou “Mr./Ms. Name”
  return questions.map(q => {
    q = q.replace(/null|User's Name|\[User's Name\]|\[Nome do Usuário\]|\[Nome\]|Nome do Usuário/gi, "")
         .replace(/\s+([,.?!])/g, '$1')
         .replace(/\s{2,}/g, ' ')
         .trim();
    if (prefixName && !q.toLowerCase().startsWith(prefixName.toLowerCase())) {
      // Só adiciona prefixo se ainda não existe
      return `${prefixName}, ${q.charAt(0).toLowerCase()}${q.slice(1)}`;
    }
    return q;
  });
}

// Geração da resposta do funil (personalizada)
async function generateFunnelResponse(symptom, phase, idioma = "en", userName = null) {
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

  let prompt = "";
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
async function processSymptomFlow(session, message, res) {
  let fuzzy = fuzzyFindSymptom(message);
  if (fuzzy) {
    session.symptom = fuzzy;
  } else {
    let gptClosest = await findClosestSymptom(message, session.idioma);
    if (gptClosest && gptClosest !== "unknown") {
      session.symptom = gptClosest;
    } else {
      let semanticFallback = await semanticSymptomFallback(message, session.idioma);
      if (semanticFallback) {
        session.symptom = semanticFallback;
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

const answer = await generateFunnelResponse(session.symptom, session.phase, session.idioma, session.userName);
const followupQuestions = await generateFollowUps(supplement?.supplementName, session.symptom, session.phase, session.idioma, session.userName);


return res.status(200).json({
  reply: answer,
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
  legacyContent: answer + "\n\n" +
    (followupQuestions.length
      ? (session.idioma === "pt" ? "Vamos explorar mais:\nEscolha uma opção:\n" : "Let's explore further:\nChoose an option:\n") +
        followupQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")
      : "")
});

  logEvent("chat", {
    sessionId: session.sessionId,
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
    reply: answer,
    followupQuestions,
    type: "default",
    metadata: {
      supplement: supplement?.supplementName,
      supplementId: supplement?.supplementId,
      symptom: session.symptom,
      phase: session.phase,
      idioma: session.idioma,
      sessionId: session.sessionId,
      count: session.count,
      userName: session.userName
    }
  });
}

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, selectedQuestion, sessionId, userName } = req.body;
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Mensagem vazia ou inválida." });
  }

  if (!sessionMemory[sessionId]) sessionMemory[sessionId] = { phase: 1, symptom: null, count: 0, idioma: "en", userName: null, anonymous: false };
  const session = sessionMemory[sessionId];

  if (!session.idioma) session.idioma = await detectLanguage(message);

  // ==== NOVO BLOCO para captura de nome + sintoma ====
if (!session.userName && !session.anonymous) {
  // Se o usuário digitou "skip", "pular", "anônimo", segue sem nome
  if (/^(skip|pular|anônim[oa]|anonymous)$/i.test(message.trim())) {
    session.anonymous = true;
    // Peça o sintoma agora
    return res.status(200).json({
      reply: session.idioma === "pt"
        ? "Pode me contar qual sintoma mais incomoda você? (Exemplo: dores, cansaço, digestão...)"
        : "Can you tell me which symptom is bothering you the most? (Example: pain, fatigue, digestion...)",
      followupQuestions: []
    });
  }
  // Se mensagem parece um nome válido, salva e processa o último sintoma informado (se existir)
  if (/^[a-zA-Zà-úÀ-Ú\s']{2,30}$/.test(message.trim())) {
    session.userName = message.trim().replace(/^\w/, c => c.toUpperCase());
    // Se já temos uma mensagem de sintoma armazenada antes do nome, processa o funil com ela!
    if (session.lastSymptomMessage) {
      return await processSymptomFlow(session, session.lastSymptomMessage, res);
    } else {
      // Se não há histórico de sintoma, peça agora
      return res.status(200).json({
        reply: session.idioma === "pt"
          ? `Obrigado, ${session.userName}! Agora me conte: qual sintoma mais incomoda você?`
          : `Thank you, ${session.userName}! Now, tell me: which symptom is bothering you the most?`,
        followupQuestions: []
      });
    }
  }
  // Caso não seja nome nem comando de anonimato, considera a mensagem como possível sintoma e pede o nome
  session.lastSymptomMessage = message;
  return res.status(200).json({
    reply: session.idioma === "pt"
      ? `Aqui no consultório do Dr. Owl, cada história é especial.\nMe conta: como você gostaria de ser chamado(a) por mim?\nPode ser seu nome, apelido, até um codinome — prometo guardar com carinho esse segredo!\nSe não quiser contar, digite "pular" ou "anônimo(a)".`
      : `Here in Dr. Owl's office, every story is unique. Tell me: how would you like me to call you? It can be your first name, a nickname, or even a secret agent name—I promise to keep it safe! If you prefer not to share, just type "skip" or "anonymous" and I'll keep guiding you as best as I can.`,
    followupQuestions: []
  });
}

  // 2. Sintoma: fuzzy > GPT exact > fallback semântico suplemento
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

  // Busca qual suplemento cobre o sintoma (preferencialmente do fallback, senão fuzzy)
  let supplement = supplementName
    ? supplementsCatalog.find(s => s.supplementName === supplementName)
    : supplementsCatalog.find(s =>
        Array.isArray(s.symptoms) &&
        s.symptoms.some(sym => sym.toLowerCase() === session.symptom?.toLowerCase())
      );

  // Resposta e perguntas sempre PERSONALIZADAS
  const answer = await generateFunnelResponse(session.symptom, session.phase, session.idioma, session.userName);
 const followupQuestions = await generateFollowUps(...);
// NÃO faça return questions.map() aqui!
// Use diretamente followupQuestions, que já está pronto:

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
    reply: answer,
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
    legacyContent: answer + "\n\n" +
      (followupQuestions.length
        ? (session.idioma === "pt" ? "Vamos explorar mais:\nEscolha uma opção:\n" : "Let's explore further:\nChoose an option:\n") +
          followupQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")
        : "")
  });
}

export default handler;
