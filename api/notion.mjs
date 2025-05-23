import { Client } from "@notionhq/client";

// 🟢 Sua chave de integração do Notion
const notion = new Client({ auth: "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" });

// 🟢 ID da sua base de dados
const databaseId = "1faa050ee113805e8f1bd34a11ce013f";

// 🔍 Consulta a base do Notion por palavra-chave na coluna "Palavras-chave"
async function getSymptomContext(userMessage) {
  console.log("🚀 Iniciando consulta com:", userMessage);

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "Palavras-chave",
        rich_text: {
          contains: userMessage.toLowerCase()
        }
      }
    });

    console.log("📥 Resultados encontrados:", response.results.length);

    if (!response.results.length) {
      console.log("⚠️ Nenhum resultado encontrado para:", userMessage);
      return;
    }

    const page = response.results[0];
    const p = page.properties;

    const resultado = {
      sintoma: p["Sintoma / Questão"]?.title?.[0]?.plain_text || "",
      categoria: p["Categoria"]?.select?.name || "",
      risco_pt: p["Riscos Relacionados PT"]?.rich_text?.[0]?.plain_text || "",
      risco_en: p["Riscos Relacionados EN"]?.rich_text?.[0]?.plain_text || "",
      pergunta1_pt: p["Pergunta 1 PT (Curiosidade)"]?.rich_text?.[0]?.plain_text || "",
      pergunta2_pt: p["Pergunta 2 PT (Preocupação)"]?.rich_text?.[0]?.plain_text || "",
      pergunta3_pt: p["Pergunta 3 PT (Solução)"]?.rich_text?.[0]?.plain_text || "",
      pergunta1_en: p["Pergunta 1 EN (Curiosity)"]?.rich_text?.[0]?.plain_text || "",
      pergunta2_en: p["Pergunta 2 EN (Concern)"]?.rich_text?.[0]?.plain_text || "",
      pergunta3_en: p["Pergunta 3 EN (Solution)"]?.rich_text?.[0]?.plain_text || "",
      suplemento: p["Suplemento Relacionado"]?.select?.name || "",
      base_pt: p["Resposta Científica Base PT"]?.rich_text?.[0]?.plain_text || "",
      base_en: p["Resposta Científica Base EN"]?.rich_text?.[0]?.plain_text || "",
      link_pt: p["Chamada do Link PT"]?.rich_text?.[0]?.plain_text || "",
      link_en: p["Chamada do Link EN"]?.rich_text?.[0]?.plain_text || "",
      url: p["Link do Review"]?.url || ""
    };

    console.log("✅ Resultado da consulta ao Notion:");
    console.log(JSON.stringify(resultado, null, 2));

  } catch (error) {
    console.error("❌ Erro ao consultar o Notion:", error.message);
  }
}

const userMessage = "inchaço abdominal";

getSymptomContext(userMessage).then(response => {
  console.log("🔎 Dados retornados:", response); // <- Novo log
  if (!response || response.length === 0) {
    console.log("⚠️ Nenhum resultado encontrado para:", userMessage);
  } else {
    console.log("✅ Resultado da consulta ao Notion:", response);
  }
}).catch(error => {
  console.error("❌ Erro ao consultar o Notion:", error);
});
