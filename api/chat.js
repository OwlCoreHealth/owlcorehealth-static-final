import { getSymptomContext } from "./notion";

let sessionMemory = {
  sintomasDetectados: [],
  sintomasProcessados: [],
  sintomaAtual: null,
  respostasUsuario: [],
  nome: "",
  idioma: "pt"
};

function generateIntro(name, age, sex, weight, isPortuguese) {
  const sexoText = isPortuguese
    ? sex === "feminino" ? "mulheres" : "homens"
    : sex === "female" ? "women" : "men";

  const sintomas = isPortuguese
    ? [
        { stat: 28, desc: "relatam ansiedade constante" },
        { stat: 31, desc: "sofrem com digestão lenta" },
        { stat: 20, desc: "não usam qualquer suplemento" }
      ]
    : [
        { stat: 28, desc: "report constant anxiety" },
        { stat: 31, desc: "struggle with slow digestion" },
        { stat: 20, desc: "avoid any kind of supplementation" }
      ];

  const stats = sintomas.map(s => `${s.stat}% ${sexoText} com ${age} anos ${s.desc}`).join(", ");
  const statsEN = sintomas.map(s => `${s.stat}% of ${sexoText} aged ${age} ${s.desc}`).join(", ");

  return isPortuguese
    ? `${name}, existem milhares de pessoas com esse nome. Sabia que ${stats}? Coincidência ou padrão? Vamos descobrir.`
    : `${name}, did you know there are thousands of people with your name? Interestingly, ${statsEN}. Coincidence or pattern? Let's find out.`;
}

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

    const message = body.message?.trim() || "";
    const name = body.name?.trim() || "";
    const age = parseInt(body.age);
    const sex = (body.sex || "").toLowerCase();
    const weight = parseFloat(body.weight);

    const hasForm = name && !isNaN(age) && sex && !isNaN(weight);

    if (!message) return res.status(400).json({ error: "Mensagem não enviada." });

    const ptIndicators = [" você", "tenho", "saúde", "dor", "problema", "digestão"];
    const isPortuguese = ptIndicators.some(p => message.toLowerCase().includes(p)) || /[ãõçáéíóú]/i.test(message);

    sessionMemory.nome = name;
    sessionMemory.idioma = isPortuguese ? "pt" : "en";
    sessionMemory.respostasUsuario.push(message);

    const contextos = await getSymptomContext(message);
    const context = contextos?.[0];

    if (!context) {
      return res.status(200).json({
        choices: [{
          message: {
            content: isPortuguese
              ? "Não encontrei dados científicos para isso ainda. Quer tentar outro sintoma?"
              : "I couldn't find scientific data for this yet. Want to try another symptom?"
          }
        }]
      });
    }

    if (!sessionMemory.sintomasDetectados.includes(context.sintoma)) {
      sessionMemory.sintomasDetectados.push(context.sintoma);
    }

    const alerta = isPortuguese
      ? context.gravidade >= 4
        ? "⚠️ Esse sintoma merece atenção especial."
        : ""
      : context.gravidade >= 4
        ? "⚠️ This symptom requires extra attention."
        : "";

    const intro = hasForm
      ? generateIntro(name, age, sex, weight, isPortuguese)
      : (isPortuguese
          ? "Sem seu nome, idade ou peso, posso te dar conselhos… tão úteis quanto ler a sorte no biscoito da sorte."
          : "Without your info, my advice will be as helpful as reading a fortune cookie.");

    const base = isPortuguese ? context.base_pt : context.base_en;
    const pergunta1 = isPortuguese ? context.pergunta1_pt : context.pergunta1_en;
    const pergunta2 = isPortuguese ? context.pergunta2_pt : context.pergunta2_en;
    const pergunta3 = isPortuguese ? context.pergunta3_pt : context.pergunta3_en;

    const fullPrompt = `${intro}

${alerta}

${isPortuguese ? "Base científica:" : "Scientific insight:"}
${base}

${isPortuguese ? "Aqui vão 3 perguntas pra você pensar:" : "Here are 3 follow-up questions:"}
1. ${pergunta1}
2. ${pergunta2}
3. ${pergunta3}

${isPortuguese ? "Ou quer fazer outra pergunta?" : "Or do you have another question?"} 🦉`;

    const messages = [
      { role: "system", content: fullPrompt },
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
      console.error("GPT error:", data);
      return res.status(500).json({ error: "Erro ao chamar a OpenAI", details: data });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Erro interno:", err.message);
    return res.status(500).json({ error: "Erro interno do servidor", details: err.message });
  }
}
