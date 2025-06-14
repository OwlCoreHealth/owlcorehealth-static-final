// ✅ chat.js COMPLETO com integração do formulário de subscrição de e-mail (sem NENHUMA remoção do seu código)

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
  usedQuestions: [],
  emailOffered: false
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

// Função para gerar as perguntas de follow-up com base no sintoma
async function generateFollowUpQuestions(context, idioma) {
  const usedQuestions = sessionMemory.usedQuestions || [];
  const symptom = context.sintoma || "symptom";
  const phase = context.funnelPhase || 1;

  const promptPT = `
Você é um assistente de saúde inteligente, focado no sintoma "${symptom}" e na fase do funil ${phase}.  
Gere exatamente 3 perguntas curtas, provocativas, impactantes e objetivas que façam o usuário querer clicar para saber mais.  
As perguntas devem ser relacionadas a dores, medos, soluções ou curiosidades diretamente ligadas ao sintoma.  
Não peça para o usuário escrever nada, nem para explicar algo.  
Evite perguntas filosóficas, genéricas ou que peçam mais detalhes.  
Não repita nenhuma pergunta já feita: ${usedQuestions.join("; ")}.  
Retorne apenas as 3 perguntas numeradas, sem texto adicional ou explicações.  
Se não conseguir gerar perguntas novas, use perguntas poderosas de fallback, mas ainda assim curtas e focadas.  
`;

const promptEN = `
You are a smart health assistant focused on the symptom "${symptom}" and funnel phase ${phase}.  
Generate exactly 3 short, provocative, impactful, and objective questions that make the user want to click to learn more.  
The questions should relate to pain, fear, solutions, or curiosities directly connected to the symptom.  
Do not ask the user to write anything or explain.  
Avoid philosophical, generic, or detail-asking questions.  
Do not repeat any previously asked questions: ${usedQuestions.join("; ")}.  
Return only the 3 numbered questions, with no extra text or explanations.  
If you can't generate new questions, use powerful fallback questions but keep them short and focused.  
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

    // Filtrar perguntas repetidas (exato match)
    questions = questions.filter(q => !usedQuestions.includes(q));

    // Atualiza as perguntas usadas na sessão
    sessionMemory.usedQuestions.push(...questions);

    // Se menos de 3 perguntas após filtro, adiciona fallback interno
    let fallback = [];
    if (sessionMemory.sintomaAtual === "gengivas inflamadas") {
      fallback = idioma === "pt" ? [
        "Você já visitou um dentista para tratar da inflamação nas gengivas?",
        "Está sentindo algum desconforto além do sangramento das gengivas?",
        "Sabia que a inflamação nas gengivas pode ser causada por uma higiene bucal inadequada?"
      ] : [
        "Have you visited a dentist to treat the gum inflammation?",
        "Are you feeling any discomfort besides the gum bleeding?",
        "Did you know that gum inflammation can be caused by poor oral hygiene?"
      ];
    } else if (sessionMemory.sintomaAtual === "acne") {
      fallback = idioma === "pt" ? [
        "Você já tentou algum tratamento para a acne?",
        "Você sabe quais alimentos podem estar ajudando a piorar a acne?",
        "Está lidando com acne principalmente em alguma área do rosto?"
      ] : [
        "Have you tried any treatments for acne?",
        "Do you know which foods might be contributing to your acne?",
        "Are you dealing with acne mainly in any specific area of your face?"
      ];
    } else {
      // Fallback genérico se o sintoma não for específico
      fallback = idioma === "pt" ? [
        "Você já procurou tratamento para o seu sintoma?",
        "Há algo específico que você gostaria de aprender sobre esse sintoma?",
        "Você tem tentado alguma solução por conta própria?"
      ] : [
        "Have you sought treatment for this symptom?",
        "Is there anything specific you'd like to learn about this symptom?",
        "Have you tried any solutions on your own?"
      ];
    }

    // Adiciona perguntas de fallback que ainda não foram usadas
    for (const fq of fallback) {
      if (questions.length >= 3) break;  // Limita a 3 perguntas
      if (!sessionMemory.usedQuestions.includes(fq)) {
        questions.push(fq);  // Adiciona a pergunta ao conjunto de perguntas
        sessionMemory.usedQuestions.push(fq);  // Marca como já usada
      }
    }

    return questions.slice(0, 3);

  } catch (err) {
    console.warn("❗️Erro ao gerar perguntas com GPT:", err);
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

Answer only with the symptom from the list that best matches or is most **similar** or **related** to the user's text. If no match, respond "unknown".
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

  const { message, selectedQuestion, idioma } = req.body;
  const userInput = selectedQuestion || message;
  const isFollowUp = Boolean(selectedQuestion);
  const intent = await classifyUserIntent(userInput, idioma || "en");
  // --- inserir aqui ---
// --- TRATAMENTO MELHORADO PARA RESPOSTAS VAGAS/BREVES ---
const vagueInputs = [
  "true", "ok", "sim", "não", "nao", "yes", "no", "maybe", "sure", "certainly", "of course", "",
  "next", "continue", "go", "seguir", "prosseguir", "avançar"
];
const cleanInput = userInput.trim().toLowerCase();

if (
  !isFollowUp &&
  (
    cleanInput.length < 3 ||
    vagueInputs.includes(cleanInput) ||
    cleanInput.match(/^\d+$/) // caso usuário só envie número (ex: escolha de opção)
  )
) {
  // Avança fase do funil e sempre entrega follow-up
  sessionMemory.funnelPhase = Math.min((sessionMemory.funnelPhase || 1) + 1, 6);

  // Escolhe perguntas provocativas de acordo com idioma
  const fallbackQuestions = idioma === "pt"
    ? [
        "Você sabia que pequenas mudanças podem transformar sua saúde?",
        "Quer descobrir o que está sabotando seu progresso?",
        "Já tentou um método natural para resolver isso?"
      ]
    : [
        "Did you know small changes can transform your health?",
        "Want to find out what's sabotaging your progress?",
        "Have you tried a natural method to fix this?"
      ];

  return res.status(200).json({
    choices: [{
      message: {
        content: (idioma === "pt"
          ? "Vamos explorar mais:\nEscolha uma das opções abaixo para continuarmos:\n\n"
          : "Let's explore further:\nChoose one of the options below to continue:\n\n"
        ) + fallbackQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n"),
        followupQuestions: fallbackQuestions
      }
    }]
  });
}

// --- fim do bloco ---

  let gptResponse;

  if (intent !== "sintoma") {
    gptResponse = await generateFreeTextWithGPT(
      idioma === "pt"
         ? `Você é o Dr. Owl, um assistente de saúde inteligente e focado em fornecer explicações científicas e objetivas. Um usuário fez uma pergunta fora do padrão de sintomas, que envolve curiosidade ou dúvida. Responda de forma clara, baseada em evidências científicas, sem humor ou metáforas. Pergunta do usuário: "${userInput}"`
        : `You are Dr. Owl, a health assistant focused on providing scientific and objective explanations. A user has asked a question outside the symptom context, involving curiosity or doubt. Respond clearly, based on scientific evidence, without humor or metaphors. User's message: "${userInput}"`
    );

   const followupQuestions = await generateFollowUpQuestions(
  { sintoma: sessionMemory.sintomaAtual, funnelPhase: sessionMemory.funnelPhase },
  idioma
);

    let content = formatHybridResponse({}, gptResponse, followupQuestions, idioma);

    if (!sessionMemory.emailOffered && sessionMemory.funnelPhase === 2) {
      sessionMemory.emailOffered = true;
    }

    sessionMemory.funnelPhase = Math.min((sessionMemory.funnelPhase || 1) + 1, 6);
    sessionMemory.genericEntry = true;
    sessionMemory.genericMessages = sessionMemory.genericMessages || [];
    sessionMemory.genericMessages.push(userInput);

    return res.status(200).json({
      choices: [{ message: { content, followupQuestions } }]
    });

  } else {
    // A PARTIR DAQUI: fluxo de tratamento do caso com sintoma
    const isPortuguese = /[\u00e3\u00f5\u00e7áéíóú]| você|dor|tenho|problema|saúde/i.test(userInput);
    const idiomaDetectado = isPortuguese ? "pt" : "en";
    sessionMemory.idioma = idiomaDetectado;
    const idioma = sessionMemory.idioma;

    const allSymptoms = Object.keys(fallbackTextsBySymptom);

    // Identifica o sintoma mais próximo do input usando GPT
    const identifiedSymptom = await identifySymptom(userInput, allSymptoms, idioma);

    sessionMemory.sintomaAtual = identifiedSymptom === "unknown" ? userInput.toLowerCase() : identifiedSymptom;
    sessionMemory.nome = "";
    sessionMemory.respostasUsuario.push(userInput);

    let context = await getSymptomContext(
      sessionMemory.sintomaAtual,
      sessionMemory.nome,
      null, // idade removida
      null, // peso removido
      sessionMemory.funnelPhase,
      sessionMemory.sintomaAtual,
      sessionMemory.usedQuestions
    );

    if (context.sintoma && !sessionMemory.sintomaAtual) sessionMemory.sintomaAtual = context.sintoma;
    if (context.categoria && !sessionMemory.categoriaAtual) sessionMemory.categoriaAtual = context.categoria;

    // Gerar a explicação completa do sintoma
    const answer = await generateAnswerForSymptom(sessionMemory.sintomaAtual, idioma);

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

    const gptResponse = baseText
      ? await rewriteWithGPT(baseText, sessionMemory.sintomaAtual, idioma, sessionMemory.funnelPhase, sessionMemory.categoriaAtual)
      : await rewriteWithGPT(
          `Explain clearly about the symptom ${sessionMemory.sintomaAtual} in phase ${sessionMemory.funnelPhase}, focusing on phase key ${funnelKey}`,
          sessionMemory.sintomaAtual,
          idioma,
          sessionMemory.funnelPhase,
          sessionMemory.categoriaAtual
        );

    const followupQuestions = await generateFollowUpQuestions(
      { sintoma: sessionMemory.sintomaAtual, funnelPhase: sessionMemory.funnelPhase },
      idioma
    );

    // Atualiza a fase do funil com segurança
    sessionMemory.funnelPhase = Math.min((context.funnelPhase || sessionMemory.funnelPhase || 1) + 1, 6);

    // Debug logs
    console.log("🧪 Sintoma detectado:", context.sintoma);
    console.log("🧪 Categoria atual:", sessionMemory.categoriaAtual);
    console.log("🧪 Fase atual:", sessionMemory.funnelPhase);
    console.log("🧪 Texto da fase:", funnelKey, funnelTexts);

    content = formatHybridResponse(context, gptResponse, followupQuestions, idioma);

    return res.status(200).json({
      choices: [{ message: { content, followupQuestions: followupQuestions || [] } }]
    });

  }
}
