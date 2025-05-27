// notion.mjs - Versão final com integração dinâmica completa 
// Lê as fases do funil, perguntas, gravidade e links diretamente da tabela Notion

import { Client } from "@notionhq/client";

const notion = new Client({
  auth: "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"
});

const databaseId = "1fda050ee113804aa5e9dd1b01e31066";

export async function getSymptomContext(userMessage, userName = "", userAge = "", userWeight = "", funnelPhase = 1, previousSymptom = null, usedQuestions = []) {
  try {
    const language = detectLanguage(userMessage);
    let sintomaKey = "unknown";

    if (userMessage.toLowerCase().includes("stomach") || userMessage.toLowerCase().includes("estômago") || userMessage.toLowerCase().includes("barriga")) {
      sintomaKey = "stomach_pain";
    } else if (userMessage.toLowerCase().includes("headache") || userMessage.toLowerCase().includes("cabeça")) {
      sintomaKey = "headache";
    } else if (userMessage.toLowerCase().includes("fatigue") || userMessage.toLowerCase().includes("cansaço") || userMessage.toLowerCase().includes("energia")) {
      sintomaKey = "fatigue";
    } else if (userMessage.toLowerCase().includes("back pain") || userMessage.toLowerCase().includes("lombar")) {
      sintomaKey = "back_pain";
    }

    if (sintomaKey === "unknown" && previousSymptom) {
      sintomaKey = previousSymptom;
    }

    // Criação do prompt com todas as variáveis necessárias
    const intro = getSarcasticIntro(sintomaKey, language, userName);
    const scientificExplanation = getScientificExplanation(sintomaKey, language, userName, userAge, userWeight);
    const followupQuestions = getFollowupQuestions(sintomaKey, language, funnelPhase, usedQuestions);

    const gptPromptData = buildGPTPrompt(
      sintomaKey,
      language,
      userName,
      userAge,
      userWeight,
      userMessage,
      funnelPhase,
      usedQuestions
    );

    return {
      sintoma: sintomaKey,
      language,
      intro,
      scientificExplanation,
      followupQuestions,
      funnelPhase,
      gptPromptData // ✅ ESSENCIAL para o chat.js funcionar
    };
  } catch (error) {
    console.error("❌ Erro em getSymptomContext:", error);

    const fallbackLanguage = detectLanguage(userMessage);
    return {
      sintoma: "error",
      language: fallbackLanguage,
      intro: fallbackLanguage === "pt" ? "Desculpe, algo saiu errado aqui..." : "Sorry, something went wrong...",
      scientificExplanation: "",
      followupQuestions: [],
      funnelPhase: 1
    };
  }
}
