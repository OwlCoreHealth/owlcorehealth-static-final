// scripts/generate_embeddings.js

import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import fetch from "node-fetch";
import { getAllSymptoms } from "./api/notion.mjs"; // Ou o caminho correto do seu projeto

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBEDDING_MODEL = "text-embedding-3-small"; // ou outro, como preferir

async function generateEmbedding(text) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text
    })
  });
  const data = await res.json();
  if (!data.data || !data.data[0] || !data.data[0].embedding) {
    throw new Error("Falha ao gerar embedding: " + JSON.stringify(data));
  }
  return data.data[0].embedding;
}

(async () => {
  console.log("🔍 Buscando lista de sintomas do Notion...");
  const sintomas = await getAllSymptoms();

  if (!sintomas.length) {
    console.error("Nenhum sintoma encontrado!");
    process.exit(1);
  }

  const embeddings = [];
  for (let sintoma of sintomas) {
    console.log(`Gerando embedding para: ${sintoma}`);
    try {
      const embedding = await generateEmbedding(sintoma);
      embeddings.push({
        sintoma,
        embedding
      });
    } catch (err) {
      console.error(`Erro para sintoma "${sintoma}":`, err.message);
    }
  }

  fs.writeFileSync(
  path.join(__dirname, "data", "symptoms_embeddings.json"),
  JSON.stringify(embeddings, null, 2),
  "utf-8"
);

  console.log("✅ Embeddings salvos em ./data/symptoms_embeddings.json");
})();
