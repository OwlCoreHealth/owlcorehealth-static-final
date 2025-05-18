export default async function handler(req, res) {
  const { message } = req.body;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are OwlCore AI, a helpful health assistant." },
        { role: "user", content: message }
      ],
      temperature: 0.7
    })
  });

  const data = await response.json();
  res.status(200).json(data);
}
