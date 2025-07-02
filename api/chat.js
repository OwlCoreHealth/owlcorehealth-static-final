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
    ? `Você é Dr. Owl, especialista em saúde natural. Fale SOMENTE da FASE 1 do funil (conscientização) para o sintoma: "${symptom}". 
Comece com uma pergunta provocativa ou frase de impacto curta, gerando empatia: “Você sente que faz tudo certo, mas o cansaço nunca passa?” 
Mostre que milhares de pessoas passam por isso sem saber o real motivo — que muitas tentam de tudo, mas o sintoma persiste.
Explique de forma simples, humana e científica por que esse sintoma é um alerta importante do corpo e não uma fraqueza. 
NÃO cite ingredientes, soluções, suplementos ou marcas. 
Finalize com um gancho provocando curiosidade (“Você sabia que ignorar esses sinais pode ser mais perigoso do que parece?”). 
Não avance para outras fases. Seja persuasivo, humano e incentive o leitor a refletir.`
    : `You are Dr. Owl, a natural health expert. ONLY discuss FUNNEL PHASE 1 (awareness) for the symptom: "${symptom}". 
Start with a provocative question or impactful statement to create empathy: “Have you ever felt like you’re doing everything right, but nothing changes?” 
Mention that thousands of people struggle with this without knowing the real cause—even after trying everything, the symptom remains.
Explain simply, empathetically, and scientifically why this symptom is an important signal from the body—not a weakness.
DO NOT mention ingredients, solutions, supplements, or brands. 
End with a hook to spark curiosity (“Did you know ignoring these signals could be more dangerous than it seems?”). 
Do not move to the next phase. Be persuasive, human, and encourage reflection.`;
  break;
  case 2: // Severity
    prompt = idioma === "pt"
      ? `Você é Dr. Owl. Responda SOMENTE sobre a FASE 2 do funil (gravidade) para o sintoma: "${symptom}". Mostre de forma curta e científica os riscos de ignorar esse sintoma, usando estatísticas moderadas e exemplos (“ignorar já causou problemas a milhares de pessoas”). Não cite soluções, nem ingredientes. Termine com gancho (“A ciência já provou o impacto desses sintomas. Quer ver os dados?”). Não avance de fase.`
      : `You are Dr. Owl. ONLY address FUNNEL PHASE 2 (severity) for the symptom: "${symptom}". Briefly and scientifically, describe the risks of ignoring this symptom, using moderate statistics and universal examples (“ignoring this has affected thousands”). Do not mention solutions or ingredients. End with a hook (“Science has already proven the impact. Want to see the data?”). Do not move forward.`;
    break;
  case 3: // Proof
    prompt = idioma === "pt"
      ? `Você é Dr. Owl. Fale SOMENTE da FASE 3 do funil (prova científica) para o sintoma: "${symptom}". Dê dados reais, resultados de estudos ou estatísticas (“estudos com milhares mostram que…”). NÃO cite suplemento ou solução, só prova. Termine com um gancho (“O que a ciência recomenda para reverter isso?”). Não avance de fase.`
      : `You are Dr. Owl. ONLY talk about FUNNEL PHASE 3 (scientific proof) for the symptom: "${symptom}". Provide real data, study results, or statistics (“studies with thousands have shown…”). DO NOT mention supplements or solutions, only proof. End with a hook (“What does science recommend to reverse this?”). Do not move forward.`;
    break;
  case 4: // Nutrients / Natural Solution
  prompt = idioma === "pt"
    ? `Você é Dr. Owl. Fale SOMENTE da FASE 4 do funil (nutrientes/solução natural) para o sintoma: "${symptom}".
Mostre por que só mudar a alimentação não basta para resolver esse sintoma. Valorize ao máximo cada planta, ativo ou bactéria citada (${ingredients}):
- Explique como esses ingredientes são usados há séculos por civilizações, sendo um “segredo milenar” da saúde natural.
- Conte benefícios únicos para saúde (ex: gengiva, dentes, sensibilidade), usando linguagem acessível e empolgante.
- Traga curiosidades ou mini-histórias: “Muitos povos já usavam essas substâncias para manter a saúde mesmo sem tecnologia moderna.”
- Cite descobertas e estudos científicos de modo simples e com resultados práticos (“estudos mostram que esses ativos naturais podem reduzir o sintoma em até X%”).
- Mostre por que só a alimentação dificilmente atinge esse efeito — é a união de ativos naturais + ciência que faz a diferença.
Finalize com um gancho: “Milhares já viram resultado com essa abordagem. Quer saber como funciona?”
NÃO cite marca nem nome de suplemento ainda. Seja persuasivo, fascinante e desperte desejo de saber mais. NÃO avance para outra fase.`
    : `You are Dr. Owl. ONLY answer for FUNNEL PHASE 4 (nutrients/natural solution) for the symptom: "${symptom}".
Show why diet alone rarely solves this symptom. Fully highlight each plant, active or beneficial bacteria (${ingredients}):
- Tell how they’ve been used for centuries by civilizations, as an “ancestral secret” for health.
- Explain their unique benefits for health (e.g., gums, teeth, sensitivity), in an engaging and accessible way.
- Bring fun facts or universal stories: “Many ancient peoples used these substances to maintain health even without modern technology.”
- Cite scientific discoveries and studies simply, showing practical results (“studies show these natural actives can reduce the symptom by up to X%”).
- Explain why diet alone rarely achieves this — it’s the synergy of natural actives + science that makes the difference.
End with a hook: “Thousands have already seen results with this natural approach. Want to know how it works?”
DO NOT mention brand or supplement name yet. Be persuasive, fascinating, and spark curiosity. DO NOT move to another phase.`;
  break;
  case 5: // Supplement/CTA
    prompt = idioma === "pt"
      ? `Você é Dr. Owl. Responda SOMENTE sobre a FASE 5 do funil (oferta/call-to-action) para o sintoma: "${symptom}". Apresente de forma indireta e sugestiva um suplemento natural como solução completa (NUNCA cite o nome do produto, apenas descreva diferenciais, benefícios e ativos: ${ingredients}, benefícios: ${benefits}). Diga que existem estudos válidos (${studies}) e convide o usuário para ver a avaliação ou vídeo (“Veja a avaliação completa — você vai se surpreender!”). Seja objetivo, não exagere.`
      : `You are Dr. Owl. ONLY talk about FUNNEL PHASE 5 (offer/call-to-action) for the symptom: "${symptom}". Present, indirectly and persuasively, a natural supplement as the complete solution (NEVER mention the product name, just describe benefits and actives: ${ingredients}, benefits: ${benefits}). Say that there are validated studies (${studies}) and invite the user to see the review or video (“See the full review — you’ll be surprised!”). Be direct, do not exaggerate.`;
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
  
  if (!session.userName && !session.anonymous) {
  return res.status(200).json({
    reply: `Aqui no consultório do Dr. Owl, cada história é especial.
Me conta: como você gostaria de ser chamado(a) por mim?
Pode ser seu nome, apelido, até um codinome — prometo guardar com carinho esse segredo!
Se não quiser contar, sem problemas: sigo te acompanhando da melhor forma possível.`,
    followupQuestions: []
  });
}

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
