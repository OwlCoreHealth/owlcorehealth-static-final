
const darkToggle = document.getElementById("darkModeToggle");
darkToggle.onclick = () => document.body.classList.toggle("dark-mode");

const readToggle = document.getElementById("readAloudToggle");
function speak(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.voice = speechSynthesis.getVoices().find(voice => voice.name.includes('Male') || voice.name.includes('Daniel'));
  speechSynthesis.speak(msg);
}

document.getElementById("sendBtn").onclick = () => {
  const input = document.getElementById("userInput").value;
  if (!input.trim()) return;
  const chatBox = document.getElementById("chatBox");
  chatBox.innerText += "\nYou: " + input + "\n🦉 Owl: Thinking...";
  fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer YOUR_OPENAI_KEY"
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: input }]
    })
  })
  .then(res => res.json())
  .then(data => {
    const reply = data.choices?.[0]?.message?.content || "No response";
    chatBox.innerText += "\n🦉 Owl: " + reply;
    if (readToggle) speak(reply);
  });
};

document.getElementById("micBtn").onclick = () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.start();
  recognition.onresult = event => {
    document.getElementById("userInput").value = event.results[0][0].transcript;
  };
};
