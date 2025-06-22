import fs from "fs";
import fetch from "node-fetch";
import cosineSimilarity from "cosine-similarity";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";         // <--- ADICIONA
import { dirname } from "path";              // <--- ADICIONA

// Corrige __dirname para ES Modules:   <--- ADICIONA
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBEDDING_MODEL = "text-embedding-3-small"; // igual ao anterior

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

export async function findNearestSymptom(userInput) {
  // 1. Gerar embedding para o texto do usuário
  const userEmbedding = await generateEmbedding(userInput);

  const embeddingsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "api", "symptoms_embeddings.json"), "utf-8")
);

  // 3. Calcular similaridade e pegar o mais próximo
  let bestScore = -Infinity;
  let bestSymptom = null;

  for (let { sintoma, embedding } of embeddingsData) {
    // cosine-similarity espera arrays de Number
    const score = cosineSimilarity(userEmbedding, embedding);
    if (score > bestScore) {
      bestScore = score;
      bestSymptom = sintoma;
    }
  }

  return { bestSymptom, bestScore };
}

// Teste rápido (remova ou comente depois)
if (process.argv[2]) {
  findNearestSymptom(process.argv.slice(2).join(" ")).then(result => {
    console.log("Sintoma mais próximo:", result);
  });
}
