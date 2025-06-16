import dotenv from "dotenv";
dotenv.config();

const rawDbId = process.env.NOTION_DATABASE_ID;
console.log("Raw do .env:", rawDbId);
console.log("typeof:", typeof rawDbId);
console.log("Primeiro e último caractere:", rawDbId[0], rawDbId[rawDbId.length-1]);

const cleaned = (rawDbId || "")
  .replace(/^["']+|["']+$/g, "")
  .replace(/[^a-zA-Z0-9\-]/g, "")
  .trim();

console.log("LIMPO:", cleaned, "length:", cleaned.length);
