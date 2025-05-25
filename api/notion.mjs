console.log("🟢 ESTE É O ARQUIVO notion.mjs SENDO EXECUTADO");

import { Client } from "@notionhq/client";

// ✅ Autenticação com chave direta (teste)
const notion = new Client({
  auth: "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"
});

// Definir o ID do banco de dados do Notion
const databaseId = "1fda050ee113804aa5e9dd1b01e31066"; // Substitua com o seu ID real

// Função de extração de palavras-chave
function extractKeywords(text) {
  const stopwords = [
    "the", "and", "for", "with", "from", "that", "this", "you", "your", "in", "to", "is", "it", "on", "a", "of", "as", "at", "by", "be", "are", "have", "was", "were", "not", "but", "or", "an", "we", "they", "he", "she", "it", "I"
  ];

  return text
    .toLowerCase() // Converte para minúsculas
    .split(/\W+/) // Divide o texto por não-palavras (como espaços, pontuação)
    .filter(word => word.length > 3 && !stopwords.includes(word) && /^[a-zA-Z]+$/.test(word)); // Filtra palavras válidas
}

// Testando a função com uma mensagem
const userMessage = "Headache and fatigue are common symptoms that can affect daily life.";
const keywords = extractKeywords(userMessage);
console.log("🧠 Palavras-chave extraídas:", keywords);
}

// 🔍 Função principal para consultar o Notion com as palavras-chave extraídas
export async function getSymptomContext(userMessage) {
  try {
    // Extração das palavras-chave da mensagem do usuário
    const keywords = extractKeywords(userMessage);
    console.log("🧠 Palavras-chave extraídas:", keywords);

    // Se não houver palavras-chave extraídas, retornar um array vazio
    if (!keywords.length) return [];

    // Criar o filtro para a consulta no Notion com as palavras-chave extraídas
    const filter = {
      or: keywords.map(word => ({
        property: "Palavras-chave", // Nome da propriedade no banco de dados do Notion
        rich_text: {
          contains: word // Verificar se cada palavra-chave está no campo "Palavras-chave"
        }
      }))
    };

    console.log("📦 Filtro enviado ao Notion:", JSON.stringify(filter, null, 2));

    // Consulta ao banco de dados do Notion
    const response = await notion.databases.query({
      database_id: databaseId // ID do banco de dados
    });

    // Exibir a resposta bruta do Notion
    console.log("📨 Resposta do Notion:", JSON.stringify(response, null, 2));

    // Se não houver resultados, retornar um array vazio
    if (!response.results.length) return [];

    // Mapeando os resultados e retornando as informações relevantes
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
    console.error("❌ Erro ao consultar o Notion:", error); // Exibe o erro no console
    return []; // Retorna um array vazio em caso de erro
  }
}

// 🔁 Testando a função com uma mensagem
const userMessage = "Headache and fatigue are common symptoms that can affect daily life.";
getSymptomContext(userMessage).then(response => {
  console.log("🔎 Resultado final:", response);
  if (!response || response.length === 0) {
    console.log("⚠️ Nenhum resultado encontrado.");
  } else {
    console.log("✅ Resultado encontrado!");
  }
});
