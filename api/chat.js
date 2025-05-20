import { getNotionContext } from "./notion"; // você criará esse arquivo

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido. Use POST." });
    }

    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const rawBody = Buffer.concat(buffers).toString();
    const body = JSON.parse(rawBody);

    const message = body.message;
    const userName = (body.name || "friend").trim();

    if (!message) {
      return res.status(400).json({ error: "Mensagem não enviada." });
    }

    // ✅ Detecção de idioma
    const ptIndicators = ['você', 'obrigado', 'saúde', 'problema', 'como posso', 'estou', 'tenho', 'dor', 'digestão', 'sentindo'];
    const cleanMessage = message.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const isPortuguese = /[ãõçáéíóúâêôà]/i.test(message) || ptIndicators.some(term => cleanMessage.includes(term));

    // ✅ PROMPT DE SISTEMA ORIGINAL
    const systemPrompt = isPortuguese
      ? `Você é OwlCoreHealth AI, um assistente virtual de saúde simpático, empático e altamente confiável, criado pela equipe OwlCore Wellness Research Group. Fale com o usuário chamado "${userName}" de forma gentil, clara e baseada em ciência. Evite jargões médicos e nunca faça diagnósticos. No fim de cada resposta, escreva exatamente neste formato:

Here are 3 related questions:
1. [pergunta 1]
2. [pergunta 2]
3. [pergunta 3]`
      : `You are OwlCoreHealth AI, a friendly, science-backed virtual health assistant developed by the OwlCore Wellness Research Group. Speak to the user named "${userName}" in warm, natural U.S. English. Offer helpful, evidence-based wellness advice (never make diagnoses). At the end of every message, write exactly in this format:

Here are 3 related questions:
1. [question 1]
2. [question 2]
3. [question 3]`;

    // ✅ CHAMADA GPT
    const notionContext = await getNotionContext(userName);
    const contextMessage = notionContext
      ? { role: "assistant", content: notionContext }
      : null;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(contextMessage ? [context]()

