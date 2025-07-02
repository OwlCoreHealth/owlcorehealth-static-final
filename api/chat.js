import path from "path";
import fs from "fs";
import cosineSimilarity from "cosine-similarity";

// === Novo: função de similaridade Levenshtein para tolerância a erro ortográfico ===
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array.from({ length: a.length + 1 }, () => []);
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] = Math.min(
        matrix[i-1][j] + 1,
        matrix[i][j-1] + 1,
        matrix[i-1][j-1] + (a[i-1].toLowerCase() === b[j-1].toLowerCase() ? 0 : 1)
      );
    }
  }
  return matrix[a.length][b.length];
}

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
  // Novo: menor tolerância (0.4) se cosine falhar mas Levenshtein for aceitável
  if (bestScore > 0.5) return bestSymptom;

  // ====== Bloco extra para erros ortográficos ======
  let minDist = 99, closestSymptom = null;
  for (const symptom of symptomNames) {
    const dist = levenshtein(userInput.toLowerCase(), symptom.toLowerCase());
    if (dist < minDist && dist <= 3) { // tolera até 3 letras erradas
      minDist = dist;
      closestSymptom = symptom;
    }
  }
  if (closestSymptom) return closestSymptom;

  return null;
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
    ? `O usuário escreveu: "${userInput}". Dada a lista de sintomas: [${allSymptoms.join(", ")}] e suplementos: ${JSON.stringify(allSupplements)}. Qual sintoma da lista mais se relaciona com o texto do usuário? Qual suplemento cobre esse sintoma? Responda em JSON: {"symptom": "nome do sintoma", "supplement": "nome do suplemento"}. Se não achar nada semelhante, retorne {"symptom":"unknown","supplement":"unknown"}.`
    : `User wrote: "${userInput}". Given this list of symptoms: [${allSymptoms.join(", ")}] and this list of supplements: ${JSON.stringify(allSupplements)}. Which symptom from the list is most related to the user's input? Which supplement best covers this symptom? Reply as JSON: {"symptom": "symptom name", "supplement": "supplement name"}. If nothing is similar, return {"symptom":"unknown","supplement":"unknown"}.`;

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
    if (result?.symptom && result.symptom !== "unknown" && result?.supplement) return result;
    return null;
  } catch { return null; }
}

// Detecta idioma
async function detectLanguage(text) {
  return /[áéíóúãõç]/i.test(text) ? "pt" : "en";
}

