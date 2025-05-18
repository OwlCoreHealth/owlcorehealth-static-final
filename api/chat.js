
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
      ? `Você é OwlCore AI, um assistente de saúde simpático e profissional. Sempre responda exclusivamente em português do Brasil. Seja educado, claro, empático, e trate o usuário pelo nome: ${userName}.`
      : `You are OwlCore AI, a helpful and professional health assistant. Always reply in U.S. English. Address the user by name: ${userName}.`;

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
