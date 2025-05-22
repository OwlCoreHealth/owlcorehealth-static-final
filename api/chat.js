import { getSymptomContext } from "./notion.js";

let sessionMemory = {
  sintomasDetectados: [],
  respostasUsuario: [],
  nome: "",
  idioma: "pt",
  sintomaAtual: null,
  contadorPerguntas: {}
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

    const contextos = await getSymptomContext(message);
    const contexto = contextos?.[0];

    const frasesSarcasticas = [
      "Sem seu nome, idade ou peso, posso te dar conselhos… tão úteis quanto ler a sorte no biscoito da sorte.",
      "Sem dados, minha precisão é tão boa quanto um horóscopo de revista.",
      "Ignorar o formulário? Estratégia ousada. Vamos ver no que dá.",
      "Você ignora sua saúde assim também? Posso tentar adivinhar seu perfil com superpoderes… ou não.",
      "Quer ajuda, mas não preencheu nada? Legal. Posso tentar uma previsão estilo grupo de WhatsApp.",
      "Me ajudar a te ajudar? Preencher o formulário seria um bom começo 😉"
    ];

    const intro = hasForm
      ? (
        isPortuguese
          ? `${userName}, 28% das pessoas com ${userAge} anos relatam ansiedade, 31% têm digestão lenta, e 20% não tomam suplemento. Mas você está aqui. Isso já é um passo acima da média.`
          : `${userName}, 28% of people aged ${userAge} report anxiety, 31% struggle with digestion, and 20% don’t take any supplements. You’re already ahead by showing up.`
      )
      : frasesSarcasticas[Math.floor(Math.random() * frasesSarcasticas.length)];

    let followups = [];
    let prompt = `${intro}\n\nYou are OwlCoreHealth AI 🦉 — a hybrid personality: smart, science-backed, sarcastic when needed, but always delivering useful answers. Never ask vague follow-up questions. Always give clear explanations, risks, and next steps. Guide the user toward solutions.`;

    const emoji = userSex === "feminino" || userSex === "female" ? "👩" : "👨";
    const idioma = isPortuguese ? "pt" : "en";

    if (contexto) {
      sessionMemory.sintomaAtual = contexto.sintoma;
      sessionMemory.contadorPerguntas[contexto.sintoma] = (sessionMemory.contadorPerguntas[contexto.sintoma] || 0) + 1;
      const etapa = sessionMemory.contadorPerguntas[contexto.sintoma];
      const incluirSuplemento = etapa >= 3;

      if (!sessionMemory.sintomasDetectados.includes(contexto.sintoma)) {
        sessionMemory.sintomasDetectados.push(contexto.sintoma);
      }

      const alerta = contexto && contexto.gravidade >= 4
        ? (isPortuguese
          ? "⚠️ Esse sintoma é sério. Se não cuidar, pode escalar para algo bem pior."
          : "⚠️ This is a serious symptom. Ignoring it could make things worse.")
        : "";

      const base = (isPortuguese ? contexto.base_pt : contexto.base_en) || "";
      const p1 = (isPortuguese ? contexto.pergunta1_pt : contexto.pergunta1_en) || "";
      const p2 = (isPortuguese ? contexto.pergunta2_pt : contexto.pergunta2_en) || "";
      const p3 = (isPortuguese ? contexto.pergunta3_pt : contexto.pergunta3_en) || "";

      followups = [
        `${isPortuguese ? "Quer entender" : "Want to know"} ${p1}?`,
        `${isPortuguese ? "Deseja ver como isso impacta" : "Curious how this affects"} ${p2}?`,
        `${isPortuguese ? "Posso explicar soluções práticas sobre" : "I can explain real solutions for"} ${p3}`
      ];

      prompt += `\n\n${alerta}\n\n${isPortuguese ? "Base científica:" : "Scientific insight:"}\n${base}\n\n${
        isPortuguese ? "Vamos aprofundar com 3 ideias práticas:" : "Let's explore 3 practical angles:"
      }\n1. ${followups[0]}\n2. ${followups[1]}\n3. ${followups[2]}`;

      if (incluirSuplemento) {
        prompt += isPortuguese
          ? "\n\nSe quiser, posso te mostrar o suplemento ideal para esse caso. Só dizer. 😉"
          : "\n\nIf you're ready, I can show you the ideal supplement for this case. Just ask. 😉";
      }

    } else {
      const msg = message.toLowerCase();
      let categoria = "";

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
        categoria = "outro";
      }

      sessionMemory.contadorPerguntas[categoria] = (sessionMemory.contadorPerguntas[categoria] || 0) + 1;
      const etapa = sessionMemory.contadorPerguntas[categoria];

      const textos = {
        energia: {
          pt: [
            "Falta de energia pode indicar má alimentação, sedentarismo ou deficiência de nutrientes como B12 e ferro.",
            "Ignorar a fadiga pode levar a exaustão crônica, depressão e distúrbios metabólicos.",
            "Estudos mostram que mais de 40% dos adultos com fadiga persistente apresentam desequilíbrios hormonais e baixa absorção nutricional.",
            "Nutrientes como magnésio, coenzima Q10 e vitamina D são essenciais para restaurar os níveis de energia.",
            "Quer conhecer um suplemento específico para esse tipo de fadiga?"
          ],
          en: [
            "Low energy may stem from poor diet, inactivity, or nutrient deficiencies like B12 and iron.",
            "Ignoring fatigue can lead to chronic exhaustion, depression, and metabolic issues.",
            "Studies show over 40% of adults with persistent fatigue suffer from hormonal imbalances and nutrient malabsorption.",
            "Nutrients like magnesium, CoQ10, and vitamin D are essential to restore energy levels.",
            "Would you like to see a supplement designed to fight this type of fatigue?"
          ]
        },
        dor: {
          pt: [
            "Dores frequentes podem indicar inflamação crônica ou desgaste nas articulações.",
            "Se ignoradas, essas dores podem evoluir para doenças autoimunes e comprometimento da mobilidade.",
            "Mais de 35% das pessoas que ignoram inflamações desenvolvem doenças como artrite e fibromialgia.",
            "Nutrientes anti-inflamatórios como cúrcuma, moringa e ômega-3 ajudam a aliviar essas dores.",
            "Quer conhecer uma fórmula com esses compostos naturais?"
          ],
          en: [
            "Persistent pain may signal chronic inflammation or joint deterioration.",
            "Left untreated, it can lead to autoimmune disorders and reduced mobility.",
            "35% of people ignoring inflammation end up with conditions like arthritis and fibromyalgia.",
            "Anti-inflammatory nutrients like turmeric, moringa, and omega-3 help relieve pain.",
            "Want to see a formula with these natural compounds?"
          ]
        },
        boca: {
          pt: [
            "Sangramento nas gengivas pode ser sinal de desequilíbrio bacteriano na boca.",
            "Ignorar isso pode levar a periodontite, perda dentária e até riscos cardíacos.",
            "Estudos mostram que doenças gengivais aumentam em 30% o risco de infarto.",
            "Probióticos orais como o Streptococcus salivarius K12 ajudam a restaurar a flora oral.",
            "Quer que eu te mostre uma solução com probióticos específicos para isso?"
          ],
          en: [
            "Bleeding gums may signal bacterial imbalance in your mouth.",
            "Ignoring it can lead to periodontitis, tooth loss, and even heart risks.",
            "Studies show gum disease increases heart attack risk by 30%.",
            "Oral probiotics like Streptococcus salivarius K12 restore oral microbiome.",
            "Want me to show a probiotic formula that targets this issue?"
          ]
        },
        sono: {
          pt: [
            "Dificuldades para dormir estão ligadas ao estresse e desregulação da melatonina.",
            "Se ignorado, o distúrbio do sono pode afetar hormônios, imunidade e memória.",
            "Estudos mostram que a má qualidade do sono aumenta em 50% o risco de depressão.",
            "Nutrientes como triptofano, magnésio, L-teanina e extrato de camomila ajudam a regular o sono.",
            "Deseja conhecer um suplemento que contém todos esses compostos?"
          ],
          en: [
            "Trouble sleeping often stems from stress and melatonin imbalance.",
            "Untreated, it can affect hormones, immunity, and cognitive function.",
            "Poor sleep quality increases depression risk by 50%, studies show.",
            "Nutrients like tryptophan, magnesium, L-theanine, and chamomile extract help.",
            "Want to see a natural supplement with these ingredients?"
          ]
        },
        intestino: {
          pt: [
            "Problemas intestinais podem surgir do desequilíbrio da microbiota.",
            "Se não corrigido, isso afeta imunidade, pele e até o humor.",
            "Cerca de 70% das pessoas com disbiose relatam sintomas como ansiedade, acne e alergias.",
            "Probióticos, fibras e enzimas digestivas são essenciais para restaurar o equilíbrio intestinal.",
            "Quer conhecer uma fórmula ideal para isso?"
          ],
          en: [
            "Gut issues may arise from microbiome imbalance.",
            "If left untreated, it affects immunity, skin, and mood.",
            "70% of those with dysbiosis report symptoms like anxiety, acne, and allergies.",
            "Probiotics, fiber, and digestive enzymes help restore gut health.",
            "Want to explore a formula designed for this?"
          ]
        }
      };

      const grupo = textos[categoria] || textos["energia"];
      const etapaTexto = grupo[isPortuguese ? "pt" : "en"][Math.min(sessionMemory.contadorPerguntas[categoria] - 1, 4)];

      followups = sessionMemory.contadorPerguntas[categoria] < 5
        ? isPortuguese
          ? [
              "Quer entender os riscos se isso for ignorado?",
              "Deseja ver dados reais de quem passou por isso?",
              "Quer saber quais nutrientes combatem isso?"
            ]
          : [
              "Want to know the risks of ignoring this?",
              "Interested in real-world data on this symptom?",
              "Want to discover which nutrients help fight this?"
            ]
        : isPortuguese
          ? [
              "Quer que eu mostre o suplemento ideal para isso?",
              "Deseja ver a avaliação completa do produto?",
              "Quer continuar tirando dúvidas sobre esse sintoma?"
            ]
          : [
              "Want me to show the best supplement for this?",
              "Want to read the full product review?",
              "Prefer to keep asking about this symptom?"
            ];

      prompt += `\n\n${etapaTexto}\n\n${
        isPortuguese ? "Escolha uma das opções abaixo para continuarmos:" : "Choose one of the options below to continue:"
      }\n1. ${followups[0]}\n2. ${followups[1]}\n3. ${followups[2]}`;
    }

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
    let reply = data.choices?.[0]?.message?.content || "I'm not sure how to answer that.";

    if (!hasForm && intro) {
      reply = `${intro}\n\n${reply}`;
    }

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
