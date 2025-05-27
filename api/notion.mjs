// notion.mjs - Atualizado com prompt dinâmico limpo e suporte total ao funil

import { Client } from "@notionhq/client";

const notion = new Client({
  auth: "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"
});

const databaseId = "1fda050ee113804aa5e9dd1b01e31066";

function detectLanguage(message) {
  const ptMatch = /[\u00e3\u00f5\u00e7áéíóú]| você|dor|tenho|problema|saúde/i.test(message);
  return ptMatch ? "pt" : "en";
}

export async function getSymptomContext(message, name = "", age = 0, weight = 0, funnelPhase = 1, previousSymptom = null, usedQuestions = []) {
  try {
    const language = detectLanguage(message);

    const query = await notion.databases.query({
      database_id: databaseId,
      filter: {
        or: [
          {
            property: "Keywords",
            rich_text: { contains: message }
          },
          {
            property: "Symptom",
            rich_text: { contains: message }
          }
        ]
      }
    });

    if (!query.results.length) {
      return {
        sintoma: "unknown",
        language,
        funnelContent: {},
        followupQuestions: [],
        gravity: [],
        links: {},
        gptPromptData: {
          prompt: "",
          context: {
            userName: name,
            userAge: age,
            userWeight: weight,
            language,
            funnelPhase,
            selectedQuestion: false
          }
        }
      };
    }

    const page = query.results[0];
    const props = page.properties;
    const sintoma = props["Symptom"]?.rich_text?.[0]?.plain_text || "unknown";

    const funnelContent = {};
    for (let i = 1; i <= 6; i++) {
      const varKeys = [`Funnel ${i} Variation 1`, `Funnel ${i} Variation 2`, `Funnel ${i} Variation 3`];
      funnelContent[`funnel${i}`] = varKeys
        .map(k => props[k]?.rich_text?.[0]?.plain_text || null)
        .filter(Boolean);
    }

    const followupQuestions = [];
    for (let i = 1; i <= 5; i++) {
      for (let j = 1; j <= 3; j++) {
        const key = `Symptom ${i} Variation ${j}`;
        const text = props[key]?.rich_text?.[0]?.plain_text;
        if (text) followupQuestions.push(text);
      }
    }

    const gravity = [];
    for (let i = 1; i <= 5; i++) {
      const gkey = `Gravity ${i}`;
      const gtext = props[gkey]?.rich_text?.[0]?.plain_text;
      if (gtext) gravity.push(gtext);
    }

    const linkText = props["Links"]?.rich_text?.[0]?.plain_text || "";
    const linkParts = linkText.split("click here");
    const links = {
      review: linkParts[0]?.split("Review")?.[1]?.trim() || "",
      video: linkParts[2]?.trim() || "",
      product: linkParts[1]?.split("Product")?.[1]?.trim() || ""
    };

    const available = funnelContent[`funnel${funnelPhase}`] || [];
    const selectedContent = available[Math.floor(Math.random() * available.length)] || "";

    const prompt = `OwlCoreHealth AI responde na fase ${funnelPhase} do funil. Sintoma detectado: ${sintoma}. Mensagem original: \"${message}\".`;

    return {
      sintoma,
      language,
      funnelContent: selectedContent ? { current: selectedContent } : {},
      followupQuestions,
      gravity,
      links,
      gptPromptData: {
        prompt,
        context: {
          userName: name || (language === "pt" ? "amigo" : "friend"),
          userAge: age,
          userWeight: weight,
          language,
          funnelPhase,
          selectedQuestion: false
        }
      }
    };
  } catch (err) {
    console.error("Erro ao buscar contexto no Notion:", err);
    const language = detectLanguage(message);
    return {
      sintoma: "unknown",
      language,
      funnelContent: {},
      followupQuestions: [],
      gravity: [],
      links: {},
      gptPromptData: {
        prompt: "",
        context: {
          userName: name,
          userAge: age,
          userWeight: weight,
          language,
          funnelPhase,
          selectedQuestion: false
        }
      }
    };
  }
}
