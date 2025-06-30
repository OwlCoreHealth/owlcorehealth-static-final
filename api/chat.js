import path from "path";
import fs from "fs";
import cosineSimilarity from "cosine-similarity";

// Função para transformar texto em vetor de frequência simples
function textToVector(text) {
  const words = text.toLowerCase().split(/\s+/);
  const freq = {};
  words.forEach(w => freq[w] = (freq[w] || 0) + 1);
  return freq;
}

// Função para criar um vetor padronizado com todas as palavras
function makeVector(obj, keys) {
  return keys.map(k => obj[k] || 0);
}

// Função para encontrar o sintoma mais próximo usando cosine similarity
function bestCosineMatch(userInput, symptomsCatalog) {
  const symptoms = symptomsCatalog.map(s => s.symptom);
  const userFreq = textToVector(userInput);
  let bestScore = -1;
  let bestSymptom = null;

  for (const symptom of symptoms) {
    const symFreq = textToVector(symptom);
    const allWords = Array.from(new Set([...Object.keys(userFreq), ...Object.keys(symFreq)]));
    const userVec = makeVector(userFreq, allWords);
    const symVec = makeVector(symFreq, allWords);
    const score = cosineSimilarity(userVec, symVec);
    if (score > bestScore) {
      bestScore = score;
      bestSymptom = symptom;
    }
  }
  return bestScore > 0.5 ? bestSymptom : null; // Ajuste o limiar se necessário
}

// Sempre use /tmp/logs em serverless!
const logsDir = "/tmp/logs";
if (!fs.existsSync(logsDir)) {
  try { fs.mkdirSync(logsDir, { recursive: true }); } catch (e) { /* ignora erro */ }
}

const catalogPath = path.join(process.cwd(), "api", "data", "symptoms_catalog.json");
const symptomsCatalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GPT_MODEL = "gpt-4o-mini";

// Memória de sessão (pode integrar com Redis ou JWT se precisar)
let sessionMemory = {};

// Limite de perguntas por sessão (altere se quiser)
const QUESTION_LIMIT = 8;


function logEvent(event, data) {
  const logPath = logsDir + "/chat.log";
  const log = `[${new Date().toISOString()}] [${event}] ${JSON.stringify(data)}\n`;
  try { fs.appendFileSync(logPath, log); } catch (e) { /* ignora erro */ }
}

async function findClosestSymptom(userInput, idioma = "en") {
  const symptomNames = symptomsCatalog.map(s => s.symptom);

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
  // DEBUG: veja o que o GPT respondeu
  console.log({ symptomNames, match });
  return symptomNames.find(s => s.toLowerCase() === match?.toLowerCase()) || "unknown";
}

// === Detecção automática de idioma ===
async function detectLanguage(text) {
  // Simples: retorna 'pt' se maioria dos chars são PT/BR, senão 'en'
  return /[áéíóúãõç]/i.test(text) ? "pt" : "en";
}

// === Geração de perguntas follow-up ===
async function generateFollowUps(symptom, phase, idioma = "en") {
  const prompt = idioma === "pt"
    ? `Gere 3 perguntas provocativas para avançar o funil sobre o sintoma "${symptom}", fase ${phase}.\n1. Dor/risco, 2. Curiosidade, 3. Solução natural.`
    : `Generate 3 provocative follow-up questions for funnel phase ${phase}, about "${symptom}". 1. Pain/risk, 2. Curiosity, 3. Natural solution.`;
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
      max_tokens: 150
    })
  });
  const data = await res.json();
  const questions = data.choices?.[0]?.message?.content?.split(/\d+\.\s+/).filter(Boolean).slice(0, 3) || [];
  return questions;
}

// === Resposta principal do funil ===
async function generateFunnelResponse(symptom, phase, idioma = "en") {
  const catalogItem = symptomsCatalog.find(s => s.symptom.toLowerCase() === symptom.toLowerCase());
  if (!catalogItem) return idioma === "pt"
    ? "Desculpe, não consegui identificar seu sintoma. Pode reformular?"
    : "Sorry, I couldn't identify your symptom. Can you rephrase?";

  const baseText = catalogItem.phases[String(phase)] || catalogItem.phases["1"];
  // Prompt controlando "vazamento" de fases!
  const phaseLabel = ["awareness", "severity", "proof", "nutrients", "advanced"][phase - 1];
  const prompt = idioma === "pt"
    ? `Reescreva o texto abaixo de forma provocativa, científica e curta, focando apenas na fase: ${phaseLabel}.\nNão avance para outras fases.\nTexto:\n${baseText}`
    : `Rewrite the following text in a scientific, urgent, and provocative tone, focusing ONLY on phase: ${phaseLabel}.\nDo NOT advance to other phases.\nText:\n${baseText}`;
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
  return data.choices?.[0]?.message?.content.trim() || baseText;
}

// === Handler principal ===
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, selectedQuestion, sessionId } = req.body;
  // Identificação de sessão simples
  if (!sessionMemory[sessionId]) sessionMemory[sessionId] = { phase: 1, symptom: null, count: 0, idioma: "en" };
  const session = sessionMemory[sessionId];

  // Detecta idioma na primeira mensagem
  if (!session.idioma) session.idioma = await detectLanguage(message);

 if (!selectedQuestion) {
  // Novo sintoma: tenta fuzzy matching antes do GPT!
  let fuzzy = fuzzyFindSymptom(message);
  if (fuzzy) {
    session.symptom = fuzzy;
  } else {
    session.symptom = await findClosestSymptom(message, session.idioma);
  }
  session.phase = 1;
  session.count = 1;
} else {
  // Avança no funil
  session.phase = Math.min(session.phase + 1, 5);
  session.count++;
}

  // Limite de perguntas
  if (session.count > QUESTION_LIMIT) {
    return res.status(200).json({
      content: session.idioma === "pt"
        ? "Você atingiu o limite de perguntas nesta sessão. Deseja continuar por e-mail?"
        : "You have reached the question limit for this session. Want to continue by email?",
      followupQuestions: []
    });
  }

  // Resposta do funil + follow-ups
  const answer = await generateFunnelResponse(session.symptom, session.phase, session.idioma);
  const followupQuestions = await generateFollowUps(session.symptom, session.phase, session.idioma);

  // Logs
  logEvent("chat", { sessionId, phase: session.phase, symptom: session.symptom, idioma: session.idioma, message, answer, followupQuestions });

  return res.status(200).json({
    content: answer + "\n\n" +
      (followupQuestions.length
        ? (session.idioma === "pt" ? "Vamos explorar mais:\nEscolha uma opção:\n" : "Let's explore further:\nChoose an option:\n") +
          followupQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")
        : ""),
    followupQuestions
  });
}
