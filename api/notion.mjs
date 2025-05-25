import { Client } from "@notionhq/client";

// ✅ Instanciando o cliente do Notion
const notion = new Client({
  auth: "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" // Substitua pela sua chave de autenticação
});

const databaseId = "1fda050ee113804aa5e9dd1b01e31066"; // ID do banco de dados

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

// Função principal para consulta ao Notion
export async function getSymptomContext(userMessage, userName, userAge, userSex, userWeight) {
  try {
    const frasesSarcasticas = [
      "Sem seu nome, idade ou peso, posso te dar conselhos… tão úteis quanto ler a sorte no biscoito da sorte.",
      "Ignorar o formulário? Estratégia ousada. Vamos ver no que dá.",
      "Você ignora sua saúde assim também? Posso tentar adivinhar seu perfil com superpoderes… ou não."
    ];

    const hasForm = userName && userAge && userSex && userWeight; // Verifica se o formulário foi preenchido

    const intro = hasForm
      ? `${userName}, 28% das pessoas com ${userAge} anos relatam ansiedade, 31% têm digestão lenta, e 20% não tomam suplemento. Mas você está aqui. Isso já é um passo acima da média.`
      : frasesSarcasticas[Math.floor(Math.random() * frasesSarcasticas.length)];

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

    const response = await notion.databases.query({
      database_id: databaseId // ID do banco de dados
    });

    console.log("📨 Resposta do Notion:", JSON.stringify(response, null, 2));

    if (!response.results.length) return [];

    // Perguntas de follow-up
    const followupEtapas = {
      pt: [
        ["Quer entender os riscos se isso for ignorado?", "Deseja ver dados reais de quem passou por isso?", "Quer saber quais nutrientes combatem isso?"],
        ["Quer saber o que pode acontecer se você não tratar esse sintoma?", "Deseja ver estatísticas sobre como esse problema afeta outras pessoas?", "Quer ver alimentos que agravam isso?"],
        ["Posso mostrar estudos reais sobre esse sintoma.", "Quer saber os micronutrientes mais eficazes nesse caso?", "Deseja ver alternativas naturais para aliviar isso?"],
        ["Quer que eu mostre o suplemento ideal para isso?", "Deseja ver a avaliação completa do produto?", "Quer continuar explorando sintomas parecidos?"]
      ],
      en: [
        ["Want to know the risks of ignoring this?", "Interested in real-world data on this symptom?", "Want to discover which nutrients help fight this?"],
        ["Want to understand what happens if untreated?", "Want to see how others are affected by this issue?", "Want to see foods that make it worse?"],
        ["I can show real-world studies on this symptom.", "Curious about the most effective nutrients for this?", "Want natural alternatives to ease this now?"],
        ["Want me to show you the ideal supplement?", "Want to read the full product review?", "Prefer to continue exploring related symptoms?"]
      ]
    };

    const idioma = userSex === "Male" ? "en" : "pt"; // Modifique conforme necessário para detectar o idioma (Exemplo: baseado no sexo do usuário)

    let followups = [];
    let corpo = "";
    const idiomaEtapas = followupEtapas[idioma];
    const etapaIndex = Math.min(0, idiomaEtapas.length - 1); // Inicialização da etapa para o primeiro nível

    corpo = `\n\n${hasForm ? (idioma === "pt" ? `Vamos focar nisso, ${userName}.` : `Let’s focus on that, ${userName}.`) : ""}\n\n${
      idioma === "pt" ? "Base científica:" : "Scientific insight:"
    }\n${response.results[0].properties["Base Científica Base PT"]?.rich_text?.[0]?.plain_text || "Sem dados disponíveis."}\n\n${
      idioma === "pt" ? "Vamos aprofundar com 3 ideias:" : "Let’s explore 3 ideas:"
    }\n1. ${idiomaEtapas[etapaIndex][0]}\n2. ${idiomaEtapas[etapaIndex][1]}\n3. ${idiomaEtapas[etapaIndex][2]}`;

    return corpo;

  } catch (error) {
    console.error("❌ Erro ao consultar o Notion:", error);
    return []; // Retorna um array vazio em caso de erro
  }
}

// Testando a função
const userMessage = "Headache and fatigue are common symptoms that can affect daily life.";
const userName = "João";  // Substitua pelo nome do usuário real
const userAge = 28;       // Substitua pela idade real
const userSex = "Male";   // Substitua pelo sexo real
const userWeight = 75;    // Substitua pelo peso real

getSymptomContext(userMessage, userName, userAge, userSex, userWeight).then(response => {
  console.log("🔎 Resultado final:", response);
  if (!response || response.length === 0) {
    console.log("⚠️ Nenhum resultado encontrado.");
  } else {
    console.log("✅ Resultado encontrado!");
  }
});
