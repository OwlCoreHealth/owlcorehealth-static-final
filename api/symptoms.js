import { getAllSymptoms } from "./notion.mjs";

export default async function handler(req, res) {
  try {
    const sintomas = await getAllSymptoms();
    res.status(200).json(sintomas);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar sintomas" });
  }
}
