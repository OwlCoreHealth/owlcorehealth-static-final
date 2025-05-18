export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido. Use POST." });
    }

    let body = {};
    if (req.body && req.body.message) {
      body = req.body;
    } else {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const rawBody = Buffer.concat(buffers).toString();
      body = JSON.parse(rawBody);
    }

    const message = body.message;
    const userName = body.name || "amigo";

    if (!message) {
      return res.status(400).json({ error: "Mensagem não enviada." });
    }

    console.log("Mensagem recebida:", message);

    // Detecção de português robusta
    const ptIndicators = [' você ', ' estou ', ' gostaria ', ' suplemento ', ' saúde ', ' problema ', ' posso ', ' bom ', ' obrigada ', ' obrigado '];
    const isPortuguese = /[ãõçáéíóúâêôà]/i.test(message) || ptIndicators.some(word => message.toLowerCase().includes(word));

    // Prompt personalizado com nome e idioma
    const systemPrompt = isPortuguese
      ? `Você é OwlCore AI, um assistente de saúde simpático e profissional. Responda em português do Brasil. Use um tom acessível, direto e chame o usuário pelo nome "${userName}".`
      : `You are OwlCore AI, a helpful and professional health assistant. Speak in American English and address the user by name: "${userName}". Be clear and friendly.`;

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
      console.error("Erro da OpenAI:", data);
      return res.status(500).json({ error: "Erro ao chamar a OpenAI", details: data });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Erro inesperado:", err);
    res.status(500).json({ error: "Erro interno no servidor", details: err.message });
  }
}
