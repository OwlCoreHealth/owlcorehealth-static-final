// === ETAPA 1: MEMÓRIA PERSISTENTE E CONTROLE DE FLUXO ===
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

// === ETAPA 2: FUNÇÕES AUXILIARES DE SINTOMAS, ESTATÍSTICAS E GRAVIDADE ===
function generateIntroWithStats(name, age, sex, weight) {
  const sexoText = sex === "feminino" ? "mulheres" : "homens";
  const sintomas = [
    { stat: 28, desc: "relatam ansiedade constante" },
    { stat: 31, desc: "sofrem com digestão lenta" },
    { stat: 20, desc: "não usam qualquer suplemento" }
  ];
  const statLine = sintomas.map(s => `${s.stat}% ${sexoText} com ${age} anos ${s.desc}`).join(", ");
  return `${name}, existem milhares de pessoas com esse nome no mundo. Sabia que ${statLine}? Coincidência ou padrão? Vamos descobrir.`;
}

function generateIntroWithStatsEN(name, age, sex, weight) {
  const sexoText = sex === "female" ? "women" : "men";
  const sintomas = [
    { stat: 28, desc: "report constant anxiety" },
    { stat: 31, desc: "struggle with slow digestion" },
    { stat: 20, desc: "avoid any kind of supplementation" }
  ];
  const statLine = sintomas.map(s => `${s.stat}% of ${sexoText} aged ${age} ${s.desc}`).join(", ");
  return `${name}, did you know there are thousands of people with your name globally? Interestingly, ${statLine}. Coincidence or pattern? Let's find out.`;
}

function combineContexts(contextos, lang = "pt") {
  const base = contextos.map(c => (lang === "pt" ? c.base_pt : c.base_en)).join(" ");
  const perguntas = contextos.slice(0, 3);
  return {
    base: base.trim(),
    pergunta1: perguntas[0] ? (lang === "pt" ? perguntas[0].pergunta1_pt : perguntas[0].pergunta1_en) : "",
    pergunta2: perguntas[1] ? (lang === "pt" ? perguntas[1].pergunta2_pt : perguntas[1].pergunta2_en) : "",
    pergunta3: perguntas[2] ? (lang === "pt" ? perguntas[2].pergunta3_pt : perguntas[2].pergunta3_en) : "",
    sintomas: contextos.map(c => c.sintoma),
    gravidade: Math.max(...contextos.map(c => c.gravidade || 1)),
    suplemento: contextos[0]?.suplemento || "",
    link: contextos[0]?.url || "",
    chamada: lang === "pt" ? contextos[0]?.link_pt : contextos[0]?.link_en
  };
}

function gerarAvisoGravidadePT(gravidade) {
  if (gravidade >= 5) return "\u26a0\ufe0f Isso é sério. Você pode estar ignorando algo que exige atenção médica urgente.";
  if (gravidade === 4) return "\u26a0\ufe0f Esse sintoma merece atenção e cuidado. Vamos entender o porquê.";
  if (gravidade === 3) return "Esse sintoma não é tão leve quanto parece. Melhor investigarmos juntos.";
  return "";
}

function gerarAvisoGravidadeEN(gravidade) {
  if (gravidade >= 5) return "\u26a0\ufe0f This could be serious. You might be ignoring something that requires urgent medical attention.";
  if (gravidade === 4) return "\u26a0\ufe0f This symptom deserves attention. Let’s take it seriously.";
  if (gravidade === 3) return "This might not be as mild as it seems. Let’s explore it carefully.";
  return "";
}

function selecionarProximoSintoma() {
  const naoProcessados = sessionMemory.sintomasDetectados.filter(
    (sint) => !sessionMemory.sintomasProcessados.includes(sint)
  );
  return naoProcessados.length > 0 ? naoProcessados[0] : null;
}

