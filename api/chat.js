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
let prompt = `${intro}\n\nYou are OwlCoreHealth AI 🦉 — a hybrid personality: sharp, honest, a bit sarcastic when needed, but always deeply informative. You are here to explain, educate, and slowly guide the user toward the best health choice — not rush them.`;

// ✅ Atualiza memória da sessão por sintoma
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

  const alerta = contexto.gravidade >= 4
    ? (idioma === "pt"
      ? "⚠️ Esse sintoma é sério. Hora de agir com inteligência."
      : "⚠️ This symptom is serious. Time to act smart.")
    : "";

  const base = idioma === "pt" ? contexto.base_pt : contexto.base_en;
  const p1 = idioma === "pt" ? contexto.pergunta1_pt : contexto.pergunta1_en;
  const p2 = idioma === "pt" ? contexto.pergunta2_pt : contexto.pergunta2_en;
  const p3 = idioma === "pt" ? contexto.pergunta3_pt : contexto.pergunta3_en;
  followups = [p1, p2, p3];

  prompt += `\n\n${alerta}\n\n${
    idioma === "pt" ? "Base científica:" : "Scientific insight:"
  }\n${base}\n\n${
    idioma === "pt"
      ? "Agora pense nessas perguntas:"
      : "Now consider these:"
  }\n1. ${p1}\n2. ${p2}\n3. ${p3}`;

  if (incluirSuplemento) {
    prompt += idioma === "pt"
      ? "\n\nSe quiser, posso te mostrar um suplemento que ajuda diretamente com isso. Só pedir. 😉"
      : "\n\nIf you want, I can show you a supplement that helps with this directly. Just ask. 😉";
  }

} else {
  followups = idioma === "pt"
    ? ["Você sente algum sintoma específico?", "Algo tem atrapalhado sua energia ou digestão?", "Quer entender o que pode estar por trás disso?"]
    : ["Do you feel any specific symptoms?", "Something affecting your energy or digestion?", "Want to understand what might be behind it?"];

  prompt += `\n\n${
    idioma === "pt"
      ? "Ainda não detectei um sintoma claro, mas posso te guiar com base em ciência e boas perguntas. Vamos lá:"
      : "I haven’t detected a specific symptom yet, but I can guide you with science and smart questions. Let's go:"
  }`;
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
