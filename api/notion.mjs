// notion.mjs (versão ajustada para entregar funnelTexts por fase)
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

export async function getSymptomContext(input, name, age, weight, funnelPhase, previousSymptom, usedQuestions) {
  const filtro = {
    or: [
      {
        property: "Keywords",
        rich_text: { contains: input }
      },
      {
        property: "Symptoms",
        rich_text: { contains: input }
      }
    ]
  };

  const response = await notion.databases.query({
    database_id: databaseId,
    filter: filtro
  });

  const page = response.results[0];

  if (!page) return {};

  const getTexts = (field) => {
    const raw = page.properties[field]?.rich_text?.[0]?.plain_text || "";
    return raw.split("||").map(t => t.trim()).filter(Boolean);
  };

  return {
    gptPromptData: {
      prompt: page.properties?.Prompt?.rich_text?.[0]?.plain_text || "",
      context: {
        selectedQuestion: null,
        name,
        age,
        weight
      }
    },
    sintoma: page.properties?.Symptoms?.rich_text?.[0]?.plain_text || previousSymptom,
    funnelPhase,
    language: page.properties?.Idioma?.select?.name?.toLowerCase() || "en",
    funnelTexts: {
      base: getTexts("base_pt"),
      gravidade: getTexts("gravidade_pt"),
      estatisticas: getTexts("estatisticas_pt"),
      nutrientes: getTexts("nutrientes_pt"),
      suplemento: getTexts("suplemento_pt"),
      cta: getTexts("cta_pt")
    },
    followupQuestions: getTexts("perguntas_finais")
  };
}
