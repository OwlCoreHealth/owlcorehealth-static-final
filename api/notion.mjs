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
console.log("Raw Database ID do .env:", rawDbId);

const databaseId = (rawDbId || "").replace(/['"]/g, "").trim();

// FORÇA LIMPEZA FINAL (garantido SEM ASPAS, SÓ UUID)
const databaseIdClean = (databaseId || "")
  .replace(/^["']+|["']+$/g, "")  // remove aspas duplas ou simples do início/fim
  .replace(/[^a-zA-Z0-9\-]/g, "") // só deixa letras, números, traço
  .trim();

console.log("Database ID FINAL para o Notion:", databaseIdClean);

// Só para mostrar CLARAMENTE o valor realmente usado
console.log("Database ID usado nas queries:", databaseIdClean);

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export async function getAllSymptoms() {
  try {
    
    console.log("Vai enviar ao Notion:", JSON.stringify(databaseIdClean), databaseIdClean.length);

const response = await notion.databases.query({
  database_id: databaseIdClean,
  page_size: 100
});
// LOGS PARA DEBUG VISUAL DO NOTION
response.results.forEach((page, i) => {
  console.log(`--- Linha #${i + 1} ---`);
  console.log("Symptoms:", JSON.stringify(page.properties["Symptoms"], null, 2));
  console.log("Funnel Awareness 1:", JSON.stringify(page.properties["Funnel Awareness 1"], null, 2));
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
  try {
    // 1. Busca só as linhas do banco relacionadas ao sintoma informado (filtro direto Notion)
    const sintomaInput = input.toLowerCase().trim();

    const response = await notion.databases.query({
      database_id: databaseIdClean,
      filter: {
        property: "Symptoms",
        multi_select: {
          contains: sintomaInput
        }
      },
      page_size: 10 // ou mais, se quiser trazer várias sugestões
    });

    // ...continua seu processamento normal daqui!

    // Função utilitária para pegar todo texto de um campo rich_text
function extractRichText(prop) {
  if (!prop || !Array.isArray(prop.rich_text)) return "";
  return prop.rich_text.map(rt => rt.plain_text || "").join(" ").trim();
}

// 2. Mapeia todas as linhas trazendo sintomas e conteúdos
const allRows = response.results.map(page => {
  console.log("DADOS DA PÁGINA:", page); // Log completo da página para visualização
  
  return {
    Supplement: page.properties.Supplement?.title?.[0]?.plain_text || "",
    Symptoms: page.properties.Symptoms?.multi_select?.map(opt => opt.name.toLowerCase()) || [],
    "Funnel Awareness 1": extractRichText(page.properties["Funnel Awareness 1"]),
    "Funnel Awareness 2": extractRichText(page.properties["Funnel Awareness 2"]),
    "Funnel Awareness 3": extractRichText(page.properties["Funnel Awareness 3"]),
    "Funnel Severity 1": extractRichText(page.properties["Funnel Severity 1"]),
    "Funnel Severity 2": extractRichText(page.properties["Funnel Severity 2"]),
    "Funnel Severity 3": extractRichText(page.properties["Funnel Severity 3"]),
    "Funnel Proof 1": extractRichText(page.properties["Funnel Proof 1"]),
    "Funnel Proof 2": extractRichText(page.properties["Funnel Proof 2"]),
    "Funnel Proof 3": extractRichText(page.properties["Funnel Proof 3"]),
    "Funnel Solution 1": extractRichText(page.properties["Funnel Solution 1"]),
    "Funnel Solution 2": extractRichText(page.properties["Funnel Solution 2"]),
    "Funnel Solution 3": extractRichText(page.properties["Funnel Solution 3"]),
    "Funnel Advanced 1": extractRichText(page.properties["Funnel Advanced 1"]),
    "Funnel Advanced 2": extractRichText(page.properties["Funnel Advanced 2"]),
    "Funnel Advanced 3": extractRichText(page.properties["Funnel Advanced 3"]),
    Links: extractRichText(page.properties["Links "]),
  };
});


    // LOGA TUDO DA PRIMEIRA LINHA DO NOTION
if (allRows.length > 0) {
  console.log("---- LOG PRIMEIRA LINHA ----");
  console.log("Symptoms:", allRows[0].Symptoms);
  console.log("Funnel Awareness 1:", allRows[0]["Funnel Awareness 1"]);
  console.log("Funnel Severity 1:", allRows[0]["Funnel Severity 1"]);
  // Adicione outros campos para debug conforme necessário
}

    // 3. Matching semântico ou exato (troque pelo seu findNearestSymptom se quiser!)
    // Exemplo simples: encontra a linha onde o sintoma existe (ignore case)
    const sintomaInput = input.toLowerCase().trim();
    const matchedRow = allRows.find(row =>
      row.Symptoms.some(s => sintomaInput.includes(s) || s.includes(sintomaInput))
    );

    if (!matchedRow) {
      // Não encontrou — fallback igual seu código antigo
      console.warn("❗️Nenhuma entrada encontrada no Notion para o input:", input);
      const fallbackCategory = await identifySymptomCategoryWithGPT(input);
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

// Busca mais robusta, cobre casos agrupados ou nomes variantes
const sintomasBuscados = matchedRow.Symptoms.map(s => s.toLowerCase().trim());
const originalPage = response.results.find(page => {
  const pageSymptoms = (page.properties?.Symptoms?.multi_select || []).map(opt => opt.name.toLowerCase().trim());
  // Se pelo menos UM sintoma bate
  return sintomasBuscados.some(s => pageSymptoms.includes(s));
});

    return {
      gptPromptData: {
        prompt: "You are OwlCoreHealth AI.",
        context: { selectedQuestion: null }
      },
      sintoma: matchedRow.Symptoms.join(", "),
      funnelPhase,
      language: "en",
      funnelTexts: {
        base: [
          matchedRow["Funnel Awareness 1"],
          matchedRow["Funnel Awareness 2"],
          matchedRow["Funnel Awareness 3"]
        ].filter(Boolean),
        gravidade: [
          matchedRow["Funnel Severity 1"],
          matchedRow["Funnel Severity 2"],
          matchedRow["Funnel Severity 3"]
        ].filter(Boolean),
        estatisticas: [
          matchedRow["Funnel Proof 1"],
          matchedRow["Funnel Proof 2"],
          matchedRow["Funnel Proof 3"]
        ].filter(Boolean),
        nutrientes: [
          matchedRow["Funnel Solution 1"],
          matchedRow["Funnel Solution 2"],
          matchedRow["Funnel Solution 3"]
        ].filter(Boolean),
        suplemento: [
          matchedRow["Funnel Advanced 1"],
          matchedRow["Funnel Advanced 2"],
          matchedRow["Funnel Advanced 3"]
        ].filter(Boolean),
        cta: [
          matchedRow["Links"]
        ].filter(Boolean)
      },
      followupQuestions: [],
      page: originalPage // <-- ESSA LINHA PERMITE USAR OS CAMPOS DINÂMICOS!
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
