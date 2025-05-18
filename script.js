
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
      const botMessages = document.querySelectorAll('.chat-box .bot-message');
      if (botMessages.length > 0) {
        const lastText = botMessages[botMessages.length - 1].textContent;
        const utterance = new SpeechSynthesisUtterance(lastText);
        const voices = window.speechSynthesis.getVoices();
        utterance.voice = voices[0] || null;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    });
  }

  // ADICIONAR MENSAGEM AO CHAT
  function appendMessage(text, role) {
    const message = document.createElement('div');
    message.className = role === 'bot' ? 'bot-message' : 'user-message';
    message.textContent = text;
    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // ENVIA PARA BACKEND
  async function fetchGPTResponse(prompt) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: prompt })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "⚠️ Erro ao obter resposta.";
  }

  // BOTÃO ENVIAR
  if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
      const userText = inputField.value.trim();
      if (!userText) return;
      appendMessage(userText, 'user');
      inputField.value = '';

      appendMessage("Typing...", 'bot');

      try {
        const botReply = await fetchGPTResponse(userText);
        const typingMsg = chatBox.querySelector('.bot-message:last-child');
        if (typingMsg) typingMsg.remove();
        appendMessage(botReply, 'bot');
      } catch (err) {
        appendMessage("❌ Erro ao contactar o GPT.", 'bot');
        console.error(err);
      }
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

  // iOS: desbloqueia leitura por voz
  document.addEventListener('click', () => {
    const silent = new SpeechSynthesisUtterance('');
    window.speechSynthesis.speak(silent);
  }, { once: true });
});
