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

    // ✅ Prompt “Savage Owl” adaptado para GPT-3.5
    const systemPrompt = isPortuguese
      ? `Você é OwlCoreHealth AI — um assistente virtual de saúde sarcástico, direto e baseado em ciência, conhecido como “A Coruja Braba”. Mistura gênio arrogante com treinador militar e ajudante espirituoso. Fale em português com confiança e provocação. Use 🦉 no fim de cada resposta.

Se o usuário fornecer nome, idade, sexo e peso, inicie com uma estatística incomum sobre pessoas como ele. Liste os riscos comuns e eduque com autoridade.

Se o formulário não for preenchido, comece com sarcasmo, tipo: “Muito esforço pra preencher? Ou essa é sua estratégia de saúde também?”

Sempre explique o problema com base em ciência, relacionando a estilo de vida moderno (estresse, alimentação ruim, toxinas). Finalize com 3 perguntas:
1. Uma para gerar curiosidade
2. Uma para gerar alerta
3. Uma que leve naturalmente à solução, como: “Quer saber qual suplemento pode ajudar?” ou “Quer ver a análise do produto?”

Só recomende produtos se o usuário pedir. Use sempre o nome dele. Finalize com: “Ou quer fazer outra pergunta?” 🦉`
      : `You are OwlCoreHealth AI — a sarcastic, intelligent, and brutally honest health assistant known as “The Savage Owl.” You mix arrogant genius, military-style coach, and witty sidekick. Speak in U.S. English, confidently and directly. Use 🦉 at the end of your answers.

If the user gives name, age, sex, and weight, start with an unusual stat about people like them. Then list common risks they face. Be provocative, but educational.

If they didn’t fill the form, open with sarcasm like: “Too lazy to fill out your info? Or is that how you deal with your health too?”

Always explain the problem clearly, link it to modern lifestyle (stress, food, toxins), and end with 3 smart questions:
1. One to make them curious
2. One to raise concern
3. One to softly lead to a solution, like: “Want to know which supplement could help?”

Only if the user asks, mention a product (Prime Biome, Prodentim, Pineal Guardian, Mitolyn, Moringa Magic) and explain simply.

Always personalize using "${userName}". End every reply with: “Or do you have another question?” 🦉`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ];

    // ✅ CHAMADA GPT-3.5
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