// Perguntas follow-up, limpando resposta
async function generateFollowUps(supplement, symptom, phase, idioma = "en", userName = null) {
  if (!symptom || !supplement) return [];
  const prefix = userName ? (idioma === "pt" ? `${userName}, ` : `${userName}, `) : "";
  const prompt = idioma === "pt"
    ? `Considere o suplemento (não cite o nome): "${supplement}". Crie 3 perguntas curtas, provocativas e pessoais para avançar no funil sobre o sintoma "${symptom}", fase ${phase}. Todas as perguntas DEVEM chamar o usuário pelo nome: "${userName}". Exemplo de temas: 1. Consequências, 2. Curiosidade pessoal, 3. Solução natural. Não repita o sintoma, não use termos vagos.`
    : `Consider the supplement (never say its name): "${supplement}". Create 3 short, provocative, and personal questions to move forward in the funnel about the symptom "${symptom}", phase ${phase}. All questions MUST use the user's name: "${userName}". Example topics: 1. Consequences, 2. Personal curiosity, 3. Natural solution. Don't repeat the symptom, don't use generic terms.`;
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
  return questions.map(q =>
    q.replace(/\[User's Name\]|\[Nome do Usuário\]|\[Nome\]|User's Name|Nome do Usuário/gi, userName ? userName.charAt(0).toUpperCase() + userName.slice(1) : "")
      .replace(/\s+([,.?!])/g, '$1')
      .replace(/\s{2,}/g, ' ')
      .trim()
  );
}

// Geração da resposta do funil (personalizada)
async function generateFunnelResponse(symptom, phase, idioma = "en", userName = null) {
  const catalogItem = supplementsCatalog.find(item =>
    (item.symptoms && item.symptoms.map(s => s.toLowerCase()).includes(symptom?.toLowerCase())) ||
    (item.keywords && item.keywords.map(k => k.toLowerCase()).includes(symptom?.toLowerCase()))
  );
  const prefix = userName
    ? (idioma === "pt" ? `Olá, ${userName}! ` : `Hi, ${userName}. `)
    : "";

  if (!catalogItem) {
    return idioma === "pt"
      ? `${prefix}Desculpe, não consegui identificar seu sintoma. Pode reformular?`
      : `${prefix}Sorry, I couldn't identify your symptom. Can you rephrase?`;
  }

  const ingredients = (catalogItem.ingredients || []).join(", ");
  const benefits = (catalogItem.benefits || []).join(" ");
  const studies = (catalogItem.studies || []).join(" ");

  let prompt = "";
  switch (phase) {
    case 1:
      prompt = idioma === "pt"
        ? `${prefix}Você é Dr. Owl, especialista em saúde natural. Fale SOMENTE da FASE 1 do funil (conscientização) para o sintoma: "${symptom}". Comece com uma pergunta provocativa ou frase de impacto curta, gerando empatia. Mostre que muitas pessoas passam por isso sem saber o real motivo, que muitas tentam de tudo mas o sintoma persiste. Explique de forma simples, humana e científica por que esse sintoma é um alerta importante do corpo. NÃO cite ingredientes, soluções, suplementos ou marcas. Finalize com um gancho provocando curiosidade.`
        : `${prefix}You are Dr. Owl, a natural health expert. ONLY discuss FUNNEL PHASE 1 (awareness) for the symptom: "${symptom}". Start with a provocative question or impactful statement to create empathy. Mention that thousands struggle without knowing the cause, even after trying everything. Explain simply, empathetically, and scientifically why this symptom is a body signal. DO NOT mention ingredients, solutions, supplements, or brands. End with a curiosity hook.`;
      break;
    case 2:
      prompt = idioma === "pt"
        ? `${prefix}Você é Dr. Owl. Fale apenas sobre a gravidade de ignorar o sintoma "${symptom}". Use exemplos reais, nunca exagere. Não cite soluções ou ingredientes. Finalize com uma pergunta provocativa.`
        : `${prefix}You are Dr. Owl. Talk only about the risks of ignoring "${symptom}". Use real-world examples, don't exaggerate. Do not mention solutions or ingredients. End with a provocative question.`;
      break;
    case 3:
      prompt = idioma === "pt"
        ? `${prefix}Você é Dr. Owl. Prove cientificamente como o sintoma "${symptom}" pode ser revertido ou melhorado. Use dados, estatísticas ou resultados de estudos, de forma breve. NÃO cite suplemento ou solução, só prova.`
        : `${prefix}You are Dr. Owl. Provide scientific proof that "${symptom}" can be improved or reversed. Use stats, studies or data, briefly. DO NOT mention supplements or solutions, just proof.`;
      break;
    case 4:
      prompt = idioma === "pt"
        ? `${prefix}Você é Dr. Owl. Fale apenas sobre ativos naturais relacionados a "${symptom}". Explique benefícios, fatos curiosos e como eles ajudam, sem citar marcas ou nomes de suplementos.`
        : `${prefix}You are Dr. Owl. Speak only about natural actives related to "${symptom}". Explain benefits, curiosities, and how they help, without brand or supplement names.`;
      break;
    case 5:
      prompt = idioma === "pt"
        ? `${prefix}Você é Dr. Owl. Apresente, de forma indireta e objetiva, um suplemento natural como solução para "${symptom}" (não cite o nome, só descreva benefícios e ativos: ${ingredients}, ${benefits}).`
        : `${prefix}You are Dr. Owl. Present, indirectly and objectively, a natural supplement as a solution for "${symptom}" (don't mention the name, only describe benefits and actives: ${ingredients}, ${benefits}).`;
      break;
    default:
      prompt = idioma === "pt"
        ? `${prefix}Explique de forma empática e científica sobre o sintoma: "${symptom}".`
        : `${prefix}Explain empathetically and scientifically about the symptom: "${symptom}".`;
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
  return data.choices?.[0]?.message?.content?.trim() || prompt;
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
      let fallback = await semanticSymptomSupplementMatch(message, session.idioma);
      if (fallback && fallback.symptom && fallback.symptom !== "unknown") {
        session.symptom = fallback.symptom;
      } else {
        session.symptom = message; // fallback absoluto, nunca trava
      }
    }
  }
  session.phase = 1;
  session.count = 1;

  const supplement = supplementsCatalog.find(s =>
    Array.isArray(s.symptoms) &&
    s.symptoms.some(sym => sym.toLowerCase() === session.symptom?.toLowerCase())
  );

  const answer = await generateFunnelResponse(session.symptom, session.phase, session.idioma, session.userName);
  const followupQuestions = await generateFollowUps(supplement?.supplementName, session.symptom, session.phase, session.idioma, session.userName);

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

  if (!sessionMemory[sessionId]) sessionMemory[sessionId] = { phase: 1, symptom: null, count: 0, idioma: "en", userName: null, anonymous: false, sessionId };
  const session = sessionMemory[sessionId];

  if (!session.idioma) session.idioma = await detectLanguage(message);

  // ==== NOVO BLOCO para captura de nome + sintoma ====
  if (!session.userName && !session.anonymous) {
    if (/^(skip|pular|anônim[oa]|anonymous)$/i.test(message.trim())) {
      session.anonymous = true;
      return res.status(200).json({
        reply: session.idioma === "pt"
          ? "Pode me contar qual sintoma mais incomoda você? (Exemplo: dores, cansaço, digestão...)"
          : "Can you tell me which symptom is bothering you the most? (Example: pain, fatigue, digestion...)",
        followupQuestions: []
      });
    }
    if (/^[a-zA-Zà-úÀ-Ú\s']{2,30}$/.test(message.trim())) {
      session.userName = message.trim().replace(/^\w/, c => c.toUpperCase());
      if (session.lastSymptomMessage) {
        return await processSymptomFlow(session, session.lastSymptomMessage, res);
      } else {
        return res.status(200).json({
          reply: session.idioma === "pt"
            ? `Obrigado, ${session.userName}! Agora me conte: qual sintoma mais incomoda você?`
            : `Thank you, ${session.userName}! Now, tell me: which symptom is bothering you the most?`,
          followupQuestions: []
        });
      }
    }
    session.lastSymptomMessage = message;
    return res.status(200).json({
      reply: session.idioma === "pt"
        ? `Aqui no consultório do Dr. Owl, cada história é especial.\nMe conta: como você gostaria de ser chamado(a) por mim?\nPode ser seu nome, apelido, até um codinome — prometo guardar com carinho esse segredo!\nSe não quiser contar, digite "pular" ou "anônimo(a)".`
        : `Here in Dr. Owl's office, every story is unique. Tell me: how would you like me to call you? It can be your first name, a nickname, or even a secret agent name—I promise to keep it safe! If you prefer not to share, just type "skip" or "anonymous" and I'll keep guiding you as best as I can.`,
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
        if (fallback && fallback.symptom && fallback.symptom !== "unknown") {
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

  const answer = await generateFunnelResponse(session.symptom, session.phase, session.idioma, session.userName);
  const followupQuestions = await generateFollowUps(supplement?.supplementName, session.symptom, session.phase, session.idioma, session.userName);

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
