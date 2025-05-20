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

    // ✅ Detecção simples de idioma
    const ptIndicators = ['você', 'obrigado', 'saúde', 'problema', 'como posso', 'estou', 'tenho', 'dor', 'digestão', 'sentindo'];
    const cleanMessage = message.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const isPortuguese = /[ãõçáéíóúâêôà]/i.test(message) || ptIndicators.some(term => cleanMessage.includes(term));

    // ✅ Prompts PT e EN simplificados
    const systemPrompt = isPortuguese
      ? `Você é um assistente de saúde confiável chamado OwlCoreHealth AI. Fale com o usuário "${userName}" em português claro, com explicações úteis e baseadas em ciência. Finalize com três perguntas relacionadas para continuar o diálogo.`
      : `You are a trusted health assistant named OwlCoreHealth AI. Speak to the user "${userName}" in natural U.S. English. Give useful, science-based wellness advice, and always finish with three related questions to keep the conversation going.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ];

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
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
