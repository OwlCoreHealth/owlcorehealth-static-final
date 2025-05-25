import { getSymptomContext } from "./notion.mjs"; 

let sessionMemory = {
  sintomasDetectados: [],
  respostasUsuario: [],
  nome: "",
  idioma: "pt",
  sintomaAtual: null,
  categoriaAtual: null,
  contadorPerguntas: {},
  ultimasPerguntas: []
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed. Use POST." });
    }

    const { message, name, age, sex, weight } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "No message provided." });
    }

    const isPortuguese = /[ãõçáéíóú]| você|dor|tenho|problema|saúde/i.test(message);
    const userName = name?.trim() || "";
    const userAge = parseInt(age);
    const userSex = (sex || "").toLowerCase();
    const userWeight = parseFloat(weight);
    const hasForm = userName && !isNaN(userAge) && userSex && !isNaN(userWeight);
    const idioma = isPortuguese ? "pt" : "en";

    sessionMemory.nome = userName;
    sessionMemory.idioma = idioma;
    sessionMemory.respostasUsuario.push(message);

    const frasesSarcasticas = [
      idioma === "pt"
        ? "Sem seu nome, idade ou peso, posso te dar conselhos… tão úteis quanto ler a sorte no biscoito da sorte."
        : "Without your name, age or weight, my advice is about as useful as a fortune cookie.",
      idioma === "pt"
        ? "Ignorar o formulário? Estratégia ousada. Vamos ver no que dá."
        : "Skipping the form? Bold move. Let’s see how that works out.",
      idioma === "pt"
        ? "Você ignora sua saúde assim também? Posso tentar adivinhar seu perfil com superpoderes… ou não."
        : "Do you ignore your health like this too? I could guess with superpowers… or not."
    ];

    const intro = hasForm
      ? idioma === "pt"
        ? `${userName}, 28% das pessoas com ${userAge} anos relatam ansiedade, 31% têm digestão lenta, e 20% não tomam suplemento. Mas você está aqui. Isso já é um passo acima da média.`
        : `${userName}, 28% of people aged ${userAge} report anxiety, 31% struggle with digestion, and 20% don’t take supplements. You’re ahead of the curve.`
      : frasesSarcasticas[Math.floor(Math.random() * frasesSarcasticas.length)];

    let contexto = null;
    let contextos = [];

    try {
      contextos = await getSymptomContext(message);
      if (contextos.length) contexto = contextos[0];
    } catch (err) {
      console.warn("🔔 Falha ao consultar Notion. Usando fallback por categoria.", err.message);
      contextos = [];
    }

    let sintoma = sessionMemory.sintomaAtual || "";
    let categoria = sessionMemory.categoriaAtual || "";

    if (contexto) {
      sintoma = contexto.sintoma;
      sessionMemory.sintomaAtual = sintoma;
      sessionMemory.categoriaAtual = "";
    } else if (!sintoma) {
      const msg = message.toLowerCase();
      if (/energia|fadiga|cansaço/.test(msg)) categoria = "energia";
      else if (/dor|inflamação/.test(msg)) categoria = "dor";
      else if (/gengiva|boca/.test(msg)) categoria = "boca";
      else if (/sono|insônia/.test(msg)) categoria = "sono";
      else if (/intestino|digest/.test(msg)) categoria = "intestino";
      else categoria = "energia";
      sessionMemory.categoriaAtual = categoria;
    }

    const chave = sintoma || categoria;
    sessionMemory.contadorPerguntas[chave] = (sessionMemory.contadorPerguntas[chave] || 0) + 1;
    const etapa = sessionMemory.contadorPerguntas[chave];
    const incluirSuplemento = etapa >= 3;

    const blocos = {
      intestino: {
        pt: [
          "Dores intestinais podem ser sinal de microbiota desequilibrada, má digestão ou intolerâncias alimentares.",
          "Ignorar esses sintomas pode levar à má absorção de nutrientes, enfraquecimento da imunidade e até distúrbios crônicos.",
          "Estudos mostram que mais de 70% dos pacientes com intestino desregulado também relatam ansiedade.",
          "Probióticos, fibras solúveis e enzimas digestivas podem ajudar a restaurar o equilíbrio intestinal.",
          "Deseja conhecer um suplemento ideal para restaurar sua saúde intestinal?"
        ],
        en: [
          "Intestinal pain can signal an imbalanced microbiome, poor digestion, or food intolerance.",
          "Ignoring these signs can result in poor nutrient absorption, low immunity, and chronic inflammation.",
          "Over 70% of people with gut dysbiosis report chronic anxiety or fatigue.",
          "Probiotics, soluble fibers and digestive enzymes can help rebalance the gut.",
          "Want to discover a top supplement to restore your gut health?"
        ]
      }
    };

    const followupEtapas = {
      pt: [
        ["Quer entender os riscos se isso for ignorado?", "Deseja ver dados reais de quem passou por isso?", "Quer saber quais nutrientes combatem isso?"],
        ["Quer saber o que pode acontecer se você não tratar esse sintoma?", "Deseja ver estatísticas sobre como esse problema afeta outras pessoas?", "Quer ver alimentos que agravam isso?"],
        ["Posso mostrar estudos reais sobre esse sintoma.", "Quer saber os micronutrientes mais eficazes nesse caso?", "Deseja ver alternativas naturais para aliviar isso?"],
        ["Quer que eu mostre o suplemento ideal para isso?", "Deseja ver a avaliação completa do produto?", "Quer continuar explorando sintomas parecidos?"]
      ],
      en: [
        ["Want to know the risks of ignoring this?", "Interested in real-world data on this symptom?", "Want to discover which nutrients help fight this?"],
        ["Want to understand what happens if untreated?", "Want to see how others are affected by this issue?", "Want to see foods that make it worse?"],
        ["I can show real-world studies on this symptom.", "Curious about the most effective nutrients for this?", "Want natural alternatives to ease this now?"],
        ["Want me to show you the ideal supplement?", "Want to read the full product review?", "Prefer to continue exploring related symptoms?"]
      ]
    };

    let followups = [];
    let corpo = "";
    const idiomaEtapas = followupEtapas[idioma];
    const etapaIndex = Math.min(etapa - 1, idiomaEtapas.length - 1);

    if (contexto) {
      const base = idioma === "pt" ? contexto.base_pt : contexto.base_en;
      const pergunta1 = idioma === "pt" ? contexto.pergunta1_pt : contexto.pergunta1_en;
      const pergunta2 = idioma === "pt" ? contexto.pergunta2_pt : contexto.pergunta2_en;
      const pergunta3 = idioma === "pt" ? contexto.pergunta3_pt : contexto.pergunta3_en;

      followups = [pergunta1, pergunta2, pergunta3].filter(Boolean);

      corpo = `\n\n${hasForm ? (idioma === "pt" ? `Vamos focar nisso, ${userName}.` : `Let’s focus on that, ${userName}.`) : ""}\n\n${idioma === "pt" ? "Base científica:" : "Scientific insight:"}\n${base}\n\n${
        idioma === "pt" ? "Vamos aprofundar com 3 ideias:" : "Let’s explore 3 ideas:"
      }\n1. ${followups[0]}\n2. ${followups[1]}\n3. ${followups[2]}`;

      if (incluirSuplemento) {
        corpo += idioma === "pt"
          ? `\n\nSe quiser, posso te mostrar o suplemento ideal para esse caso. 😉`
          : `\n\nIf you want, I can show you the ideal supplement for this. 😉`;
      }

    } else {
      const bloco = blocos[categoria] || blocos["energia"];
      corpo = `\n\n${hasForm ? (idioma === "pt" ? `Vamos focar nisso, ${userName}.` : `Let’s focus on that, ${userName}.`) : ""}\n\n${bloco[idioma][etapaIndex] || bloco[idioma][0]}`;
      followups = idiomaEtapas[etapaIndex] || [];

      corpo += `\n\n${idioma === "pt"
        ? "Escolha uma das opções abaixo para continuarmos:"
        : "Choose one of the options below to continue:"}\n1. ${followups[0]}\n2. ${followups[1]}\n3. ${followups[2]}`;
    }

    const prompt = `${intro}\n\nYou are OwlCoreHealth AI 🦉 — a hybrid personality: smart, science-backed, sarcastic when needed, but always delivering useful answers.\n${corpo}`;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.7,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: message }
        ]
      })
    });

    const data = await openaiRes.json();
    const reply = data.choices?.[0]?.message?.content || "Resposta não encontrada.";
    return res.status(200).json({
      choices: [{ message: { content: reply, followups } }]
    });

  } catch (err) {
    console.error("Internal server error:", err.message);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}
