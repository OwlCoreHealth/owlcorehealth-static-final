import dotenv from "dotenv";
dotenv.config();

import { getAllSymptoms } from "./api/notion.mjs";

(async () => {
  console.log("NOTION_API_KEY:", process.env.NOTION_API_KEY);
  console.log("NOTION_DATABASE_ID:", process.env.NOTION_DATABASE_ID);

  const sintomas = await getAllSymptoms();
  console.log("Lista de sintomas do Notion:", sintomas);
})();
