import { Client } from "@notionhq/client";

// ✅ Instanciando o cliente do Notion
const notion = new Client({
  auth: "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" // Substitua pela sua chave de autenticação
});

// Definir o ID do banco de dados do Notion
const databaseId = "1fda050ee113804aa5e9dd1b01e31066"; // Substitua com o seu ID real

// 🔍 Função de extração de palavras-chave
function extractKeywords(text) {
  const stopwords = [
    "the", "and", "for", "with", "from", "that", "this", "you", "your", "in", "to", "is", "it", "on", "a", "of", "as", "at", "by", "be", "are", "have", "was", "were", "not", "but", "or", "an", "we", "they", "he", "she", "it", "I"
  ];

  return text
    .toLowerCase() // Converte para minúsculas
    .split(/\W+/) // Divide o texto por não-palavras (como espaços, pontuação)
    .filter(word => word.length > 3 && !stopwords.includes(word) && /^[a-zA-Z]+$/.test(word)); // Filtra palavras válidas
}

// 🔍 Função principal para consulta ao Notion
export async function getSymptomContext(userMessage) {
  try {
    const keywords = extractKeywords(userMessage);
    console.log("🧠 Palavras-chave extraídas:", keywords);

    if (!keywords.length) return [];

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

    console.log("📨 Resposta do Notion:", JSON.stringify(response, null, 2));

    if (!response.results.length) return [];

    return response.results.map(page => {
      const p = page.properties;

      // Verificação de campos para garantir que não sejam `undefined` antes de acessá-los
      return {
        sintoma: p["Sintoma / Questão"]?.title?.[0]?.plain_text || "",
        categoria: p["Categoria"]?.select?.name || "",
        risco_pt: p["Riscos Relacionados PT"]?.rich_text?.[0]?.plain_text || "",
        risco_en: p["Riscos Relacionados EN"]?.rich_text?.[0]?.plain_text || "",
        pergunta1_pt: p["Pergunta 1 PT (Curiosidade)"]?.rich_text?.[0]?.plain_text || "",
        pergunta2_pt: p["Pergunta 2 PT (Preocupação)"]?.rich_text?.[0]?.plain_text || "",
        pergunta3_pt: p["Pergunta 3 PT (Solução)"]?.rich_text?.[0]?.plain_text || "",
        pergunta1_en: p["Pergunta 1 EN (Curiosidade)"]?.rich_text?.[0]?.plain_text || "",
        pergunta2_en: p["Pergunta 2 EN (Preocupação)"]?.rich_text?.[0]?.plain_text || "",
        pergunta3_en: p["Pergunta 3 EN (Solução)"]?.rich_text?.[0]?.plain_text || "",
        suplemento: p["Suplemento Relacionado"]?.select?.name || "",
        base_pt: p["Resposta Científica Base PT"]?.rich_text?.[0]?.plain_text || "",
        base_en: p["Resposta Científica Base EN"]?.rich_text?.[0]?.plain_text || "",
        link_pt: p["Chamada do Link PT"]?.rich_text?.[0]?.plain_text || "",
        link_en: p["Chamada do Link EN"]?.rich_text?.[0]?.plain_text || "",
        url: p["Link do Review"]?.url || "",
        gravidade: p["Gravidade"]?.number ? Number(p["Gravidade"].number) : 1 // Certifique-se de que "gravidade" seja um número válido
      };
    });

  } catch (error) {
    console.error("❌ Erro ao consultar o Notion:", error); // Exibe o erro no console
    return []; // Retorna um array vazio em caso de erro
  }
}

// Testando a função
const userMessage = "Headache and fatigue are common symptoms that can affect daily life.";
getSymptomContext(userMessage).then(response => {
  console.log("🔎 Resultado final:", response);
  if (!response || response.length === 0) {
    console.log("⚠️ Nenhum resultado encontrado.");
  } else {
    console.log("✅ Resultado encontrado!");
  }
});
