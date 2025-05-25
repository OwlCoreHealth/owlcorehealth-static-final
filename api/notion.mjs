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
export async function getSymptomContext(userMessage, userName) {
  try {
    const frasesSarcasticas = [
      "Sem seu nome, idade ou peso, posso te dar conselhos… tão úteis quanto ler a sorte no biscoito da sorte.",
      "Ignorar o formulário? Estratégia ousada. Vamos ver no que dá.",
      "Você ignora sua saúde assim também? Posso tentar adivinhar seu perfil com superpoderes… ou não."
    ];

    const intro = `${userName}, vamos focar nisso.`;

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

    // Agora vamos definir a lógica de respostas
    let corpo = "";
    const followupEtapas = {
      stomach_pain: [
        "Você tem comido alimentos picantes recentemente?",
        "Você tem se sentido estressado ultimamente? O estresse pode afetar seu estômago.",
        "Você tem histórico de condições como gastrite ou refluxo?"
      ],
      headache: [
        "Você tem dormido o suficiente?",
        "Você se sente estressado ou sobrecarregado ultimamente?",
        "Você tem histórico de enxaquecas?"
      ],
      fatigue: [
        "Você tem se alimentado de forma equilibrada?",
        "Você tem feito exercícios regularmente?",
        "Você tem se sentido mais ansioso ultimamente?"
      ],
      back_pain: [
        "Você tem se sentado corretamente? A postura inadequada pode causar dor nas costas.",
        "Você tem feito exercícios para fortalecer a região lombar?",
        "Está sentindo dor constante ou intermitente?"
      ]
    };

    const sintomasMap = {
      "stomach pain": "stomach_pain",
      "headache": "headache",
      "fatigue": "fatigue",
      "back pain": "back_pain"
    };

    // Detectando qual sintoma foi mencionado
    let sintomaKey = "";
    if (userMessage.toLowerCase().includes("stomach") || userMessage.toLowerCase().includes("pain")) {
      sintomaKey = "stomach_pain";
    } else if (userMessage.toLowerCase().includes("headache")) {
      sintomaKey = "headache";
    } else if (userMessage.toLowerCase().includes("fatigue")) {
      sintomaKey = "fatigue";
    } else if (userMessage.toLowerCase().includes("back pain")) {
      sintomaKey = "back_pain";
    }

    // Usando o sintoma detectado para escolher as perguntas apropriadas
    if (sintomaKey && followupEtapas[sintomaKey]) {
      corpo = `${intro} Vamos dar uma olhada no que pode estar causando sua dor de ${sintomaKey.replace("_", " ")}:\n\n`;

      // Explicação científica para dor nas costas (como exemplo)
      if (sintomaKey === "back_pain") {
        corpo += `### Scientific Insight:\nBack pain is a common affliction and can stem from various causes like muscle strain, poor posture, or even something more serious like a herniated disc. Stress and lifestyle choices can also play a significant role.\n`;
      }

      corpo += `### Let’s Explore 3 Ideas:\n`;

      // Adicionando perguntas clicáveis
      followupEtapas[sintomaKey].forEach((question, index) => {
        corpo += `<a href="/next-step?question=${index + 1}">${index + 1}. ${question}</a>\n`; // Link clicável para cada pergunta
      });
    }

    return corpo;

  } catch (error) {
    console.error("❌ Erro ao consultar o Notion:", error);
    return []; // Retorna um array vazio em caso de erro
  }
}

// Testando a função
const userMessage = "I have pain in the back";
const userName = "João";  // Substitua pelo nome do usuário real

getSymptomContext(userMessage, userName).then(response => {
  console.log("🔎 Resultado final:", response);
  if (!response || response.length === 0) {
    console.log("⚠️ Nenhum resultado encontrado.");
  } else {
    console.log("✅ Resultado encontrado!");
  }
});
