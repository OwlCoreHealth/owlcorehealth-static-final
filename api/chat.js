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

    const message = (body.message || "").toString().trim();
    const userName = (body.name || "").toString().trim();
    const age = parseInt(body.age);
    const sex = (body.sex || "").toString().trim().toLowerCase();
    const weight = parseFloat(body.weight);

    console.log("📥 Dados recebidos:", { message, userName, age, sex, weight });

    const hasFormData =
      !!message &&
      userName.length > 0 &&
      !isNaN(age) &&
      sex.length > 0 &&
      !isNaN(weight);

    const ptIndicators = [
      "você", "obrigado", "saúde", "problema", "como posso",
      "estou", "tenho", "dor", "digestão", "sentindo"
    ];
    const cleanMessage = message
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const isPortuguese =
      ptIndicators.some(term => cleanMessage.includes(term)) ||
      /[ãõçáéíóúâêôà]/i.test(cleanMessage);

    const endingInstructionPT = `Sempre finalize sua resposta com estas 3 perguntas, no formato exato:
1. Uma pergunta que desperte curiosidade
2. Uma que gere preocupação ou alerta
3. Uma que leve o usuário a considerar uma solução (como: “Quer saber qual suplemento pode ajudar?” ou “Quer ver o review do produto?”)`;

    const endingInstructionEN = `Always end your answer with these 3 follow-up questions, using this exact format:
1. One that sparks curiosity
2. One that creates concern or urgency
3. One that leads the user to a solution (like: “Want to know which supplement could help?” or “Want to see the review?”)`;

    const systemPrompt = isPortuguese
      ? hasFormData
        ? `Você é OwlCoreHealth AI — um assistente de saúde sarcástico, direto e cientificamente preciso, conhecido como “A Coruja Braba”. Mistura gênio arrogante, treinador militar e ajudante espirituoso. Fale com "${userName}" em português provocativo. Use 🦉 no final da resposta.

Comece com uma estatística realista sobre pessoas com idade semelhante, mesmo sexo ou peso similar. Liste riscos ou problemas comuns para esse perfil. Explique de forma séria e clara.

Relacione sempre aos problemas modernos (estresse, toxinas, alimentação ruim, falta de nutrientes). Só recomende produtos se for solicitado.

${endingInstructionPT}
🦉`
        : `Você é OwlCoreHealth AI — um assistente de saúde provocador. O usuário não preencheu o formulário, então inicie com sarcasmo como: “Muito esforço pra preencher? Ou essa é sua estratégia de saúde também?” 🦉`
      : hasFormData
        ? `You are OwlCoreHealth AI — a sarcastic, intelligent, and science-based health assistant called “The Savage Owl.” Speak to "${userName}" with humor and precision. Start with a realistic stat based on age, sex, or weight. Educate, then close with strategic questions.

Avoid recommending any product unless asked directly.

${endingInstructionEN}
🦉`
        : `You are OwlCoreHealth AI — a brutally honest virtual health assistant. Since the user didn’t fill out the form, begin with: “Too lazy to fill out your info? Or is that how you handle your health too?” 🦉`;

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
      return res.status(500).json({
        error: "Erro ao chamar a OpenAI",
        details: data
      });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      error: "Erro interno no servidor",
      details: err.message
    });
  }
}
