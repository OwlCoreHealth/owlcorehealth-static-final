
function sendMessage() {
  const input = document.getElementById("userInput").value;
  const response = document.getElementById("response");
  if (input.trim()) {
    response.innerHTML += "<p><strong>You:</strong> " + input + "</p>";
    response.innerHTML += "<p><strong>🦉 Owl:</strong> Thinking...</p>";
  }
}
function startListening() {
  alert("Microphone input not yet implemented in this static version.");
}
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}
function readAloud() {
  const text = document.getElementById("response").innerText;
  const speech = new SpeechSynthesisUtterance(text);
  speech.voice = speechSynthesis.getVoices().find(v => v.name.includes('Google US English Male')) || null;
  speechSynthesis.speak(speech);
}
function subscribe() {
  const email = document.getElementById("email").value;
  alert("Subscribed with: " + email);
}
function continueWithout() {
  alert("Continuing without subscription.");
}


// DARK MODE TOGGLE
document.addEventListener("DOMContentLoaded", function () {
  const darkToggle = document.querySelector('.footer span:nth-child(1)');
  if (darkToggle) {
    darkToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
    });
  }

  // READ ALOUD FUNCTIONALITY
  const readBtn = document.querySelector('.footer span:nth-child(2)');
  if (readBtn) {
    readBtn.addEventListener('click', () => {
      const botMessages = document.querySelectorAll('.chat-box .bot-message');
      if (botMessages.length) {
        const lastMsg = botMessages[botMessages.length - 1].textContent;
        const utterance = new SpeechSynthesisUtterance(lastMsg);
        speechSynthesis.speak(utterance);
      }
    });
  }
});
