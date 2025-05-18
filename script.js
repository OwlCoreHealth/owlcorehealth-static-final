
document.addEventListener("DOMContentLoaded", function () {
  // DARK MODE TOGGLE
  const darkModeToggle = document.querySelector('.footer span:nth-child(1)');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
    });
  }

  // READ ALOUD LAST BOT MESSAGE
  const readAloudBtn = document.querySelector('.footer span:nth-child(2)');
  if (readAloudBtn) {
    readAloudBtn.addEventListener('click', () => {
      const botMessages = document.querySelectorAll('.chat-box .bot-message');
      if (botMessages.length > 0) {
        const lastMsg = botMessages[botMessages.length - 1].textContent;
        const utterance = new SpeechSynthesisUtterance(lastMsg);
        speechSynthesis.speak(utterance);
      }
    });
  }

  // CHAT SEND AND SIMULATED RESPONSE
  const sendBtn = document.querySelector('.send-btn');
  const micBtn = document.querySelector('.mic-btn');
  const inputField = document.querySelector('.chat-input');
  const chatBox = document.querySelector('.chat-box');

  function appendMessage(text, role) {
    const msg = document.createElement('div');
    msg.className = role === 'bot' ? 'bot-message' : 'user-message';
    msg.textContent = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  if (sendBtn && inputField && chatBox) {
    sendBtn.addEventListener('click', () => {
      const userText = inputField.value.trim();
      if (!userText) return;
      appendMessage(userText, 'user');
      inputField.value = '';
      setTimeout(() => {
        appendMessage('This is a response from OwlCore AI.', 'bot');
      }, 500);
    });
  }

  // MICROPHONE INPUT
  if (micBtn && 'webkitSpeechRecognition' in window) {
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
});
