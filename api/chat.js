
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

    const ptIndicators = ['você', 'obrigado', 'saúde', 'problema', 'como posso', 'estou', 'tenho', 'dor', 'digestão', 'sentindo'];
const cleanMessage = message.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const isPortuguese = /[ãõçáéíóúâêôà]/i.test(message) || ptIndicators.some(term => cleanMessage.includes(term));

    const systemPrompt = isPortuguese
  ? `Você é OwlCoreHealth AI, um assistente virtual de saúde simpático, empático e altamente confiável, criado pela equipe OwlCore Wellness Research Group. Fale com o usuário chamado "${userName}" de forma gentil, clara e baseada em ciência. Evite jargões médicos e nunca faça diagnósticos. No fim de cada resposta, escreva exatamente neste formato:

Here are 3 related questions:
1. [pergunta 1]
2. [pergunta 2]
3. [pergunta 3]`
  : `You are OwlCoreHealth AI, a friendly, science-backed virtual health assistant developed by the OwlCore Wellness Research Group. Speak to the user named "${userName}" in warm, natural U.S. English. Offer helpful, evidence-based wellness advice (never make diagnoses). At the end of every message, write exactly in this format:

Here are 3 related questions:
1. [question 1]
2. [question 2]
3. [question 3]`;

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
