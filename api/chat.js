
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
    const userName = (body.name || "amigo").trim();

    if (!message) {
      return res.status(400).json({ error: "Mensagem não enviada." });
    }

    const isPortuguese = /[ãõçáéíóúâêôà]|\\b(você|obrigado|saúde|problema|como posso)\\b/i.test(message);

    const systemPrompt = isPortuguese
  ? `Você é OwlCoreHealth AI, um assistente virtual de saúde simpático, empático e altamente confiável, criado pela equipe OwlCore Wellness Research Group. Fale com o usuário chamado "${userName}" de forma gentil, clara e baseada em ciência. Evite jargões médicos e nunca faça diagnósticos. Sugira suplementos naturais, dicas de estilo de vida e práticas saudáveis. No fim de cada resposta, sugira 3 perguntas relacionadas para manter o diálogo fluindo. Use o emoji 🦉 nas suas respostas.`
  : `You are OwlCoreHealth AI, a friendly, science-backed virtual health assistant developed by the OwlCore Wellness Research Group. Speak to the user named "${userName}" in warm, natural U.S. English. Offer helpful, evidence-based wellness advice (never make diagnoses), and always sound supportive and kind. At the end of every message, suggest 3 related follow-up questions to keep the conversation helpful. Use the 🦉 emoji in your replies.`;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
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
