// ✅ notion.mjs - robusto, com fallback e filtro por palavras-chave
import { Client } from "@notionhq/client";

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

    const keywords = message
      .toLowerCase()
      .split(/[^a-zA-ZÀ-ÿ]+/)
      .filter(w => w.length > 3);

    const filter = {
      or: keywords.map(word => ({
        property: "Keywords",
        rich_text: {
          contains: word
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
        funnelContent: {
          funnel1: [
            language === "pt"
              ? "Você mencionou algo que parece relacionado à digestão ou desconforto abdominal. Mesmo que não esteja exatamente na nossa base, posso te explicar o que isso pode significar e como resolver."
              : "You mentioned something that seems related to digestion or abdominal discomfort. Even if it's not exactly in our database, I can explain what this might mean and how to address it."
          ]
        },
        followupQuestions: [
          language === "pt" ? "Quer saber se isso pode piorar?" : "Want to know if this could get worse?",
          language === "pt" ? "Posso te explicar as causas mais comuns?" : "Can I explain the most common causes?",
          language === "pt" ? "Deseja saber o que fazer agora?" : "Want to know what to do next?"
        ],
        gravity: [],
        links: {},
        gptPromptData: {
          prompt: `Você é o OwlCoreHealth AI. O usuário relatou: ${message}. O sintoma exato não foi encontrado na base, mas ele parece relacionado a digestão. Fase: ${funnelPhase}.`,
          context: {
            userName: name || "amigo",
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
      funnelContent[`funnel${i}`] = varKeys.map(k => props[k]?.rich_text?.[0]?.plain_text || null).filter(Boolean);
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

    const prompt = `Você é o OwlCoreHealth AI. O usuário relatou: ${message}. Sintoma detectado: ${sintoma}. Fase do funil: ${funnelPhase}. Idioma: ${language}`;

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
          userName: name || "amigo",
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
          userName: name || "amigo",
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
