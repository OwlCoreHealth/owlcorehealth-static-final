import path from "path";
import fs from "fs";
import cosineSimilarity from "cosine-similarity";

// Lê o catalogo de suplementos
const catalogPath = path.join(process.cwd(), "api", "data", "symptoms_catalog.json");
const supplementsCatalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

// ==== Funções auxiliares ====
function textToVector(text) {
  if (!text || typeof text !== "string") return {};
  const words = text.toLowerCase().split(/\s+/);
  const freq = {};
  words.forEach(w => freq[w] = (freq[w] || 0) + 1);
  return freq;
}

function fuzzyFindSymptom(userInput) {
  // Busca todos os sintomas de todos suplementos
  const allSymptoms = supplementsCatalog.flatMap(s => s.symptoms || []);
  const symptomNames = Array.from(new Set(allSymptoms));
  const userVecObj = textToVector(userInput);
  let bestScore = -1;
  let bestSymptom = null;

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

const logsDir = "/tmp/logs";
if (!fs.existsSync(logsDir)) {
  try { fs.mkdirSync(logsDir, { recursive: true }); } catch (e) { /* ignora erro */ }
}
function logEvent(event, data) {
  const logPath = logsDir + "/chat.log";
  const log = `[${new Date().toISOString()}] [${event}] ${JSON.stringify(data)}\n`;
  try { fs.appendFileSync(logPath, log); } catch (e) { /* ignora erro */ }
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GPT_MODEL = "gpt-4o-mini";

let sessionMemory = {};
const QUESTION_LIMIT = 8;

// GPT backup, se fuzzy falhar
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

// Detecta idioma
async function detectLanguage(text) {
  return /[áéíóúãõç]/i.test(text) ? "pt" : "en";
}

// Geração de perguntas follow-up
async function generateFollowUps(supplement, symptom, phase, idioma = "en") {
  const prompt = idioma === "pt"
    ? `Considere o suplemento (não cite o nome): "${supplement.supplementName}". Gere 3 perguntas provocativas para avançar o funil sobre o sintoma "${symptom}", fase ${phase}. 1. Dor/risco, 2. Curiosidade, 3. Solução natural. Seja direto, breve e mantenha curiosidade.`
    : `Consider the supplement (never say its name): "${supplement.supplementName}". Generate 3 provocative follow-up questions for funnel phase ${phase}, about "${symptom}". 1. Pain/risk, 2. Curiosity, 3. Natural solution. Keep it short, direct and curiosity-driven.`;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: GPT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 180
    })
  });
  const data = await res.json();
  const questions = data.choices?.[0]?.message?.content?.split(/\d+\.\s+/).filter(Boolean).slice(0, 3) || [];
  return questions;
}

// ... (importações e funções auxiliares acima)

