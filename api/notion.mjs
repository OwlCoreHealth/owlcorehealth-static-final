// notion.mjs (com fallback GPT se o Notion não encontrar)
import { Client } from "@notionhq/client";
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GPT_MODEL = "gpt-4o-mini";

export async function getSymptomContext(input, funnelPhase, previousSymptom, usedQuestions) {
  const filtro = {
    or: [
      { property: "Keywords", rich_text: { contains: input } },
      { property: "Symptoms", rich_text: { contains: input } }
    ]
  };

  const response = await notion.databases.query({
    database_id: databaseId,
    filter: filtro
  });

  const page = response.results[0];

  if (!page) {
    console.warn("❗️Nenhuma entrada encontrada no Notion para o input:", input);

    // 🧠 Fallback: pedir ao GPT uma categoria sintomática aproximada
    const fallbackCategory = await identifySymptomCategoryWithGPT(input);

    // Aqui você pode mapear manualmente as respostas do GPT para categorias conhecidas
    const categoryMap = {
      gut: "bloating and skin irritation",
      metabolism: "belly fat and fatigue",
      oral: "bad breath and gum problems",
      brain: "brain fog and anxiety",
      immunity: "low immunity and sugar imbalance"
    };

    const fallbackSymptom = categoryMap[fallbackCategory] || "general inflammation";

    return {
  gptPromptData: {
    prompt: "You are OwlCoreHealth AI.",
    context: { selectedQuestion: null }
  },
  sintoma: fallbackSymptom,
  funnelPhase,
  language: "en",
  funnelTexts: {},
  followupQuestions: []
};
  }

  const getTexts = (field) => {
    const raw = page.properties[field]?.rich_text?.[0]?.plain_text || "";
    return raw.split("||").map(t => t.trim()).filter(Boolean);
  };

  return {
    gptPromptData: {
      prompt: "You are OwlCoreHealth AI.",
      context: { selectedQuestion: null }
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

async function identifySymptomCategoryWithGPT(input) {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: GPT_MODEL,
        messages: [
          { role: "system", content: "Você classifica sintomas em 5 grupos fixos: gut, metabolism, oral, brain, immunity. Dado um sintoma livre, responda apenas com o nome do grupo mais compatível." },
          { role: "user", content: input }
        ],
        temperature: 0,
        max_tokens: 10
      })
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim().toLowerCase();
  } catch (e) {
    console.warn("⚠️ Erro no fallback GPT:", e);
    return "gut"; // fallback padrão seguro
  }
}
