import path from "path";
import fs from "fs";

// Garantir que a pasta logs exista
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
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

// === Similaridade avançada de sintomas com GPT ===
async function findClosestSymptom(userInput, idioma = "en") {
  const symptomNames = symptomsCatalog.map(s => s.symptom);
  const prompt = idioma === "pt"
    ? `A partir da lista: ${symptomNames.join(", ")}\nIdentifique qual sintoma é mais parecido com: "${userInput}". Só responda o nome exato ou "unknown".`
    : `From this list: ${symptomNames.join(", ")}\nIdentify which symptom most closely matches: "${userInput}". Reply with exact name or "unknown".`;

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
  const match = data.choices?.[0]?.message?.content.trim().toLowerCase() || "unknown";
  return symptomNames.find(s => s.toLowerCase() === match) || "unknown";
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

  // Avança fase ou inicia novo sintoma
  if (!selectedQuestion) {
    // Novo sintoma
    session.symptom = await findClosestSymptom(message, session.idioma);
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
