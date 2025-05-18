
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

  // READ ALOUD (com suporte a mobile)
  if (readAloudBtn) {
    readAloudBtn.addEventListener('click', () => {
      const botMessages = document.querySelectorAll('.chat-box .bot-message');
      if (botMessages.length > 0) {
        const lastText = botMessages[botMessages.length - 1].textContent;
        const utterance = new SpeechSynthesisUtterance(lastText);

        // Carregar vozes (fix para mobile)
        const voices = window.speechSynthesis.getVoices();
        utterance.voice = voices[0] || null;

        // Cancelar fala anterior e executar nova
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    });
  }

  // FUNÇÃO PARA INSERIR MENSAGENS
  function appendMessage(text, role) {
    const message = document.createElement('div');
    message.className = role === 'bot' ? 'bot-message' : 'user-message';
    message.textContent = text;
    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // ENVIO DE MENSAGEM
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

  // MICROFONE
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
