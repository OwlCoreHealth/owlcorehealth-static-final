// Etapa FINAL - OwlCoreHealth AI com GPT livre + contexto dinâmico do Notion
import { getSymptomContext } from "./notion";

let sessionMemory = {
  sintomasDetectados: [],
  sintomasProcessados: [],
  sintomaAtual: null,
  respostasUsuario: [],
  suplementoSugerido: null,
  perguntasJaFeitas: [],
  nome: "",
  idioma: "pt"
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed. Use POST." });
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

    const hasFormData = userName && !isNaN(age) && sex && !isNaN(weight);
    if (!message) {
      return res.status(400).json({ error: "Mensagem não enviada." });
    }

    const ptIndicators = [' você ', ' estou ', ' gostaria ', 'suplemento', ' saúde', ' problema ', ' posso ', ' obrigado', ' obrigada'];
    const isPortuguese = /[\u00e3\u00f5\u00e7\u00e1\u00e9\u00ed\u00f3\u00fa\u00e2\u00ea\u00f4\u00e0]/i.test(message) || ptIndicators.some(word => message.toLowerCase().includes(word));

    sessionMemory.nome = userName;
    sessionMemory.idioma = isPortuguese ? "pt" : "en";
    sessionMemory.respostasUsuario.push(message);

    const contextos = await getSymptomContext(message);

    let contextBlock = "";
    if (contextos && contextos.length > 0) {
      const ctx = contextos[0];
      const base = isPortuguese ? ctx.base_pt : ctx.base_en;
      contextBlock = `\n\n[Relevant Scientific Insight]\n${base}`;
    }

    const systemPrompt = isPortuguese
      ? `Você é OwlCoreHealth AI, um assistente de saúde sarcástico, direto e cientificamente preciso. Sempre fale em PT-BR. Trate o usuário pelo nome: ${userName || "amigo"}. Se dados forem fornecidos (nome, idade, sexo, peso), use isso para personalizar. Evite suposições sem base. Seja claro, provocador e informativo.${contextBlock}`
      : `You are OwlCoreHealth AI, a sarcastic, direct, and scientifically sharp health assistant. Always speak in US English. Address the user by name: ${userName || "friend"}. If profile data (name, age, sex, weight) is provided, use it to personalize. Avoid unsupported assumptions. Be clear, provoking, and informative.${contextBlock}`;

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
        model: "gpt-4o",
        messages,
        temperature: 0.7
      })
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      console.error("❌ OpenAI API error:", {
        status: openaiRes.status,
        statusText: openaiRes.statusText,
        error: data?.error || data
      });
      return res.status(500).json({
        error: "Erro ao chamar a OpenAI",
        status: openaiRes.status,
        statusText: openaiRes.statusText,
        details: data?.error || data
      });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Erro interno no servidor", details: err.message });
  }
}
