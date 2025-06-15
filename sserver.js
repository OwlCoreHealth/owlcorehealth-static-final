import express from "express";
import path from "path";
import { fileURLToPath } from "url";
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir arquivos estáticos (index.html, script.js, etc)
app.use(express.static(__dirname));

// ... Aqui fica o resto do seu código da API ...

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
