import { getAllSymptoms } from "./notion.mjs";

(async () => {
  const sintomas = await getAllSymptoms();
  console.log("Lista de sintomas do Notion:", sintomas);
})();
