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

    // Gerar frase inicial dependendo do preenchimento do formulário
    const intro = hasForm
      ? `${userName}, 28% das pessoas com ${userAge} anos relatam ansiedade, 31% têm digestão lenta, e 20% não tomam suplemento. Mas você está aqui. Isso já é um passo acima da média.`
      : frasesSarcasticas[Math.floor(Math.random() * frasesSarcasticas.length)];

    let contexto = null;
    let contextos = [];

    try {
      contextos = await getSymptomContext(message); // Consultando o Notion para obter o contexto do sintoma
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

    // Definição de perguntas clicáveis para cada sintoma
    const followupEtapas = {
      stomach_pain: [
        "Você tem comido alimentos picantes recentemente?",
        "Você tem se sentido estressado ultimamente? O estresse pode afetar seu estômago.",
        "Você tem histórico de condições como gastrite ou refluxo?"
      ]
    };

    let followups = [];
    let corpo = `Aqui está o que você pode tentar para aliviar suas dores:\n\n`;
    followupEtapas["stomach_pain"].forEach((question, index) => {
      corpo += `<a href="/next-step?question=${index + 1}">${index + 1}. ${question}</a>\n`; // Gerar o link clicável para cada pergunta
    });

    corpo += `\n\n${idioma === "pt" ? "Escolha uma das opções abaixo para continuarmos:" : "Choose one of the options below to continue:"}\n1. ${followups[0]}\n2. ${followups[1]}\n3. ${followups[2]}`;

    // Envio da resposta para o frontend
    return res.status(200).json({
      choices: [{ message: { content: corpo, followups } }]
    });

  } catch (err) {
    console.error("Internal server error:", err.message);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}
