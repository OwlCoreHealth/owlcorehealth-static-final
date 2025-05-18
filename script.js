
function subscribe() {
  alert("Subscribed successfully.");
}

function continueWithoutSubscribing() {
  alert("Continuing without subscribing.");
}

function sendMessage() {
  const input = document.getElementById("userInput").value;
  const responseBox = document.getElementById("response");
  responseBox.innerText += "\n\n🧐 You: " + input + "\n🦉 Owl: (GPT response simulated)";
  document.getElementById("userInput").value = "";
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}

function readAloud() {
  const responseText = document.getElementById("response").innerText;
  const speech = new SpeechSynthesisUtterance(responseText);
  speech.voice = speechSynthesis.getVoices().find(voice => voice.name.includes('Google UK English Male')) || null;
  speechSynthesis.speak(speech);
}

function startVoiceInput() {
  alert("Voice input not implemented in this mockup.");
}
