export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { name, email, gender, age } = req.body;

  const payload = { name, email, gender, age };

  try {
    const response = await fetch("https://script.google.com/macros/s/AKfycbw7KDyhCxI459o2bxbcUaHcb_td7FFrJSSJF59Wp8DkuQVD4ajL9JZ-nhqa6iQiEO-s-g/exec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Erro no envio para Google Sheets");
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Erro ao encaminhar para o Google Sheets:", err);
    return res.status(500).json({ error: "Falha ao enviar subscrição" });
  }
}
