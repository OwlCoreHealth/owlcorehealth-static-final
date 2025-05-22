import { getSymptomContext } from "./notion.js";

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

    sessionMemory.nome = userName;
    sessionMemory.idioma = isPortuguese ? "pt" : "en";
    sessionMemory.respostasUsuario.push(message);
    const frasesSarcasticas = [
      "Sem seu nome, idade ou peso, posso te dar conselhos… tão úteis quanto ler a sorte no biscoito da sorte.",
      "Sem dados, minha precisão é tão boa quanto um horóscopo de revista.",
      "Ignorar o formulário? Estratégia ousada. Vamos ver no que dá.",
      "Você ignora sua saúde assim também? Posso tentar adivinhar seu perfil com superpoderes… ou não.",
      "Quer ajuda, mas não preencheu nada? Legal. Posso tentar uma previsão estilo grupo de WhatsApp.",
      "Me ajudar a te ajudar? Preencher o formulário seria um bom começo 😉"
    ];

    let intro = "";
    if (hasForm) {
      intro = isPortuguese
        ? `${userName}, 28% das pessoas com ${userAge} anos relatam ansiedade, 31% têm digestão lenta, e 20% não tomam suplemento. Mas você está aqui. Isso já é um passo acima da média.`
        : `${userName}, 28% of people aged ${userAge} report anxiety, 31% struggle with digestion, and 20% don’t take any supplements. You’re already ahead by showing up.`;
    } else {
      intro = frasesSarcasticas[Math.floor(Math.random() * frasesSarcasticas.length)];
    }

    let followups = [];
    let prompt = `${intro}\n\nYou are OwlCoreHealth AI 🦉 — a hybrid personality: smart, science-backed, sarcastic when needed, but always delivering useful answers. Never ask vague follow-up questions. Always give clear explanations, risks, and next steps. Guide the user toward solutions.`;

    const contextos = await getSymptomContext(message);
    const contexto = contextos?.[0];
    let categoria = sessionMemory.categoriaAtual || "";
    let sintoma = sessionMemory.sintomaAtual || "";

    if (contexto) {
      sintoma = contexto.sintoma;
      sessionMemory.sintomaAtual = sintoma;
      sessionMemory.categoriaAtual = ""; // zera categoria fallback
    } else if (!sintoma) {
      const msg = message.toLowerCase();
      if (/energia|fadiga|cansaço|exausto|metabolismo/.test(msg)) {
        categoria = "energia";
      } else if (/dor|inflamação|dores|inchaço|artrite/.test(msg)) {
        categoria = "dor";
      } else if (/gengiva|dente|boca|hálito|dentário/.test(msg)) {
        categoria = "boca";
      } else if (/sono|dormir|insônia|pineal|desintox/.test(msg)) {
        categoria = "sono";
      } else if (/intestino|digest|prisão|gases|barriga/.test(msg)) {
        categoria = "intestino";
      } else {
        categoria = "energia";
      }
      sessionMemory.categoriaAtual = categoria;
    }

   chave = sintoma || categoria;
    sessionMemory.contadorPerguntas[chave] = (sessionMemory.contadorPerguntas[chave] || 0) + 1;
    const etapa = sessionMemory.contadorPerguntas[chave];

    // controle de repetição de followups
    const gerarFollowupsUnicos = (perguntas) => {
      const usadas = sessionMemory.ultimasPerguntas || [];
      const novas = perguntas.filter(p => !usadas.includes(p)).slice(0, 3);
      sessionMemory.ultimasPerguntas = novas;
      return novas;
    };
    const incluirSuplemento = etapa >= 3;

    const blocos = {
      energia: {
        pt: [
          "Falta de energia pode indicar má alimentação, sedentarismo ou deficiência de nutrientes como B12 e ferro.",
          "Ignorar a fadiga pode levar a exaustão crônica, depressão e distúrbios metabólicos.",
          "Estudos mostram que mais de 40% dos adultos com fadiga persistente apresentam desequilíbrios hormonais.",
          "Nutrientes como magnésio, coenzima Q10 e vitamina D ajudam a restaurar a energia.",
          "Quer ver um suplemento que trata diretamente esse tipo de fadiga?"
        ],
        en: [
          "Low energy may come from poor diet, inactivity, or lack of nutrients like B12 and iron.",
          "Ignoring fatigue may cause chronic exhaustion and depression.",
          "Over 40% of people with chronic fatigue show hormonal and nutritional imbalances.",
          "Magnesium, CoQ10 and vitamin D help restore your energy levels.",
          "Would you like to see a supplement that helps with this?"
        ]
      },
      intestino: {
        pt: [
          "Dores intestinais podem indicar desequilíbrio da microbiota, má digestão ou intolerâncias alimentares.",
          "Se ignorado, isso pode afetar imunidade, humor e absorção de nutrientes.",
          "Mais de 70% das pessoas com intestino desequilibrado relatam ansiedade ou fadiga crônica.",
          "Probióticos, enzimas digestivas e fibras solúveis ajudam a restaurar a função intestinal.",
          "Quer ver uma fórmula ideal para recuperar o equilíbrio digestivo?"
        ],
        en: [
          "Intestinal pain may be caused by microbiota imbalance, poor digestion or food intolerances.",
          "If left untreated, it may affect your immunity, mood and nutrient absorption.",
          "Over 70% of people with gut issues also suffer from anxiety or chronic fatigue.",
          "Probiotics, digestive enzymes and soluble fibers help restore gut function.",
          "Want to see a formula that supports digestive health?"
        ]
      }
      // ... (outros blocos podem ser adicionados se necessário)
    };
   let corpo = "";
