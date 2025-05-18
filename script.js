
// DARK MODE TOGGLE
const darkModeToggle = document.querySelector('.footer span:first-child');
darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

// READ ALOUD
const readAloudBtn = document.querySelector('.footer span:last-child');
const lastBotResponse = () => {
  const messages = document.querySelectorAll('.chat-box .bot-message');
  return messages.length ? messages[messages.length - 1].textContent : '';
};
readAloudBtn.addEventListener('click', () => {
  const utterance = new SpeechSynthesisUtterance(lastBotResponse());
  window.speechSynthesis.speak(utterance);
});

// SEND MESSAGE
const sendBtn = document.querySelector('.send-btn');
const inputField = document.querySelector('.chat-box input[type="text"]');
const chatBox = document.querySelector('.chat-box');

function appendMessage(text, role) {
  const msg = document.createElement('div');
  msg.className = role === 'bot' ? 'bot-message' : 'user-message';
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

sendBtn.addEventListener('click', () => {
  const userText = inputField.value.trim();
  if (!userText) return;
  appendMessage(userText, 'user');
  inputField.value = '';
  setTimeout(() => {
    appendMessage('This is a simulated response from OwlCore AI.', 'bot');
  }, 600);
});

// MICROPHONE INPUT
const micBtn = document.querySelector('.mic-btn');
if ('webkitSpeechRecognition' in window) {
  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;
  micBtn.addEventListener('click', () => {
    recognition.start();
  });
  recognition.onresult = (event) => {
    inputField.value = event.results[0][0].transcript;
  };
}
