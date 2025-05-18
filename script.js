
let messageHistory = [
  {
    role: "system",
    content: "You are OwlCoreHealth AI, a helpful assistant for personalized health support. Answer clearly and concisely."
  }
];

function sendMessage() {
  const input = document.getElementById("userInput");
  const msg = input.value.trim();
  if (!msg) return;

  document.getElementById("response").textContent += "\n\n🧐 You: " + msg;
  messageHistory.push({ role: "user", content: msg });

  fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer YOUR_API_KEY_HERE"
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: messageHistory
    })
  })
  .then(res => res.json())
  .then(data => {
    const reply = data.choices?.[0]?.message?.content || "No response.";
    messageHistory.push({ role: "assistant", content: reply });
    document.getElementById("response").textContent += "\n\n🦉 Owl: " + reply;
    speak(reply);
    document.getElementById("userInput").value = "";
  })
  .catch(err => {
    document.getElementById("response").textContent += "\n\n❌ Error: " + err.message;
  });
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}

function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.voice = speechSynthesis.getVoices().find(v => v.name.includes("Male")) || speechSynthesis.getVoices()[0];
  speechSynthesis.speak(utter);
}

function speakResponse() {
  const text = document.getElementById("response").textContent.split("🦉 Owl: ").pop();
  speak(text);
}

function startListening() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.start();
  recognition.onresult = function(event) {
    document.getElementById("userInput").value = event.results[0][0].transcript;
  };
}

function subscribe() {
  alert("Subscribed and continuing...");
}

function continueWithoutSub() {
  alert("Continuing without subscribing...");
}
