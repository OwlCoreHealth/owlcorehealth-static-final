import dotenv from "dotenv";
dotenv.config();

import { Client } from "@notionhq/client";

// Função utilitária para extrair texto da propriedade Notion
function getTextFromProperty(prop) {
  if (!prop) return "";
  if (prop.text) return prop.text.map(t => t.plain_text).join(" ");
  if (prop.rich_text) return prop.rich_text.map(t => t.plain_text).join(" ");
  if (prop.title) return prop.title.map(t => t.plain_text).join(" ");
  return "";
}

console.log("NOTION_DATABASE_ID bruto:", process.env.NOTION_DATABASE_ID); // Debug simples

const rawDbId = process.env.NOTION_DATABASE_ID;
console.log(
  "Raw Database ID chars (hex):",
  [...rawDbId].map(c => c.charCodeAt(0).toString(16)).join(" ")
);

const databaseId = (rawDbId || "").replace(/['"]/g, "").trim();
console.log("Database ID usado:", databaseId);

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export async function getAllSymptoms() {
  try {
    console.log("Database ID exato enviado ao Notion:", JSON.stringify(databaseId));
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 100
    });

    // Debug da estrutura da propriedade Symptoms na primeira página
    if (response.results.length > 0) {
      console.log("Exemplo estrutura Symptoms da primeira página:", JSON.stringify(response.results[0].properties.Symptoms, null, 2));
    }

    const symptoms = response.results.map(page => {
      const symptomText = getTextFromProperty(page.properties.Symptoms);
      return symptomText ? symptomText.toLowerCase().trim() : null;
    }).filter(Boolean);

    return symptoms;
  } catch (error) {
    console.error("Erro ao buscar lista de sintomas do Notion:", error);
    return [];
  }
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GPT_MODEL = "gpt-4o-mini";

export async function getSymptomContext(input, funnelPhase, previousSymptom, usedQuestions) {
  const filtro = {
    or: [
      { property: "Keywords", text: { contains: input } },
      { property: "Symptoms", text: { contains: input } }
    ]
  };

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: filtro
    });

    const page = response.results[0];

    if (!page) {
      console.warn("❗️Nenhuma entrada encontrada no Notion para o input:", input);

      // 🧠 Fallback: Pedir ao GPT uma categoria sintomática aproximada
      const fallbackCategory = await identifySymptomCategoryWithGPT(input);

      // Mapeamento manual de categorias sintomáticas
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
      const raw = page.properties[field]?.text?.[0]?.plain_text || ""; 
      return raw.split("||").map(t => t.trim()).filter(Boolean);
    };

    const symptomsContent = page.properties?.Symptoms?.text?.[0]?.plain_text || previousSymptom;

    return {
  gptPromptData: {
    prompt: "You are OwlCoreHealth AI.",
    context: { selectedQuestion: null }
  },
  sintoma: symptomsContent,
  funnelPhase,
  language: "en",
  funnelTexts: {
    base: [
      page.properties["Funnel Awareness 1"]?.text?.[0]?.plain_text || "",
      page.properties["Funnel Awareness 2"]?.text?.[0]?.plain_text || "",
      page.properties["Funnel Awareness 3"]?.text?.[0]?.plain_text || ""
    ].filter(Boolean),
    gravidade: [
      page.properties["Funnel Severity 1"]?.text?.[0]?.plain_text || "",
      page.properties["Funnel Severity 2"]?.text?.[0]?.plain_text || "",
      page.properties["Funnel Severity 3"]?.text?.[0]?.plain_text || ""
    ].filter(Boolean),
    estatisticas: [
      page.properties["Funnel Proof 1"]?.text?.[0]?.plain_text || "",
      page.properties["Funnel Proof 2"]?.text?.[0]?.plain_text || "",
      page.properties["Funnel Proof 3"]?.text?.[0]?.plain_text || ""
    ].filter(Boolean),
    nutrientes: [
      page.properties["Funnel Solution 1"]?.text?.[0]?.plain_text || "",
      page.properties["Funnel Solution 2"]?.text?.[0]?.plain_text || "",
      page.properties["Funnel Solution 3"]?.text?.[0]?.plain_text || ""
    ].filter(Boolean),
    suplemento: [
      page.properties["Funnel Advanced 1"]?.text?.[0]?.plain_text || "",
      page.properties["Funnel Advanced 2"]?.text?.[0]?.plain_text || "",
      page.properties["Funnel Advanced 3"]?.text?.[0]?.plain_text || ""
    ].filter(Boolean),
    cta: [
      page.properties["Links"]?.text?.[0]?.plain_text || ""
    ].filter(Boolean)
  },
  followupQuestions: []
};

  } catch (error) {
    console.error("Erro ao buscar contexto do sintoma no Notion:", error);
    return {
      gptPromptData: {
        prompt: "You are OwlCoreHealth AI.",
        context: { selectedQuestion: null }
      },
      sintoma: input,
      funnelPhase,
      language: "en",
      funnelTexts: {},
      followupQuestions: []
    };
  }
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
    return "gut";
  }
}
