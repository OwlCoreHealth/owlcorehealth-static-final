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

async function rewriteWithGPT(baseText, sintoma, idioma, funnelPhase, categoria) {
  const prompt = idioma === "pt"
    ? `Use o seguinte texto como base, mantendo o conteúdo e estrutura, mas reescrevendo com 30% de liberdade criativa, usando linguagem mais fluida, provocadora e humana. Mantenha o foco exclusivamente no sintoma: ${sintoma} e na categoria: ${categoria}. Não aborde outros temas. Não mude o tema e mantenha o foco em: ${sintoma}\n\nTexto-base:\n${baseText}`
    : `Use the following text as a base. Keep the core message and structure, but rewrite with 30% creative freedom in a more natural, engaging, and human tone. Keep the focus exclusively on the symptom: ${sintoma} and category: ${categoria}. Do not address other topics. Do not change the topic and keep the focus on: ${sintoma}\n\nBase text:\n${baseText}`;

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
  const usedQuestions = sessionMemory.usedQuestions || [];
  const symptom = context.sintoma || "symptom";
  const phase = context.funnelPhase || 1;

  const promptPT = `
Você é um assistente de saúde inteligente e provocador. Com base no sintoma "${symptom}" e na fase do funil ${phase}, gere 3 perguntas curtas, provocativas e instigantes que levem o usuário para a próxima etapa. 
Evite repetir estas perguntas já feitas: ${usedQuestions.join("; ")}.
As perguntas devem ser distintas, relacionadas ao sintoma e fase, e ter gancho forte de curiosidade, dor, emergência ou solução.

Retorne apenas as 3 perguntas numeradas.
`;

  const promptEN = `
You are a smart and provocative health assistant. Based on the symptom "${symptom}" and funnel phase ${phase}, generate 3 short, provocative, and engaging questions to guide the user to the next step.
Avoid repeating these previously asked questions: ${usedQuestions.join("; ")}.
Questions must be distinct, related to the symptom and phase, with strong hooks around curiosity, pain, urgency or solution.

Return only the 3 numbered questions.
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
    const fallbackPT = [
      "Você já tentou mudar sua alimentação ou rotina?",
      "Como você acha que isso está afetando seu dia a dia?",
      "Está disposto(a) a descobrir uma solução mais eficaz agora?"
    ];
    const fallbackEN = [
      "Have you tried adjusting your diet or lifestyle?",
      "How do you think this is affecting your daily life?",
      "Are you ready to explore a better solution now?"
    ];

    if (questions.length < 3) {
      const fallback = idioma === "pt" ? fallbackPT : fallbackEN;
      // Adiciona perguntas de fallback que ainda não foram usadas
      for (const fq of fallback) {
        if (questions.length >= 3) break;
        if (!sessionMemory.usedQuestions.includes(fq)) {
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
// ... início do arquivo permanece igual

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  const { message, name, age, sex, weight, selectedQuestion } = req.body;
  const userInput = selectedQuestion || message;

  // 🆕 BLOCO NOVO — respostas genéricas com GPT e registro no sessionMemory
  const genericPrompts = [
    "olá", "oi", "quem é você", "quem és tu", "quem é tu", "como estás", "como vai",
    "o que você faz", "o que fazes", "em que podes ajudar", "qual é a tua função",
    "hi", "hello", "who are you", "what can you do", "how do you work", "how are you"
  ];

  const isGenericMessage = genericPrompts.some(p =>
    userInput.toLowerCase().includes(p.toLowerCase())
  );

  if (isGenericMessage) {
    const idioma = sessionMemory.idioma || "pt";

    const introPrompt = idioma === "pt"
      ? `Você é o Dr. Owl, um assistente de saúde provocador e inteligente. Um usuário te fez uma pergunta que não contém sintomas, mas expressa curiosidade sobre você ou sobre como funciona o atendimento.

Responda com carisma, sarcasmo leve e empatia, explicando como você ajuda pessoas a entenderem melhor seus sintomas e decisões de saúde. Ao final, convide o usuário a contar se está sentindo algo específico ou se quer analisar um sinal do corpo que tem incomodado.

Pergunta do usuário: "${userInput}"`
      : `You are Dr. Owl, a clever and slightly sarcastic health assistant. A user asked you a question that doesn’t contain symptoms but shows curiosity about you or how you help.

Reply with charm, light sarcasm, and empathy. Briefly explain how you help people understand their symptoms and health decisions. End with a smart invitation for the user to share any specific symptom or body signal that’s been bothering them.

User’s message: "${userInput}"`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: GPT_MODEL,
          messages: [{ role: "system", content: introPrompt }],
          temperature: 0.75,
          max_tokens: 600
        })
      });

      const data = await response.json();
      const gptReply = data.choices?.[0]?.message?.content?.trim() || "Posso te ajudar com saúde, sintomas e estratégias naturais. Qual o sinal que teu corpo anda te mandando?";

      // REGISTRA no sessionMemory
      sessionMemory.genericEntry = true;
      sessionMemory.genericMessages = sessionMemory.genericMessages || [];
      sessionMemory.genericMessages.push(userInput);

      return res.status(200).json({
        choices: [{ message: { content: gptReply, followupQuestions: [] } }]
      });
    } catch (e) {
      console.error("Erro ao gerar resposta livre inicial:", e);

      sessionMemory.genericEntry = true;
      sessionMemory.genericMessages = sessionMemory.genericMessages || [];
      sessionMemory.genericMessages.push(userInput);

      return res.status(200).json({
        choices: [{ message: { content: idioma === "pt"
          ? "Sou o Dr. Owl. Posso te ajudar a entender melhor os sinais do teu corpo. Qual sintoma ou desconforto queres explorar hoje?"
          : "I’m Dr. Owl. I help people understand what their body is trying to say. Is there a symptom or issue you'd like to explore today?", followupQuestions: [] } }]
      });
    }
  }

  // ... resto do código continua exatamente como está
}
