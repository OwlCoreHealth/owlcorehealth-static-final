import { Client } from "@notionhq/client";

// ✅ Autenticação com a chave da API
const notion = new Client({ auth: "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" });

// ✅ ID da base de dados Notion
const databaseId = "1faa050ee113805e8f1bd34a11ce013f";

// ✅ Função para extrair palavras-chave da mensagem
function extractKeywords(text) {
  const stopwords = ["de", "do", "da", "com", "sem", "tenho", "estou", "e", "a", "o", "as", "os", "na", "no"];
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
    .split(/\W+/)
    .filter(word => word.length > 3 && !stopwords.includes(word));
}

// ✅ Função de consulta ao Notion
export async function getSymptomContext(userMessage) {
  try {
    const keywords = extractKeywords(userMessage);
    if (!keywords.length) return [];

    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        or: keywords.map(word => ({
          property: "Palavras-chave",
          rich_text: {
            contains: word
          }
        }))
      }
    });

    if (!response.results.length) return [];

    return response.results.map(page => {
      const p = page.properties;
      return {
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
        url: p["Link do Review"]?.url || "",
        gravidade: Number(p["Gravidade"]?.number || 1)
      };
    });

  } catch (error) {
    console.error("❌ Erro ao consultar o Notion:", error);
    return [];
  }
}

// 🔁 Teste local (você pode mudar a mensagem para outros sintomas)
const userMessage = "inchaço abdominal";
getSymptomContext(userMessage).then(response => {
  console.log("🔎 Dados retornados:", response);
  if (!response || response.length === 0) {
    console.log("⚠️ Nenhum resultado encontrado para:", userMessage);
  } else {
    console.log("✅ Resultado da consulta ao Notion:", response);
  }
});
