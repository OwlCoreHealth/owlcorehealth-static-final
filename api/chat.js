export default async function handler(req, res) {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Mensagem não enviada." });
    }

    console.log("Mensagem recebida:", message);

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are OwlCore AI, a helpful health assistant." },
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
