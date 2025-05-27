import { Client } from "@notionhq/client";

// Função auxiliar para detectar idioma
function detectLanguage(message) {
  const ptMatch = /[ãõçáéíóú]| você|dor|tenho|problema|saúde/i.test(message);
  return ptMatch ? "pt" : "en";
}

const notion = new Client({
  auth: "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"
});

const databaseId = "1fda050ee113804aa5e9dd1b01e31066";

export async function getSymptomContext(message, name = "", age = 0, weight = 0, funnelPhase = 1, previousSymptom = null, usedQuestions = []) {
  try {
    const language = detectLanguage(message);

    const keywords = message.toLowerCase().split(/[^a-zA-Z0-9]+/).filter(k => k.length > 3);

    const filter = {
      or: keywords.slice(0, 8).map(k => ({
        property: "Keywords",
        rich_text: {
          contains: k
        }
      }))
    };

    const query = await notion.databases.query({
      database_id: databaseId,
      filter
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
          prompt: `Você é o OwlCoreHealth AI. O usuário relatou: ${message}. Fase do funil: ${funnelPhase}. Idioma: ${language}`,
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
    }

    const page = query.results[0];
    const props = page.properties;

    const sintoma = props["Symptom"]?.title?.[0]?.plain_text || "unknown";

    const funnelContent = {};
    for (let i = 1; i <= 6; i++) {
      funnelContent[`funnel${i}`] = [];
      for (let j = 1; j <= 3; j++) {
        const key = `Funnel ${i} Variation ${j}`;
        const val = props[key]?.rich_text?.[0]?.plain_text;
        if (val) funnelContent[`funnel${i}`].push(val);
      }
    }

    const followupQuestions = [];
    for (let i = 1; i <= 5; i++) {
      for (let j = 1; j <= 3; j++) {
        const key = `Symptom ${i} Variation ${j}`;
        const val = props[key]?.rich_text?.[0]?.plain_text;
        if (val) followupQuestions.push(val);
      }
    }

    const gravity = [];
    for (let i = 1; i <= 5; i++) {
      const key = `Gravity ${i}`;
      const val = props[key]?.rich_text?.[0]?.plain_text;
      if (val) gravity.push(val);
    }

    const linkText = props["Links"]?.rich_text?.[0]?.plain_text || "";
    const linkParts = linkText.split("click here");
    const links = {
      review: linkParts[0]?.split("Review")?.[1]?.trim() || "",
      video: linkParts[2]?.trim() || "",
      product: linkParts[1]?.split("Product")?.[1]?.trim() || ""
    };

    const prompt = `Você é o OwlCoreHealth AI. O usuário relatou: ${message}. Fase do funil: ${funnelPhase}. Idioma: ${language}`;

    return {
      sintoma,
      language,
      funnelContent,
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
        prompt: `Você é o OwlCoreHealth AI. O usuário relatou: ${message}. Fase do funil: ${funnelPhase}. Idioma: ${language}`,
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
  }
}
