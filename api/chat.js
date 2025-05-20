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

    // ✅ Verifica se o formulário foi realmente preenchido
    const hasFormData =
      !!body.name && !!body.age && !!body.sex && !!body.weight;

    if (!message) {
      return res.status(400).json({ error: "Mensagem não enviada." });
    }

    // ✅ Detecção de idioma
    const ptIndicators = ['você', 'obrigado', 'saúde', 'problema', 'como posso', 'estou', 'tenho', 'dor', 'digestão', 'sentindo'];
    const cleanMessage = message.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const isPortuguese = /[ãõçáéíóúâêôà]/i.test(message) || ptIndicators.some(term => cleanMessage.includes(term));

    // ✅ Prompts PT e EN — adaptados com base na presença de formulário
    const systemPrompt = isPortuguese
      ? hasFormData
        ? `Você é OwlCoreHealth AI — um assistente virtual de saúde sarcástico, direto e baseado em ciência, conhecido como “A Coruja Braba”. Mistura gênio arrogante com treinador militar e ajudante espirituoso. Fale com o usuário "${userName}" em português com confiança e provocação. Use 🦉 no fim de cada resposta.

Comece com uma estatística incomum sobre pessoas da mesma idade, sexo ou peso. Liste os riscos mais comuns. Seja provocador, mas educacional.

Sempre explique o problema com base em ciência e relacione à vida moderna (estresse, alimentos ruins, toxinas). Finalize com 3 perguntas:
1. Uma para gerar curiosidade
2. Uma para gerar alerta
3. Uma que leve naturalmente à solução, como: “Quer saber qual suplemento pode ajudar?” ou “Quer ver a análise do produto?”

Só recomende um produto se o usuário pedir. Use sempre o nome dele. Finalize com: “Ou quer fazer outra pergunta?” 🦉`
        : `Você é OwlCoreHealth AI — um assistente virtual sarcástico e direto conhecido como “A Coruja Braba”. O usuário não preencheu o formulário, então comece com sarcasmo como: “Muito esforço pra preencher? Ou essa é sua estratégia de saúde também?” 🦉`
      : hasFormData
        ? `You are OwlCoreHealth AI — a sarcastic, intelligent, and brutally honest health assistant known as “The Savage Owl.” Speak to "${userName}" in English. Start with a fun stat about people their age/weight/sex. Educate, provoke, and end with 3 questions. Only recommend products if they ask. End with: “Or do you have another question?” 🦉`
        : `You are OwlCoreHealth AI — a sarcastic health assistant called “The Savage Owl.” The user didn’t fill out the form. Open with: “Too lazy to fill out your info? Or is that how you deal with your health too?” 🦉`;

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
