export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido. Use POST." });
    }

    // Lê corretamente o corpo JSON mesmo se req.body estiver vazio
    let message = null;

    if (req.body && req.body.message) {
      message = req.body.message;
    } else {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const rawBody = Buffer.concat(buffers).toString();
      const parsed = JSON.parse(rawBody);
      message = parsed.message;
    }

    if (!message) {
      return res.status(400).json({ error: "Mensagem não enviada." });
    }

    console.log("Mensagem recebida:", message);

    // Detecta se a mensagem contém sinais de português
    const isPortuguese = /[ãõçáéíóúâêôà]/i.test(message) || / você | estou | gostaria | saúde | suplemento | problema | posso | bom /i.test(message);

    // Cria o prompt dinâmico com base no idioma
    const systemPrompt = isPortuguese
      ? "Você é um assistente de saúde amigável e profissional chamado OwlCore AI. Responda com clareza, usando o português do Brasil e uma linguagem acessível e confiável."
      : "You are OwlCore AI, a helpful and professional health assistant. Answer clearly in American English with accurate, friendly tone.";

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