const idioma = sessionMemory.idioma || (isPortuguese ? "pt" : "en");
const nomeUser = sessionMemory.nome || (hasForm ? userName : "");
const chave = sessionMemory.sintomaAtual || sessionMemory.categoriaAtual || sintoma || categoria;
const etapa = sessionMemory.contadorPerguntas[chave] || 1;
const incluirSuplemento = etapa >= 3;

const followupEtapas = {
  pt: [
    [
      "Quer entender os riscos se isso for ignorado?",
      "Deseja ver dados reais de quem passou por isso?",
      "Quer saber quais nutrientes combatem isso?"
    ],
    [
      "Quer saber o que pode acontecer se você não tratar esse sintoma?",
      "Deseja ver estatísticas sobre como esse problema afeta outras pessoas?",
      "Gostaria de ver os principais nutrientes que ajudam nisso?"
    ],
    [
      "Posso mostrar estudos sobre esse sintoma em casos reais.",
      "Quer saber quais alimentos agravam esse sintoma?",
      "Quer ver os micronutrientes que reduzem esse tipo de inflamação?"
    ],
    [
      "Quer que eu mostre o suplemento ideal para isso?",
      "Deseja ver a avaliação completa do produto?",
      "Quer continuar tirando dúvidas sobre esse sintoma?"
    ]
  ],
  en: [
    [
      "Want to know the risks of ignoring this?",
      "Interested in real-world data on this symptom?",
      "Want to discover which nutrients help fight this?"
    ],
    [
      "Want to understand what can happen if you don’t treat this?",
      "Would you like to see stats on how this issue affects others?",
      "Want to know the key nutrients that help manage this?"
    ],
    [
      "I can show real-world research about this symptom.",
      "Want to know which foods may worsen the condition?",
      "Curious about the vitamins that fight this inflammation?"
    ],
    [
      "Want me to show the best supplement for this?",
      "Want to read the full product review?",
      "Prefer to keep asking about this symptom?"
    ]
  ]
};

if (contexto) {
  sessionMemory.sintomaAtual = contexto.sintoma;
  sessionMemory.categoriaAtual = "";

  const alerta = contexto.gravidade >= 4
    ? (idioma === "pt"
      ? "⚠️ Esse sintoma é sério. Se não cuidar, pode escalar para algo bem pior."
      : "⚠️ This is a serious symptom. Ignoring it could make things worse.")
    : "";

  const base = idioma === "pt" ? contexto.base_pt : contexto.base_en;
  const p1 = idioma === "pt" ? contexto.pergunta1_pt : contexto.pergunta1_en;
  const p2 = idioma === "pt" ? contexto.pergunta2_pt : contexto.pergunta2_en;
  const p3 = idioma === "pt" ? contexto.pergunta3_pt : contexto.pergunta3_en;

  followups = gerarFollowupsUnicos([
    `${idioma === "pt" ? "Quer entender" : "Want to know"} ${p1}?`,
    `${idioma === "pt" ? "Deseja ver como isso impacta" : "Curious how this affects"} ${p2}?`,
    `${idioma === "pt" ? "Posso explicar soluções práticas sobre" : "I can explain real solutions for"} ${p3}`
  ]);

  corpo = `\n\n${nomeUser ? (idioma === "pt" ? `Vamos focar nisso, ${nomeUser}.` : `Let's focus on that, ${nomeUser}.`) : ""}\n\n${alerta}\n\n${idioma === "pt" ? "Base científica:" : "Scientific insight:"}\n${base}\n\n${
    idioma === "pt" ? "Vamos aprofundar com 3 ideias práticas:" : "Let's explore 3 practical angles:"
  }\n1. ${followups[0]}\n2. ${followups[1]}\n3. ${followups[2]}`;

  if (incluirSuplemento) {
    corpo += idioma === "pt"
      ? "\n\nSe quiser, posso te mostrar o suplemento ideal para esse caso. Só dizer. 😉"
      : "\n\nIf you're ready, I can show you the ideal supplement for this case. Just ask. 😉";
  }

} else {
  const bloco = blocos[categoria] || blocos["energia"];
  const texto = bloco[idioma][Math.min(etapa - 1, bloco[idioma].length - 1)];

  corpo = `\n\n${texto}`;
  const etapaIndex = Math.min(etapa - 1, 3);
  followups = gerarFollowupsUnicos(followupEtapas[idioma][etapaIndex]);

  corpo += `\n\n${idioma === "pt"
    ? "Escolha uma das opções abaixo para continuarmos:"
    : "Choose one of the options below to continue:"}\n1. ${followups[0]}\n2. ${followups[1]}\n3. ${followups[2]}`;
}

prompt += corpo;
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

    if (!openaiRes.ok) {
      const errorData = await openaiRes.json();
      console.error("GPT error:", errorData);
      return res.status(500).json({ error: "GPT communication failed", details: errorData });
    }

    const data = await openaiRes.json();
    const reply = data.choices?.[0]?.message?.content || "I'm not sure how to answer that.";

    return res.status(200).json({
      choices: [
        {
          message: {
            content: reply,
            followups
          }
        }
      ]
    });

  } catch (err) {
    console.error("Internal server error:", err.message);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}
