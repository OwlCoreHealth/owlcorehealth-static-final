import { getSymptomContext } from "./notion.js";

let sessionMemory = {
  sintomasDetectados: [],
  respostasUsuario: [],
  nome: "",
  idioma: "pt"
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed. Use POST." });
    }

    const { message, name, age, sex, weight } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "No message provided." });
    }

    const isPortuguese = /[ãõçáéíóú]| você|dor|tenho|problema|saúde/i.test(message);
    const userName = name?.trim() || "";
    const userAge = parseInt(age);
    const userSex = (sex || "").toLowerCase();
    const userWeight = parseFloat(weight);

    const hasForm = userName && !isNaN(userAge) && userSex && !isNaN(userWeight);

    sessionMemory.nome = userName;
    sessionMemory.idioma = isPortuguese ? "pt" : "en";
    sessionMemory.respostasUsuario.push(message);

    const contextos = await getSymptomContext(message);
    const contexto = contextos?.[0];

    const intro = hasForm
      ? isPortuguese
        ? `${userName}, existem milhares de pessoas com esse nome. Sabia que 28% das mulheres com ${userAge} anos relatam ansiedade, 31% têm digestão lenta, e 20% não usam suplementos? Coincidência ou padrão? Vamos descobrir.`
        : `${userName}, did you know 28% of women aged ${userAge} report anxiety, 31% struggle with digestion, and 20% don’t use any supplements? Coincidence or pattern? Let's explore.`
      : isPortuguese
        ? "Sem seu nome, idade ou peso, posso te dar conselhos… tão úteis quanto ler a sorte no biscoito da sorte."
        : "Without your name, age or weight, my advice is as useful as a fortune cookie.";

    const emoji = userSex === "feminino" || userSex === "female" ? "👩" : "👨";
    const idioma = isPortuguese ? "pt" : "en";

    let followups = [];

// Variações engraçadas para quando o formulário não é preenchido
const frasesSarcasticas = [
  "Sem seu nome, idade ou peso, posso te dar conselhos… tão úteis quanto ler a sorte no biscoito da sorte.",
  "Sem dados, minha precisão é tão boa quanto um horóscopo de revista.",
  "Ignorar o formulário? Estratégia ousada. Vamos ver no que dá.",
  "Você ignora sua saúde assim também? Posso tentar adivinhar seu perfil com superpoderes… ou não.",
  "Quer ajuda, mas não preencheu nada? Legal. Posso tentar uma previsão estilo grupo de WhatsApp.",
  "Me ajudar a te ajudar? Preencher o formulário seria um bom começo 😉"
];

// ✅ DECLARAÇÃO ÚNICA DE `intro`
const intro = hasForm
  ? (
    isPortuguese
      ? `${userName}, 28% das pessoas com ${userAge} anos relatam ansiedade, 31% têm digestão lenta, e 20% não tomam suplemento. Mas você está aqui. Isso já é um passo acima da média.`
      : `${userName}, 28% of people aged ${userAge} report anxiety, 31% struggle with digestion, and 20% don’t take any supplements. You’re already ahead by showing up.`
  )
  : frasesSarcasticas[Math.floor(Math.random() * frasesSarcasticas.length)];

// Bloco base do prompt
let prompt = `${intro}\n\nYou are OwlCoreHealth AI 🦉 — a hybrid personality: smart, science-backed, sarcastic when needed, but always delivering useful answers. Never ask vague follow-up questions. Always give clear explanations, risks, and next steps. Guide the user toward solutions.`;

// 🧠 Contador de rodadas por sintoma
sessionMemory.sintomaAtual = contexto?.sintoma || null;
sessionMemory.contadorPerguntas = sessionMemory.contadorPerguntas || {};
if (contexto?.sintoma) {
  sessionMemory.contadorPerguntas[contexto.sintoma] = (sessionMemory.contadorPerguntas[contexto.sintoma] || 0) + 1;
}
const rodadas = sessionMemory.contadorPerguntas[contexto?.sintoma || ""] || 0;
const incluirSuplemento = rodadas >= 4;

if (contexto) {
  if (!sessionMemory.sintomasDetectados.includes(contexto.sintoma)) {
    sessionMemory.sintomasDetectados.push(contexto.sintoma);
  }

  const alerta = contexto && contexto.gravidade >= 4
    ? (isPortuguese
      ? "⚠️ Esse sintoma é sério. Se não cuidar, pode escalar para algo bem pior."
      : "⚠️ This is a serious symptom. Ignoring it could make things worse.")
    : "";

  const base = (isPortuguese ? contexto.base_pt : contexto.base_en) || "";
  const p1 = (isPortuguese ? contexto.pergunta1_pt : contexto.pergunta1_en) || "";
  const p2 = (isPortuguese ? contexto.pergunta2_pt : contexto.pergunta2_en) || "";
  const p3 = (isPortuguese ? contexto.pergunta3_pt : contexto.pergunta3_en) || "";

  followups = [
    `${isPortuguese ? "Quer entender" : "Want to know"} ${p1}?`,
    `${isPortuguese ? "Deseja ver como isso impacta" : "Curious how this affects"} ${p2}?`,
    `${isPortuguese ? "Posso explicar soluções práticas sobre" : "I can explain real solutions for"} ${p3}`
  ];

  prompt += `\n\n${alerta}\n\n${isPortuguese ? "Base científica:" : "Scientific insight:"}\n${base}\n\n${
    isPortuguese ? "Vamos aprofundar com 3 ideias práticas:" : "Let's explore 3 practical angles:"
  }\n1. ${followups[0]}\n2. ${followups[1]}\n3. ${followups[2]}`;

  if (incluirSuplemento) {
    prompt += isPortuguese
      ? "\n\nSe quiser, posso te mostrar o suplemento ideal para esse caso. Só dizer. 😉"
      : "\n\nIf you're ready, I can show you the ideal supplement for this case. Just ask. 😉";
  }

} else {
  followups = isPortuguese
    ? [
        "Quer entender como hábitos alimentares pioram esses sintomas?",
        "Deseja saber o que a ciência diz sobre isso?",
        "Quer ver estratégias naturais para aliviar isso agora?"
      ]
    : [
        "Want to know how food habits worsen these symptoms?",
        "Curious what science says about this?",
        "Want to see natural strategies to relieve it now?"
      ];

  prompt += `\n\n${isPortuguese
    ? "Ainda não detectei um sintoma claro, mas posso te orientar com conhecimento de verdade. Vamos começar:"
    : "I didn’t detect a clear symptom yet, but I’ll guide you with real insight. Let’s start:"}\n1. ${followups[0]}\n2. ${followups[1]}\n3. ${followups[2]}`;
}
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.7,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: message }
        ]
      })
    });

    if (!openaiRes.ok) {
      const errorData = await openaiRes.json();
      console.error("GPT error:", errorData);
      return res.status(500).json({ error: "GPT communication failed", details: errorData });
    }

    const data = await openaiRes.json();
    const reply = data.choices?.[0]?.message?.content || "I'm not sure how to answer that.";

    return res.status(200).json({
      choices: [
        {
          message: {
            content: reply,
            followups
          }
        }
      ]
    });

  } catch (err) {
    console.error("Internal server error:", err.message);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}
