// ✅ chat.js COMPLETO com integração do formulário de subscrição de e-mail (sem NENHUMA remoção do seu código)

import { getSymptomContext } from "./notion.mjs";
import { fallbackTextsBySymptom } from "./fallbackTextsBySymptom.js";
import { findNearestSymptom } from "../findNearestSymptom.js"; // ajuste o caminho se necessário

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
  usedQuestions: [],
  emailOffered: false
};

function getFunnelKey(phase) {
  switch (phase) {
    case 1: return "Funnel Awareness";
    case 2: return "Funnel Severity";
    case 3: return "Funnel Proof";
    case 4: return "Funnel Solution";
    case 5: return "Funnel Advanced";
    default: return "Funnel Awareness";
  }
}

// Função que gera resposta completa para o sintoma
const generateAnswerForSymptom = async (symptom, idioma) => {
  const prompt = idioma === "pt" ? promptPT : promptEN;
  
  // Chamar a API do GPT para gerar a resposta completa
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${OPENAI_API_KEY}`
  },
  body: JSON.stringify({
    model: GPT_MODEL,
    messages: [
      { role: "system", content: "Você é um assistente de saúde fornecendo explicações científicas e práticas sobre sintomas." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 500 // Aumente o número de tokens aqui
  })
});

  const data = await response.json();
console.log("Resposta do servidor:", data); // Adicione este log para inspecionar a resposta completa

  
  // Retorna o conteúdo gerado pela API
  return data.choices?.[0]?.message?.content || "Desculpe, não consegui gerar uma resposta no momento.";
};

function getBotIconHTML() {
  return `<img src="owl-icon.png" alt="Owl Icon" class="bot-icon" style="width: 28px; margin-right: 12px;" />`;
}

// ✅ ALTERAÇÃO NO formatHybridResponse para adicionar e-mail após 1ª resposta com perguntas
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

    // ✅ Mostra o formulário de e-mail na primeira vez que houver follow-ups
    if (!sessionMemory.emailOffered && sessionMemory.funnelPhase === 2) {
      sessionMemory.emailOffered = true;
     // response += renderEmailPrompt(idioma);
    }
  }

  return response;
}

async function classifyUserIntent(userInput, idioma) {
  const prompt = idioma === "pt"
    ? `Você é um classificador de intenção. Receberá mensagens de usuários e deve responder com uma das seguintes intenções:

- sintoma
- saudação
- curiosidade
- pergunta funcional
- dúvida vaga
- outro

Mensagem do usuário: "${userInput}"
Resposta (apenas a intenção):`
    : `You are an intent classifier. You’ll receive a user message and must reply with one of the following labels:

- symptom
- greeting
- curiosity
- functional_question
- vague_doubt
- other

User message: "${userInput}"
Answer (intent only):`;

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
      { role: "system", content: "Você é um assistente de saúde fornecendo explicações científicas e práticas sobre sintomas." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 300
  })
});

    const data = await response.json();
    const intent = data.choices?.[0]?.message?.content?.trim().toLowerCase() || "outro";
    return intent;
  } catch (e) {
    console.error("Erro ao classificar intenção:", e);
    return "outro";
  }
}

async function rewriteWithGPT(baseText, sintoma, idioma, funnelPhase, categoria) {
  const prompt = idioma === "pt"
    ? `
Use o seguinte texto como base, mantendo a mensagem central, mas reescrevendo com 30% de liberdade criativa para um tom urgente, científico, provocativo e focado no sintoma: ${sintoma}, e na categoria: ${categoria}.  
O texto deve refletir a fase ${funnelPhase} do funil, apresentando:  
- Na fase 1, explicação clara e científica do sintoma;  
- Na fase 2, alertas urgentes sobre riscos do sintoma;  
- Na fase 3, estatísticas reais que reforcem a gravidade;  
- Na fase 4, nutrientes e plantas naturais que ajudam;  
- Na fase 5, sugestões indiretas de soluções avançadas (sem citar nomes diretamente).  
Não mude o tema ou aborde assuntos fora do contexto.  
Mantenha a linguagem simples, direta e com senso de urgência.  
Texto-base:  
${baseText}
`
    : `
Use the following text as a base, keeping the core message, but rewriting it with 30% creative freedom in an urgent, scientific, provocative tone focused on the symptom: ${sintoma} and category: ${categoria}.  
The text should reflect funnel phase ${funnelPhase}, presenting:  
- Phase 1: clear scientific explanation of the symptom;  
- Phase 2: urgent alerts about risks;  
- Phase 3: real statistics reinforcing severity;  
- Phase 4: nutrients and natural plants that help;  
- Phase 5: indirect suggestions of advanced solutions (without naming products).  
Do not change the topic or include unrelated content.  
Keep language simple, direct, and urgent.  
Base text:  
${baseText}
`;

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

async function generateFreeTextWithGPT(prompt) {
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
    return data.choices?.[0]?.message?.content?.trim() || "";
  } catch (e) {
    console.error("Erro ao gerar texto livre com GPT:", e);
    return "";
  }
}

async function generateFollowUpQuestions(context, idioma) {
  const symptom = context.sintoma || "symptom";
  const phase = context.funnelPhase || 1;

 
const promptEN = `
Generate 3 follow-up questions for a sales funnel, focused on the symptom: "${mainSymptom}". ...
1. PAIN question: highlight a possible negative consequence or worsening of the symptom, with a provocative and alert tone.
2. CURIOSITY question: bring a surprising fact, myth or little-known connection about the symptom, making the user want to know more.
3. SOLUTION question: provoke the user about a natural, innovative or little-known solution for the symptom.
The questions must:
- Be short, direct and provocative
- Never generic (always mention the symptom)
- Focus on advancing the funnel (e.g., "Want to know how to avoid this?", "Would you be surprised by the solution?", etc)
Format example:
1. Did you know ignoring ${symptom} can lead to serious health issues?
2. Have you ever heard about a study linking ${symptom} to unexpected causes?
3. Have you ever thought about treating ${symptom} naturally and quickly?
Instead of writing [symptom], ALWAYS insert the exact text "${symptom}".
Always generate the questions in American English (US English). Do not explain, do not repeat, just return the three numbered questions.
`;

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
          { role: "system", content: "You are a health copywriter assistant." },
          { role: "user", content: promptEN }
        ],
        temperature: 0.8,
        max_tokens: 250
      })
    });

    const data = await response.json();
    let questionsRaw = data.choices?.[0]?.message?.content || "";
    // Divide as perguntas, ignora vazias, pega as 3 primeiras
    let questions = questionsRaw.split(/\d+\.\s+/).filter(Boolean).slice(0, 3);

    // Substitui qualquer '[symptom]' pelo sintoma real (caso o GPT não siga a instrução)
    questions = questions.map(q =>
  q.replace(/\[symptom\]/gi, symptom)
   .replace(/your symptom/gi, `your ${symptom}`)
   .replace(/the symptom/gi, symptom)
   .replace(/\bsymptom\b/gi, symptom) // <- linha adicionada
   .replace(/\byour symptom\b/gi, `your ${symptom}`) // redundante, mas cobre variações
);

    return questions;
  } catch (err) {
    // fallback em inglês (sempre usa o sintoma!)
    return [
      `Did you know ignoring ${symptom} can lead to chronic health problems?`,
      `Ever wondered what most people get wrong about ${symptom}?`,
      `Ready to discover a breakthrough solution for ${symptom}?`
    ];
  }
}

async function identifySymptom(userInput, symptomsList, idioma) {
  const promptPT = `
Você é um assistente que identifica o sintoma mais próximo de uma lista dada, a partir do texto do usuário. 
A lista de sintomas é:
${symptomsList.join(", ")}

Dado o texto do usuário:
"${userInput}"

Responda apenas com o sintoma da lista que melhor corresponde ao texto do usuário ou com o sintoma mais **semelhante** ou **relacionado**. Se não reconhecer, responda "unknown".
  `;

 const promptEN = `
You are an assistant that identifies the closest symptom from a given list, based on the user's text.
The list of symptoms is:
${symptomsList.join(", ")}

Given the user's input:
"${userInput}"

Answer only with the symptom from the list that best matches or is most similar or related to the user's text. If no match, respond "unknown".
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

console.log("Entrou na rota /api/chat!");
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { message, selectedQuestion } = req.body;
  const userInput = selectedQuestion || message;
  const isFollowUp = Boolean(selectedQuestion);
  const idioma = "en"; // Sempre usa inglês (US English) como base

  // Inputs muito vagos (não tratamos se for follow-up!)
  const vagueInputs = ["true", "ok", "sim", "não", "nao", ""];
  if (!isFollowUp && vagueInputs.includes((userInput || "").toString().trim().toLowerCase())) {
    // Perguntas fixas para evitar "buraco"
    const fallbackQuestions = [
      "Did you know small changes can transform your health?",
      "Want to find out what's sabotaging your progress?",
      "Have you tried a natural method to fix this?"
    ];
    return res.status(200).json({
      choices: [{
        message: {
          content: "Let's explore further:\nChoose one of the options below to continue:\n\n" +
            fallbackQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n"),
          followupQuestions: fallbackQuestions
        }
      }]
    });
  }

  // Avança a fase do funil ao clicar no follow-up
  if (isFollowUp) {
  sessionMemory.funnelPhase = Math.min((sessionMemory.funnelPhase || 1) + 1, 6);
  // NÃO MUDA o sintomaAtual aqui!
} else {
  sessionMemory.funnelPhase = 1;
  sessionMemory.usedQuestions = [];
  // Salva novo sintoma
  // Mapeamento manual só para testar
const sintomaMapeado = (() => {
  if (userInput.toLowerCase().includes("acne")) return "acne";
  if (userInput.toLowerCase().includes("dry skin")) return "dry skin";
  if (userInput.toLowerCase().includes("rosacea")) return "rosacea";
  // ...adicione mais conforme seus sintomas do Notion!
  return userInput.toLowerCase(); // fallback
})();

sessionMemory.sintomaAtual = sintomaMapeado;
console.log("Sintoma mapeado para busca:", sessionMemory.sintomaAtual);

  console.log("Sintoma identificado:", sessionMemory.sintomaAtual);
}

  const SIMILARITY_THRESHOLD = 0.3; // valor recomendado para clusters sintomáticos

if (!isFollowUp) {
  try {
    const nearest = await findNearestSymptom(userInput);
    sessionMemory.sintomaAtual = nearest.bestSymptom;

    sessionMemory.similarityScore = nearest.bestScore;
    console.log("Sintoma identificado (semântico):", sessionMemory.sintomaAtual, "Score:", sessionMemory.similarityScore);

    // NÃO aborta fluxo — apenas registra confiança baixa, para customizar copy se quiser
    sessionMemory.lowConfidence = nearest.bestScore < SIMILARITY_THRESHOLD;
  } catch (err) {
    console.error("Erro no matching semântico:", err);
    sessionMemory.sintomaAtual = userInput.toLowerCase();
    sessionMemory.similarityScore = null;
    sessionMemory.lowConfidence = true;
  }
}

  // 1. Defina mainSymptom aqui:
const mainSymptom = sessionMemory.sintomaAtual
  ? sessionMemory.sintomaAtual.split(",")[0].trim()
  : sessionMemory.sintomaAtual;

let context = await getSymptomContext(
  mainSymptom,
  sessionMemory.funnelPhase,
  mainSymptom,
  sessionMemory.usedQuestions
);
  
if (!funnelTexts.length) {
  // Fallback ou GPT só aqui
}

 const funnelKey = getFunnelKey(sessionMemory.funnelPhase);

// 2. Busca as 3 variantes da fase
let funnelTexts = [
  context.funnelTexts?.[`${funnelKey} 1`] || "",
  context.funnelTexts?.[`${funnelKey} 2`] || "",
  context.funnelTexts?.[`${funnelKey} 3`] || ""
].filter(Boolean);

// 3. Remove textos já usados nesta sessão (sessionMemory.usedTexts)
if (!sessionMemory.usedTexts) sessionMemory.usedTexts = [];
funnelTexts = funnelTexts.filter(text => !sessionMemory.usedTexts.includes(text));

// 4. Se esgotou todas as variações, permite repetir só depois de todas usadas
if (funnelTexts.length === 0 && context.funnelTexts) {
  sessionMemory.usedTexts = []; // reseta o histórico para aquele funnelKey
  funnelTexts = [
    context.funnelTexts?.[`${funnelKey} 1`] || "",
    context.funnelTexts?.[`${funnelKey} 2`] || "",
    context.funnelTexts?.[`${funnelKey} 3`] || ""
  ].filter(Boolean);
}

  console.log("Fase atual:", sessionMemory.funnelPhase);
console.log("funnelKey:", funnelKey);
console.log("funnelTexts:", funnelTexts);

if (!funnelTexts.length) {
  // Fallback do arquivo fallbackTextsBySymptom.js
  const fallbackGroup = fallbackTextsBySymptom[mainSymptom];
  if (fallbackGroup && fallbackGroup[funnelKey] && fallbackGroup[funnelKey].length > 0) {
    funnelTexts = fallbackGroup[funnelKey];
    console.log("Usando fallback do arquivo fallbackTextsBySymptom para:", sessionMemory.sintomaAtual, funnelKey);
  } else {
    funnelTexts = [
      sessionMemory.lowConfidence
        ? (idioma === "pt"
            ? `Não consegui identificar seu sintoma de forma precisa, mas aqui está uma explicação baseada em sintomas parecidos ou no cluster mais próximo.`
            : `I couldn't precisely identify your symptom, but here's an explanation based on similar symptoms or the closest cluster.`)
        : (idioma === "pt"
            ? `Desculpe, não temos conteúdo para "${sessionMemory.sintomaAtual}" nesta fase.`
            : `Sorry, we don’t have content for "${sessionMemory.sintomaAtual}" in this phase.`)
    ];
    console.log("No Notion or fallbackTextsBySymptom data for:", sessionMemory.sintomaAtual, funnelKey);
  }
}

console.log("FASE ATUAL DO FUNIL:", sessionMemory.funnelPhase, "funnelKey:", funnelKey);
console.log("Textos disponíveis nesta fase:", funnelTexts);

const baseText = funnelTexts[Math.floor(Math.random() * funnelTexts.length)];
  // Marca o texto como já usado para a próxima etapa não repetir
sessionMemory.usedTexts.push(baseText);

console.log("Texto base selecionado:", baseText);
console.log("===> Fase do funil:", sessionMemory.funnelPhase);
console.log("===> funnelKey:", funnelKey);
console.log("===> baseText selecionado:", baseText);

const gptResponse = await rewriteWithGPT(
  baseText,
  mainSymptom, // << agora usa o sintoma curto!
  idioma,
  sessionMemory.funnelPhase,
  sessionMemory.categoriaAtual
);

console.log("===> gptResponse retornado:", gptResponse);

// Gera perguntas provocativas para o sintoma atual e fase
let followupQuestions = await generateFollowUpQuestions(
  { sintoma: mainSymptom, funnelPhase: sessionMemory.funnelPhase },
  idioma
);

console.log("Perguntas brutas antes de substituir:", followupQuestions);
console.log("Sintoma usado para substituir:", sessionMemory.sintomaAtual);

followupQuestions = followupQuestions.map(q =>
  q.replace(/\[symptom\]/gi, mainSymptom)
   .replace(/your symptom/gi, `your ${mainSymptom}`)
   .replace(/the symptom/gi, mainSymptom)
   .replace(/\bsymptom\b/gi, mainSymptom)
   .replace(/\byour symptom\b/gi, `your ${mainSymptom}`)
);

// Monta a resposta do bot
let content = gptResponse + `\n\nLet's explore further: Choose one of the options below to continue:\n\n`;
followupQuestions.forEach((q, i) => {
  content += `<div class="clickable-question" data-question="${encodeURIComponent(q)}">${i + 1}. ${q}</div>\n`;
});

return res.status(200).json({
  choices: [{
    message: {
      content,
      followupQuestions
    }
  }]
});
} // <-- ESTA fecha a função handler (só uma chave no fim!)
