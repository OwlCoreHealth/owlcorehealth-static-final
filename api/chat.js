import { getSymptomContext } from "./notion";

// === MEMÓRIA DE SESSÃO ===
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

// === FUNÇÕES AUXILIARES ===
function generateIntroWithStats(name, age, sex, weight) {
  const sexoText = sex === "feminino" ? "mulheres" : "homens";
  const stats = [
    { stat: 28, desc: "relatam ansiedade constante" },
    { stat: 31, desc: "sofrem com digestão lenta" },
    { stat: 20, desc: "não usam qualquer suplemento" }
  ];
  const line = stats.map(s => `${s.stat}% ${sexoText} com ${age} anos ${s.desc}`).join(", ");
  return `${name}, existem milhares de pessoas com esse nome. Sabia que ${line}? Coincidência ou padrão? Vamos descobrir.`;
}

function generateIntroWithStatsEN(name, age, sex, weight) {
  const sexoText = sex === "female" ? "women" : "men";
  const stats = [
    { stat: 28, desc: "report constant anxiety" },
    { stat: 31, desc: "struggle with slow digestion" },
    { stat: 20, desc: "avoid any supplementation" }
  ];
  const line = stats.map(s => `${s.stat}% of ${sexoText} aged ${age} ${s.desc}`).join(", ");
  return `${name}, did you know there are thousands of people with your name? Interestingly, ${line}. Coincidence or pattern? Let’s find out.`;
}

function gerarAvisoGravidadePT(gravidade) {
  if (gravidade >= 5) return "⚠️ Isso é sério. Você pode estar ignorando algo que exige atenção médica urgente.";
  if (gravidade === 4) return "⚠️ Esse sintoma merece atenção e cuidado. Vamos entender o porquê.";
  if (gravidade === 3) return "Esse sintoma não é tão leve quanto parece. Melhor investigarmos juntos.";
  return "";
}

function gerarAvisoGravidadeEN(gravidade) {
  if (gravidade >= 5) return "⚠️ This might be serious. It may need urgent medical attention.";
  if (gravidade === 4) return "⚠️ This symptom deserves real attention. Let’s understand why.";
  if (gravidade === 3) return "This might not be so mild. Let’s dive into it.";
  return "";
}

function combineContexts(contexts, lang) {
  const base = contexts.map(c => (lang === "pt" ? c.base_pt : c.base_en)).join(" ");
  const perguntas = contexts.slice(0, 3);
  return {
    base: base.trim(),
    pergunta1: lang === "pt" ? perguntas[0]?.pergunta1_pt : perguntas[0]?.pergunta1_en,
    pergunta2: lang === "pt" ? perguntas[1]?.pergunta2_pt : perguntas[1]?.pergunta2_en,
    pergunta3: lang === "pt" ? perguntas[2]?.pergunta3_pt : perguntas[2]?.pergunta3_en,
    sintomas: contexts.map(c => c.sintoma),
    gravidade: Math.max(...contexts.map(c => c.gravidade || 1)),
    suplemento: contexts[0]?.suplemento || "",
    link: contexts[0]?.url || "",
    chamada: lang === "pt" ? contexts[0]?.link_pt : contexts[0]?.link_en
  };
}

function selecionarProximoSintoma() {
  const naoProcessados = sessionMemory.sintomasDetectados.filter(
    sint => !sessionMemory.sintomasProcessados.includes(sint)
  );
  return naoProcessados.length > 0 ? naoProcessados[0] : null;
}