async function generateFunnelResponse(symptom, phase, idioma = "en") {
  // Busca o objeto do sintoma/suplemento correspondente
  const catalogItem = supplementsCatalog.find(item =>
    (item.symptoms && item.symptoms.map(s => s.toLowerCase()).includes(symptom?.toLowerCase())) ||
    (item.keywords && item.keywords.map(k => k.toLowerCase()).includes(symptom?.toLowerCase()))
  );

  if (!catalogItem) {
    return idioma === "pt"
      ? "Desculpe, não consegui identificar seu sintoma. Pode reformular?"
      : "Sorry, I couldn't identify your symptom. Can you rephrase?";
  }

  // Campos para enriquecer a resposta
  const ingredients = (catalogItem.ingredients || []).join(", ");
  const benefits = (catalogItem.benefits || []).join(" ");
  const studies = (catalogItem.studies || []).join(" ");

  // Prompts por fase:
  let prompt = "";
  switch (phase) {
    case 1: // Awareness
      prompt = idioma === "pt"
        ? `Você é Dr. Owl, expert em saúde natural. Responda SOMENTE sobre a FASE 1 do funil (conscientização) referente ao sintoma: "${symptom}". Explique de forma científica, curta, empática e provocativa por que esse sintoma é preocupante. NÃO cite ingredientes, plantas, suplementos nem soluções. NÃO avance para outras fases. Seja humano, crie consciência, gere curiosidade. Não faça vendas.`
        : `You are Dr. Owl, a natural health expert. Reply ONLY for FUNNEL PHASE 1 (awareness) about the symptom: "${symptom}". Explain in a scientific, concise, empathetic, and provocative way why this symptom is a concern. Do NOT mention ingredients, plants, supplements, or solutions. Do NOT move to other phases. Be human, build awareness, spark curiosity. No selling.`;
      break;
    case 2: // Severity
      prompt = idioma === "pt"
        ? `Você é Dr. Owl. Responda SOMENTE sobre a FASE 2 do funil (gravidade) para o sintoma: "${symptom}". Descreva de forma científica e alarmante as consequências e riscos de ignorar este sintoma, use estatísticas moderadas se quiser, sem soluções, sem citar ingredientes, só sobre o perigo de ignorar. Não avance para outras fases, só aprofunde o medo e a urgência.`
        : `You are Dr. Owl. Reply ONLY for FUNNEL PHASE 2 (severity) for the symptom: "${symptom}". Describe scientifically and alarmingly the consequences and risks of ignoring this symptom, using moderate statistics if you wish. No solutions, no ingredients—just focus on the danger of ignoring the problem. Do NOT move to other phases, just deepen fear and urgency.`;
      break;
    case 3: // Proof
      prompt = idioma === "pt"
        ? `Você é Dr. Owl. Responda SOMENTE sobre a FASE 3 do funil (prova científica) para o sintoma: "${symptom}". Mostre evidências científicas, dados de estudos, estatísticas ou casos reais sobre a gravidade do sintoma ou sua ligação com problemas sérios. Cite artigos científicos se possível. NÃO cite suplementos ou soluções. Não avance para outras fases.`
        : `You are Dr. Owl. Reply ONLY for FUNNEL PHASE 3 (scientific proof) for the symptom: "${symptom}". Show scientific evidence, studies, statistics, or real cases about the severity of this symptom or its link to serious problems. Cite scientific articles if possible. Do NOT mention supplements or solutions. Do NOT move to other phases.`;
      break;
    case 4: // Nutrients / Natural Solution
      prompt = idioma === "pt"
        ? `Você é Dr. Owl. Responda SOMENTE sobre a FASE 4 do funil (nutrientes e solução natural) para o sintoma: "${symptom}". Explique porque apenas alimentação dificilmente resolve totalmente o sintoma, destaque a importância dos nutrientes/plantas/ativos naturais (exemplos: ${ingredients}), cite estudos e benefícios (${benefits}). NÃO cite marca nem nome do suplemento ainda. Prepare para a solução completa na próxima fase.`
        : `You are Dr. Owl. Reply ONLY for FUNNEL PHASE 4 (nutrients and natural solution) for the symptom: "${symptom}". Explain why diet alone rarely solves the symptom completely, highlight the importance of nutrients/plants/natural actives (examples: ${ingredients}), cite studies and benefits (${benefits}). Do NOT mention the supplement name or brand yet. Prepare for the complete solution in the next phase.`;
      break;
    case 5: // Supplement/CTA
      prompt = idioma === "pt"
        ? `Você é Dr. Owl. Responda SOMENTE sobre a FASE 5 do funil (oferta e call-to-action) para o sintoma: "${symptom}". Apresente de forma indireta e sugestiva um suplemento natural como solução completa (NUNCA diga o nome do produto, só descreva benefícios e diferenciais com base nos ativos: ${ingredients}, benefícios: ${benefits}). Indique que existe uma solução validada por estudos (${studies}) e dê a sugestão sutil para o usuário saber mais (ex: “Veja a avaliação detalhada ou vídeo explicativo”).`
        : `You are Dr. Owl. Reply ONLY for FUNNEL PHASE 5 (offer and CTA) for the symptom: "${symptom}". Present, in an indirect and suggestive way, a natural supplement as the complete solution (NEVER mention the product name, just describe benefits and unique points based on the actives: ${ingredients}, benefits: ${benefits}). State that there is a validated solution (${studies}) and subtly suggest the user see the review or video for more info.`;
      break;
    default: // fallback
      prompt = idioma === "pt"
        ? `Explique de forma empática, científica e curta sobre o sintoma: "${symptom}".`
        : `Explain empathetically, scientifically and concisely about the symptom: "${symptom}".`;
  }

  // Chamada para o GPT
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: GPT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.45,
      max_tokens: 300
    })
  });
  const data = await res.json();

  // Retorna resposta do GPT, se falhar retorna prompt usado
  return data.choices?.[0]?.message?.content?.trim() || prompt;
}

// === Handler principal ===
async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, selectedQuestion, sessionId } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Mensagem vazia ou inválida." });
  }

  if (!sessionMemory[sessionId]) sessionMemory[sessionId] = { phase: 1, symptom: null, count: 0, idioma: "en" };
  const session = sessionMemory[sessionId];

  if (!session.idioma) session.idioma = await detectLanguage(message);

  // Fuzzy matching sintoma, depois GPT se falhar
  if (!selectedQuestion) {
    let fuzzy = fuzzyFindSymptom(message);
    if (fuzzy) {
      session.symptom = fuzzy;
    } else {
      session.symptom = await findClosestSymptom(message, session.idioma);
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

  // Busca qual suplemento cobre o sintoma detectado
  const supplement = supplementsCatalog.find(s =>
    Array.isArray(s.symptoms) &&
    s.symptoms.some(sym => sym.toLowerCase() === session.symptom?.toLowerCase())
  );

  // Ajuste: envia sintoma como texto, não objeto, para a função
  const answer = await generateFunnelResponse(session.symptom, session.phase, session.idioma);
  const followupQuestions = await generateFollowUps(session.symptom, session.phase, session.idioma);

  logEvent("chat", {
    sessionId,
    phase: session.phase,
    supplement: supplement?.supplementName,
    symptom: session.symptom,
    idioma: session.idioma,
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
      count: session.count
    },
    legacyContent: answer + "\n\n" +
      (followupQuestions.length
        ? (session.idioma === "pt" ? "Vamos explorar mais:\nEscolha uma opção:\n" : "Let's explore further:\nChoose an option:\n") +
          followupQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")
        : "")
  });
}

export default handler;
