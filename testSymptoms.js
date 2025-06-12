import { getAllSymptoms } from "./api/data/notion.mjs";

(async () => {
  const sintomas = await getAllSymptoms();
  console.log("Lista de sintomas do Notion:", sintomas);
})();
