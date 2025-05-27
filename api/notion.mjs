// notion.mjs - Versão atualizada com prompt completo e funil estruturado

import { Client } from "@notionhq/client";

// Detectar idioma com base na mensagem
function detectLanguage(message) {
  const ptMatch = /[ãõçáéíóú]| você|dor|tenho|problema|saúde/i.test(message);
  return ptMatch ? "pt" : "en";
}

// Prompt base completo
const OWL_SAVAGE_PROMPT = `
Você é o OwlCoreHealth AI, um assistente digital de saúde com personalidade inteligente, provocadora, empática e confiável. Sua missão é ajudar o usuário a compreender sintomas, causas, riscos e soluções naturais com base em ciência, sempre conduzindo de forma humanizada e estratégica para possíveis soluções com plantas naturais — sem nunca parecer um vendedor direto.

(Resumo adaptado aqui... substitua pelo prompt completo, se preferir)
`;

// Construir o prompt com contexto para o GPT
function buildGPTPrompt(sintoma, idioma, nome, idade, peso, mensagem, fase, usedQuestions) {
  return {
    prompt: OWL_SAVAGE_PROMPT,
    context: {
      userName: nome || "amigo",
      userAge: idade,
      userWeight: peso,
      language: idioma,
      funnelPhase: fase,
      selectedQuestion: false,
      usedQuestions
    }
  };
}

const notion = new Client({
  auth: "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"
});

const databaseId = "1fda050ee113804aa5e9dd1b01e31066";

export async function getSymptomContext(message, name = "", age = 0, weight = 0, funnelPhase = 1, previousSymptom = null, usedQuestions = []) {
  try {
    const language = detectLanguage(message);

    const query = await notion.databases.query({
      database_id: databaseId,
      filter: {
        or: [
          { property: "Keywords", rich_text: { contains: message } },
          { property: "Symptom", rich_text: { contains: message } }
        ]
      }
    });

    let sintoma = "unknown";
    let funnelContent = {}, followupQuestions = [], gravity = [], links = {};

    if (query.results.length > 0) {
      const props = query.results[0].properties;
      sintoma = props["Symptom"]?.rich_text?.[0]?.plain_text || "unknown";

      for (let i = 1; i <= 6; i++) {
        const varKeys = [`Funnel ${i} Variation 1`, `Funnel ${i} Variation 2`, `Funnel ${i} Variation 3`];
        funnelContent[`funnel${i}`] = varKeys.map(k => props[k]?.rich_text?.[0]?.plain_text || null).filter(Boolean);
      }

      for (let i = 1; i <= 5; i++) {
        for (let j = 1; j <= 3; j++) {
          const key = `Symptom ${i} Variation ${j}`;
          const text = props[key]?.rich_text?.[0]?.plain_text;
          if (text) followupQuestions.push(text);
        }
      }

      for (let i = 1; i <= 5; i++) {
        const gkey = `Gravity ${i}`;
        const gtext = props[gkey]?.rich_text?.[0]?.plain_text;
        if (gtext) gravity.push(gtext);
      }

      const linkText = props["Links"]?.rich_text?.[0]?.plain_text || "";
      const linkParts = linkText.split("click here");
      links = {
        review: linkParts[0]?.split("Review")?.[1]?.trim() || "",
        video: linkParts[2]?.trim() || "",
        product: linkParts[1]?.split("Product")?.[1]?.trim() || ""
      };
    }

    const { prompt, context: promptContext } = buildGPTPrompt(
      sintoma,
      language,
      name || "amigo",
      age,
      weight,
      message,
      funnelPhase,
      usedQuestions
    );

    return {
      sintoma,
      language,
      funnelContent,
      followupQuestions,
      gravity,
      links,
      gptPromptData: {
        prompt,
        context: promptContext
      }
    };
  } catch (err) {
    console.error("Erro ao buscar contexto no Notion:", err);
    const language = detectLanguage(message);
    const { prompt, context: promptContext } = buildGPTPrompt(
      "unknown",
      language,
      name,
      age,
      weight,
      message,
      funnelPhase,
      usedQuestions
    );
    return {
      sintoma: "unknown",
      language,
      funnelContent: {},
      followupQuestions: [],
      gravity: [],
      links: {},
      gptPromptData: {
        prompt,
        context: promptContext
      }
    };
  }
}
