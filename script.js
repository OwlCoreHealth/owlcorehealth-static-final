
document.addEventListener("DOMContentLoaded", function () {
  const darkModeToggle = document.querySelector('.dark-mode-toggle');
  const readAloudBtn = document.querySelector('.read-aloud');
  const sendBtn = document.querySelector('.send-btn');
  const micBtn = document.querySelector('.mic-btn');
  const inputField = document.querySelector('.chat-input');
  const chatBox = document.querySelector('.chat-box');

  // DARK MODE
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
    });
  }

  // READ ALOUD
  if (readAloudBtn) {
    readAloudBtn.addEventListener('click', () => {
      const messages = chatBox.querySelectorAll('.bot-message');
      if (messages.length > 0) {
        const lastText = messages[messages.length - 1].textContent;
        const utterance = new SpeechSynthesisUtterance(lastText);
        speechSynthesis.speak(utterance);
      }
    });
  }

  // APPEND MESSAGE
  function appendMessage(text, role) {
    const message = document.createElement('div');
    message.className = role === 'bot' ? 'bot-message' : 'user-message';
    message.textContent = text;
    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // SEND BUTTON
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      const userText = inputField.value.trim();
      if (!userText) return;
      appendMessage(userText, 'user');
      inputField.value = '';
      setTimeout(() => {
        appendMessage("This is a simulated response from OwlCore AI.", 'bot');
      }, 500);
    });
  }

  // MICROPHONE
  if (micBtn && 'webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    micBtn.addEventListener('click', () => {
      recognition.start();
    });
    recognition.onresult = function (event) {
      inputField.value = event.results[0][0].transcript;
    };
  }
});
