// notion.mjs (adaptado para colunas em inglês)
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
if (!page) {
  console.warn("❗️Nenhuma entrada encontrada no Notion para o input:", input);
  return {};
}
console.log("🧪 Todas as propriedades disponíveis:", page.properties);

  if (!page) return {};

  const getTexts = (field) => {
    const raw = page.properties[field]?.rich_text?.[0]?.plain_text || "";
    return raw.split("||").map(t => t.trim()).filter(Boolean);
  };

  return {
    gptPromptData: {
      prompt: "You are OwlCoreHealth AI.",
      context: {
        selectedQuestion: null,
        name,
        age,
        weight
      }
    },
    sintoma: page.properties?.Symptoms?.rich_text?.[0]?.plain_text || previousSymptom,
    funnelPhase,
    language: "en",
    funnelTexts: {
      base: [
        page.properties["Funnel 1 Variation 1"]?.rich_text?.[0]?.plain_text || "",
        page.properties["Funnel 1 Variation 2"]?.rich_text?.[0]?.plain_text || "",
        page.properties["Funnel 1 Variation 3"]?.rich_text?.[0]?.plain_text || ""
      ].filter(Boolean),
      gravidade: [
        page.properties["Funnel 2 Variation 1"]?.rich_text?.[0]?.plain_text || "",
        page.properties["Funnel 2 Variation 2"]?.rich_text?.[0]?.plain_text || "",
        page.properties["Funnel 2 Variation 3"]?.rich_text?.[0]?.plain_text || ""
      ].filter(Boolean),
      estatisticas: [
        page.properties["Funnel 3 Variation 1"]?.rich_text?.[0]?.plain_text || "",
        page.properties["Funnel 3 Variation 2"]?.rich_text?.[0]?.plain_text || "",
        page.properties["Funnel 3 Variation 3"]?.rich_text?.[0]?.plain_text || ""
      ].filter(Boolean),
      nutrientes: [
        page.properties["Funnel 4 Variation 1"]?.rich_text?.[0]?.plain_text || "",
        page.properties["Funnel 4 Variation 2"]?.rich_text?.[0]?.plain_text || "",
        page.properties["Funnel 4 Variation 3"]?.rich_text?.[0]?.plain_text || ""
      ].filter(Boolean),
      suplemento: [
        page.properties["Funnel 5 Variation 1"]?.rich_text?.[0]?.plain_text || "",
        page.properties["Funnel 5 Variation 2"]?.rich_text?.[0]?.plain_text || "",
        page.properties["Funnel 5 Variation 3"]?.rich_text?.[0]?.plain_text || ""
      ].filter(Boolean),
      cta: [
        page.properties["Links"]?.rich_text?.[0]?.plain_text || ""
      ].filter(Boolean)
    },
    followupQuestions: []
  };
}
