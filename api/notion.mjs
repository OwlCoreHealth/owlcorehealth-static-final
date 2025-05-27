// notion.mjs - Versão final com integração dinâmica completa 
// Lê as fases do funil, perguntas, gravidade e links diretamente da tabela Notion

import { Client } from "@notionhq/client";

const notion = new Client({
  auth: "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"
});

const databaseId = "1fda050ee113804aa5e9dd1b01e31066";

export async function getSymptomContext(message, nome = "") {
  try {
    const query = await notion.databases.query({
      database_id: databaseId,
      filter: {
        or: [
          {
            property: "Keywords",
            rich_text: {
              contains: message
            }
          },
          {
            property: "Symptom",
            rich_text: {
              contains: message
            }
          }
        ]
      }
    });

    if (!query.results.length) {
      return { sintoma: "unknown", funnelContent: {}, followupQuestions: [], gravity: [], links: {} };
    }

    const page = query.results[0];
    const props = page.properties;

    // Obter fases do funil (1 a 6)
    const funnelContent = {};
    for (let i = 1; i <= 6; i++) {
      const varKeys = [`Funnel ${i} Variation 1`, `Funnel ${i} Variation 2`, `Funnel ${i} Variation 3`];
      funnelContent[`funnel${i}`] = varKeys.map(k => props[k]?.rich_text?.[0]?.plain_text || null).filter(Boolean);
    }

    // Obter perguntas (Sintomas - 5 conjuntos)
    const followupQuestions = [];
    for (let i = 1; i <= 5; i++) {
      for (let j = 1; j <= 3; j++) {
        const key = `Symptom ${i} Variation ${j}`;
        const text = props[key]?.rich_text?.[0]?.plain_text;
        if (text) followupQuestions.push(text);
      }
    }

    // Obter gravidade (até 5 variações)
    const gravity = [];
    for (let i = 1; i <= 5; i++) {
      const gkey = `Gravity ${i}`;
      const gtext = props[gkey]?.rich_text?.[0]?.plain_text;
      if (gtext) gravity.push(gtext);
    }

    // Obter links
    const linkText = props["Links"]?.rich_text?.[0]?.plain_text || "";
    const linkParts = linkText.split("click here");
    const links = {
      review: linkParts[0]?.split("Review")?.[1]?.trim() || "",
      video: linkParts[2]?.trim() || "",
      product: linkParts[1]?.split("Product")?.[1]?.trim() || ""
    };

    return {
      sintoma: props["Symptom"]?.rich_text?.[0]?.plain_text || "unknown",
      funnelContent,
      followupQuestions,
      gravity,
      links
    };
  } catch (err) {
    console.error("Erro ao buscar contexto no Notion:", err);
    return { sintoma: "unknown", funnelContent: {}, followupQuestions: [], gravity: [], links: {} };
  }
}
