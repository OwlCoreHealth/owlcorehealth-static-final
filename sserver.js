import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// Configuração para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("DEBUG __dirname:", __dirname);

const app = express();

// Servir arquivos estáticos
app.use(express.static(__dirname));

// Rota principal para servir index.html
app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "index.html");
  console.log("DEBUG: tentando servir:", indexPath);
  res.sendFile(indexPath);
});

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
