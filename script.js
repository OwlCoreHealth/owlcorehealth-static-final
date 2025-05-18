
let messageHistory = [
  {
    role: "system",
    content: "You are OwlCoreHealth AI, a helpful assistant for personalized health support. Answer clearly and concisely."
  }
];

const responseBox = document.getElementById("response");

async function sendToGPT() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();
  if (!message) return;

  responseBox.innerHTML += `<p><strong>🧐 You:</strong> ${message}</p>`;
  messageHistory.push({ role: "user", content: message });
  input.value = "";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer YOUR_API_KEY_HERE"
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: messageHistory
    })
  });

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content || "No response.";
  messageHistory.push({ role: "assistant", content: reply });
  responseBox.innerHTML += `<p><strong>🦉 Owl:</strong> ${reply}</p>`;
  responseBox.scrollTop = responseBox.scrollHeight;
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}

function readLastResponse() {
  const last = messageHistory.slice().reverse().find(m => m.role === "assistant");
  if (last) {
    const utterance = new SpeechSynthesisUtterance(last.content);
    speechSynthesis.speak(utterance);
  }
}
