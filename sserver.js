import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir arquivos estáticos da raiz do projeto (inclusive index.html)
app.use(express.static(__dirname));

// Garantir index.html para a rota "/"
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// IMPORTANTE: aqui você pode adicionar suas rotas de API se precisar
// Exemplo para API:
// import './api/chat.js'; // se você usar rotas tipo app.use('/api', ...);
// Isso garante que ao acessar localhost:3000, ele retorna index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
