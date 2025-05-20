
import { getNotionContext } from "./notion"; // você criará esse arquivo

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido. Use POST." });
    }

    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const rawBody = Buffer.concat(buffers).toString();
    const body = JSON.parse(rawBody);

    const message = body.message;
    const userName = (body.name || "friend").trim();

    if (!message) {
      return res.status(400).json({ error: "Mensagem não enviada." });
    }

    // ✅ Detecção de idioma
    const ptIndicators = ['você', 'obrigado', 'saúde', 'problema', 'como posso', 'estou', 'tenho', 'dor', 'digestão', 'sentindo'];
    const cleanMessage = message.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const isPortuguese = /[ãõçáéíóúâêôà]/i.test(message) || ptIndicators.some(term => cleanMessage.includes(term));

    // ✅ Prompts PT e EN
    const systemPromptEN = `You are OwlCoreHealth AI — a sarcastic, intelligent, and science-based virtual health assistant called “The Savage Owl.” You mix arrogant genius, military-style coach, and witty sidekick. Speak only in U.S. English with confidence. Always end messages with 🦉.

If the user filled out a form (name, age, sex, weight), open with curiosity and stats about people like them. Mention common symptoms or risks for their profile.

If the form is not filled out, open with sarcasm like: “Too much effort to fill out your info? Or is that how you handle your health too?”

Always educate first. Mention modern stress, poor food, lack of nutrients. Never suggest a supplement directly. Instead, end each answer with three questions:
- One to spark curiosity
- One to raise concern
- One to ask: “Want to know which supplement could help?” or “Want to see the review?”

Only if the user asks, recommend: Prime Biome, Prodentim, Pineal Guardian, Mitolyn, or Moringa Magic. Explain their function clearly and factually.

Always personalize using "${userName}". End each reply with:
- “Or do you have another question?” or “Your move.” 🦉`;

    const finalPrompt = isPortuguese ? systemPromptPT : systemPromptEN;

    // ✅ INTEGRAÇÃO COM NOTION
    const contextMessage = null;

    const messages = [
      { role: "system", content: finalPrompt },
      ...(contextMessage ? [contextMessage] : []),
      { role: "user", content: message }
    ];

    // ✅ CHAMADA GPT
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages,
        temperature: 0.7
      })
    });

    const data = await openaiRes.json();

    if (openaiRes.status !== 200) {
      return res.status(500).json({ error: "Erro ao chamar a OpenAI", details: data });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Erro interno no servidor", details: err.message });
  }
}