// === HANDLER PRINCIPAL ===
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido. Use POST." });
    }

    const buffers = [];
    for await (const chunk of req) buffers.push(chunk);
    const rawBody = Buffer.concat(buffers).toString();
    const body = JSON.parse(rawBody);

    const message = (body.message || "").toString().trim();
    const userName = (body.name || "").toString().trim();
    const age = parseInt(body.age);
    const sex = (body.sex || "").toString().trim().toLowerCase();
    const weight = parseFloat(body.weight);

    const hasFormData = userName && !isNaN(age) && sex && !isNaN(weight);
    if (!message) return res.status(400).json({ error: "Mensagem não enviada." });

    const ptIndicators = [' você ', ' estou ', ' gostaria ', 'suplemento', ' saúde', ' problema ', ' posso ', ' obrigado', ' obrigada'];
    const isPortuguese = /[\u00e3\u00f5\u00e7\u00e1\u00e9\u00ed\u00f3\u00fa\u00e2\u00ea\u00f4\u00e0]/i.test(message) || ptIndicators.some(w => message.toLowerCase().includes(w));

    sessionMemory.nome = userName;
    sessionMemory.idioma = isPortuguese ? "pt" : "en";
    sessionMemory.respostasUsuario.push(message);

    const contextos = await getSymptomContext(message);
    const contextCombined = combineContexts(contextos, isPortuguese ? "pt" : "en");

    if (contextCombined.sintomas.length > 0) {
      sessionMemory.sintomasDetectados.push(...contextCombined.sintomas.filter(
        sint => !sessionMemory.sintomasDetectados.includes(sint)
      ));
    }

    sessionMemory.sintomaAtual = selecionarProximoSintoma();

    if (!sessionMemory.sintomaAtual) {
      const msg = isPortuguese
        ? "Já conversamos sobre todos os sintomas mencionados. Quer explorar algo novo?"
        : "We've already gone over all the symptoms you mentioned. Want to explore a new one?";
      return res.status(200).json({ choices: [{ message: { content: msg } }] });
    }

    const intro = hasFormData
      ? (isPortuguese ? generateIntroWithStats(userName, age, sex, weight) : generateIntroWithStatsEN(userName, age, sex, weight))
      : (isPortuguese
        ? "Sem seu nome, idade ou peso, posso te dar conselhos… tão úteis quanto ler a sorte no biscoito da sorte."
        : "Without your name, age, or weight, my advice will be as useful as reading your fortune in a cookie.");

    const alerta = isPortuguese ? gerarAvisoGravidadePT(contextCombined.gravidade) : gerarAvisoGravidadeEN(contextCombined.gravidade);

    const pergunta1 = contextCombined.pergunta1 || (isPortuguese ? "Você já sentiu isso se repetir ao longo da semana?" : "Have you noticed this happening repeatedly?");
    const pergunta2 = contextCombined.pergunta2 || (isPortuguese ? "Ignorar isso pode piorar, quer entender por quê?" : "Ignoring this could worsen it. Want to understand why?");
    const pergunta3 = contextCombined.pergunta3 || (isPortuguese ? "Quer saber qual suplemento poderia ajudar com isso?" : "Want to know which supplement could help?");

    sessionMemory.perguntasJaFeitas.push(sessionMemory.sintomaAtual);

    const prompt = isPortuguese
      ? `Você é OwlCoreHealth AI — assistente de saúde sarcástico e científico. Nome: "${userName}".
${intro}
${alerta}

Baseado no sintoma atual: "${sessionMemory.sintomaAtual}", aqui vai uma análise:

${contextCombined.base}

Here are 3 related questions:
1. ${pergunta1}
2. ${pergunta2}
3. ${pergunta3}

Ou quer fazer outra pergunta? 🦉`
      : `You are OwlCoreHealth AI — a brutally honest, science-based health assistant. User: "${userName}".
${intro}
${alerta}

Based on the current symptom: "${sessionMemory.sintomaAtual}", here's a breakdown:

${contextCombined.base}

Here are 3 related questions:
1. ${pergunta1}
2. ${pergunta2}
3. ${pergunta3}

Or do you have another question? 🦉`;

    const messages = [
      { role: "system", content: prompt },
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
      console.error("❌ OpenAI API error:", data);
      return res.status(500).json({ error: "Erro ao chamar a OpenAI", details: data });
    }

    if (!sessionMemory.sintomasProcessados.includes(sessionMemory.sintomaAtual)) {
      sessionMemory.sintomasProcessados.push(sessionMemory.sintomaAtual);
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Erro no servidor:", err);
    res.status(500).json({ error: "Erro interno no servidor", details: err.message });
  }
}
