import express from 'express';
import bodyParser from 'body-parser';
import handler from './api/chat.js';

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

app.post('/api/chat', (req, res) => {
  handler(req, res);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