// === HANDLER PRINCIPAL ===
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Use POST." });
    }

    const buffers = [];
    for await (const chunk of req) buffers.push(chunk);
    const body = JSON.parse(Buffer.concat(buffers).toString());

    const message = (body.message || "").toString().trim();
    const userName = (body.name || "").toString().trim();
    const age = parseInt(body.age);
    const sex = (body.sex || "").toString().trim().toLowerCase();
    const weight = parseFloat(body.weight);

    const hasFormData = userName && !isNaN(age) && sex && !isNaN(weight);
    if (!message) return res.status(400).json({ error: "Mensagem vazia." });

    const isPortuguese = /[ãõçáéíóúâêôà]/i.test(message) || [' você ', ' saúde ', ' problema ', ' estou '].some(w => message.toLowerCase().includes(w));
    sessionMemory.nome = userName;
    sessionMemory.idioma = isPortuguese ? "pt" : "en";
    sessionMemory.respostasUsuario.push(message);

    const contextos = await getSymptomContext(message);
    const contexto = combineContexts(contextos, isPortuguese ? "pt" : "en");

    if (contexto.sintomas.length > 0) {
      sessionMemory.sintomasDetectados.push(...contexto.sintomas.filter(s => !sessionMemory.sintomasDetectados.includes(s)));
    }

    sessionMemory.sintomaAtual = selecionarProximoSintoma();

    if (!sessionMemory.sintomaAtual) {
      const msg = isPortuguese
        ? "Já falamos sobre todos os sintomas detectados. Quer perguntar outra coisa?"
        : "We've already discussed all detected symptoms. Want to ask something else?";
      return res.status(200).json({ choices: [{ message: { content: msg } }] });
    }

    const intro = hasFormData
      ? (isPortuguese
          ? generateIntroWithStats(userName, age, sex, weight)
          : generateIntroWithStatsEN(userName, age, sex, weight))
      : (isPortuguese
          ? "Sem seu nome, idade ou peso, posso te dar conselhos… tão úteis quanto ler a sorte no biscoito da sorte."
          : "Without your name, age, or weight, my advice is as useful as reading fortune cookies.");

    const alerta = isPortuguese
      ? gerarAvisoGravidadePT(contexto.gravidade)
      : gerarAvisoGravidadeEN(contexto.gravidade);

    const pergunta1 = contexto.pergunta1 || (isPortuguese ? "Você já sentiu isso antes?" : "Have you felt this before?");
    const pergunta2 = contexto.pergunta2 || (isPortuguese ? "Ignorar isso pode piorar. Quer saber como?" : "Ignoring this could get worse. Want to know why?");
    const pergunta3 = contexto.pergunta3 || (isPortuguese ? "Quer saber qual suplemento pode ajudar?" : "Want to know which supplement could help?");

    sessionMemory.perguntasJaFeitas.push(sessionMemory.sintomaAtual);

    const finalPrompt = isPortuguese
      ? `Você é OwlCoreHealth AI, assistente de saúde provocador e direto. Usuário: "${userName}".\n${intro}\n${alerta}\n\nBaseado no sintoma: "${sessionMemory.sintomaAtual}", aqui vai:\n${contexto.base}\n\nHere are 3 related questions:\n1. ${pergunta1}\n2. ${pergunta2}\n3. ${pergunta3}\n\nOu quer fazer outra pergunta? 🦉`
      : `You are OwlCoreHealth AI, a savage virtual health assistant. User: "${userName}".\n${intro}\n${alerta}\n\nBased on the symptom: "${sessionMemory.sintomaAtual}", here’s a breakdown:\n${contexto.base}\n\nHere are 3 related questions:\n1. ${pergunta1}\n2. ${pergunta2}\n3. ${pergunta3}\n\nOr do you have another question? 🦉`;

    const messages = [
      { role: "system", content: finalPrompt },
      { role: "user", content: message }
    ];

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o", // usar gpt-4o otimizado
        messages,
        temperature: 0.7
      })
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      console.error("❌ GPT error:", data);
      return res.status(500).json({ error: "GPT error", details: data });
    }

    if (!sessionMemory.sintomasProcessados.includes(sessionMemory.sintomaAtual)) {
      sessionMemory.sintomasProcessados.push(sessionMemory.sintomaAtual);
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Erro interno:", err);
    res.status(500).json({ error: "Erro interno", details: err.message });
  }
}
