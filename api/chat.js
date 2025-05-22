// 🔁 chat.js completo com funil progressivo e compatibilidade total sem alterar nada além do necessário

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

    const frasesSarcasticas = [
      "Sem seu nome, idade ou peso, posso te dar conselhos… tão úteis quanto ler a sorte no biscoito da sorte.",
      "Sem dados, minha precisão é tão boa quanto um horóscopo de revista.",
      "Ignorar o formulário? Estratégia ousada. Vamos ver no que dá.",
      "Você ignora sua saúde assim também? Posso tentar adivinhar seu perfil com superpoderes… ou não.",
      "Quer ajuda, mas não preencheu nada? Legal. Posso tentar uma previsão estilo grupo de WhatsApp.",
      "Me ajudar a te ajudar? Preencher o formulário seria um bom começo 😉"
    ];

    const intro = hasForm
      ? (
        isPortuguese
          ? `${userName}, 28% das pessoas com ${userAge} anos relatam ansiedade, 31% têm digestão lenta, e 20% não tomam suplemento. Mas você está aqui. Isso já é um passo acima da média.`
          : `${userName}, 28% of people aged ${userAge} report anxiety, 31% struggle with digestion, and 20% don’t take any supplements. You’re already ahead by showing up.`
      )
      : frasesSarcasticas[Math.floor(Math.random() * frasesSarcasticas.length)];

    // Funil progressivo com rodadas
    sessionMemory.sintomaAtual = contexto?.sintoma || null;
    sessionMemory.contadorPerguntas = sessionMemory.contadorPerguntas || {};
    if (contexto?.sintoma) {
      sessionMemory.contadorPerguntas[contexto.sintoma] = (sessionMemory.contadorPerguntas[contexto.sintoma] || 0) + 1;
    }

    const rodadas = sessionMemory.contadorPerguntas[contexto?.sintoma || ""] || 0;
    const incluirSuplemento = rodadas >= 3;

    let followups = [];
    let prompt = `${intro}\n\nYou are OwlCoreHealth AI 🦉 — a hybrid personality: smart, honest, and scientific. Guide the user through progressively deeper health knowledge. Avoid repetition. Always add new insight each round.`;

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

      if (rodadas === 1) {
        prompt += `\n\n${alerta}\n\n${isPortuguese ? "Base científica:" : "Scientific insight:"}\n${base}`;
        followups = [p1, p2, p3];
      } else if (rodadas === 2) {
        prompt += isPortuguese
          ? `\n\nSabia que esse sintoma está relacionado a riscos como ${contexto.risco_pt}?`
          : `\n\nDid you know this symptom is linked to risks like ${contexto.risco_en}?`;
        followups = [
          isPortuguese ? "Quer saber como evitar esses riscos?" : "Want to know how to avoid these risks?",
          isPortuguese ? "Deseja saber o que pode agravar esse quadro?" : "Want to know what can worsen this?",
          isPortuguese ? "Posso mostrar os impactos de ignorar isso." : "I can show you what happens if this is ignored."
        ];
      } else if (rodadas === 3) {
        prompt += isPortuguese
          ? "\n\nEstudos mostram que muitas pessoas ignoram esse sintoma e desenvolvem complicações. Quer entender melhor?"
          : "\n\nStudies show many ignore this and later develop complications. Want to explore that?";
        followups = [
          isPortuguese ? "Deseja ver os dados sobre isso?" : "Want to see data on this?",
          isPortuguese ? "Quer exemplos reais de pacientes?" : "Want real patient examples?",
          isPortuguese ? "Posso mostrar o que a ciência encontrou." : "I can show what science found."
        ];
      } else if (rodadas === 4) {
        prompt += isPortuguese
          ? "\n\nNutrientes como vitamina C, zinco e probióticos podem ajudar neste quadro."
          : "\n\nNutrients like vitamin C, zinc, and probiotics may support improvement here.";
        followups = [
          isPortuguese ? "Quer saber quais alimentos ajudam nisso?" : "Want to know which foods help with this?",
          isPortuguese ? "Deseja ver hábitos naturais eficazes?" : "Want to see natural strategies?",
          isPortuguese ? "Posso recomendar ajustes alimentares úteis." : "I can suggest helpful dietary tips."
        ];
      } else {
        prompt += isPortuguese
          ? "\n\nSe quiser, posso indicar um suplemento ideal para lidar com esse sintoma. Só pedir."
          : "\n\nIf you’d like, I can recommend the ideal supplement for this symptom. Just ask.";
        followups = [
          isPortuguese ? "Quer conhecer já o produto?" : "Want to see the product now?",
          isPortuguese ? "Quer saber qual suplemento ajuda com isso?" : "Want to know which supplement helps?",
          isPortuguese ? "Deseja continuar com mais dicas naturais?" : "Want more natural advice instead?"
        ];
      }
    } else {
      prompt += isPortuguese
        ? "\n\nNão encontrei dados científicos sobre isso. Quer tentar outro sintoma ou especificar melhor?"
        : "\n\nI couldn’t find scientific data on that yet. Want to try a different symptom or be more specific?";
      followups = isPortuguese
        ? ["Pode me dizer outro sintoma?", "Quer tentar algo mais comum?", "Deseja ver uma lista de temas?"]
        : ["Can you describe another symptom?", "Want to try something more common?", "Want to see a list of topics?"];
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
    let reply = data.choices?.[0]?.message?.content || "I'm not sure how to answer that.";

    if (!hasForm && intro) {
      reply = `${intro}\n\n${reply}`;
    }

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
