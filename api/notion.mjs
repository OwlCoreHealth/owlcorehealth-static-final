import { Client } from "@notionhq/client";

// ✅ Substitua por sua chave de API do Notion
const notion = new Client({ auth: "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" });
const databaseId = "1faa050ee113805e8f1bd34a11ce013f";

// 🔍 Função que consulta a base do Notion com base na mensagem do usuário
async function getSymptomContext(userMessage) {
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

    console.log("✅ Resultado da consulta ao Notion:", resultado);

  } catch (error) {
    console.error("❌ Erro ao consultar o Notion:", error.message);
  }
}

// 🔁 Executar consulta com uma mensagem de exemplo
const userMessage = "inchaço";
getSymptomContext(userMessage);
