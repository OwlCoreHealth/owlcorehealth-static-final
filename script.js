document.addEventListener("DOMContentLoaded", function () {
  const darkModeToggle = document.querySelector('.dark-mode-toggle');
  const readAloudBtn = document.querySelector('.read-aloud');
  const sendBtn = document.querySelector('.send-btn');
  const micBtn = document.querySelector('.mic-btn');
  const inputField = document.querySelector('.chat-input');
  const chatBox = document.querySelector('.chat-box');
  const nameInput = document.querySelector('.user-name');
  const genderInput = document.querySelector('.user-gender');
  let isSpeaking = false;
  let availableVoices = [];

  // Carrega vozes assim que disponíveis
  window.speechSynthesis.onvoiceschanged = () => {
    availableVoices = window.speechSynthesis.getVoices();
  };

  // DARK MODE
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
    });
  }

  // READ ALOUD TOGGLE (com vozes fixadas)
  if (readAloudBtn) {
    readAloudBtn.addEventListener('click', () => {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
        return;
      }

      const botMessages = document.querySelectorAll('.chat-box .bot-message');
      if (botMessages.length > 0) {
        const lastText = botMessages[botMessages.length - 1].textContent;
        const utterance = new SpeechSynthesisUtterance(lastText);

        const preferredVoiceNames = [
          'Microsoft David', 'Google US English Male', 'Ricardo', 'Daniel'
        ];
        const voice = availableVoices.find(v => preferredVoiceNames.includes(v.name)) ||
                      availableVoices.find(v => v.lang === 'en-US') ||
                      availableVoices[0] || null;

        utterance.voice = voice;
        utterance.lang = voice?.lang || 'en-US';
        utterance.onend = () => { isSpeaking = false; };
        isSpeaking = true;

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    });
  }

  // Escolhe emoji com base no sexo
  function getUserEmoji() {
    const gender = (genderInput?.value || '').toLowerCase();
    if (gender.includes("male")) return "👨";
    if (gender.includes("female")) return "👩";
    return "👤";
  }

  // Adiciona mensagem ao chat com estilo
  function appendMessage(text, role) {
    const message = document.createElement('div');
    message.className = role === 'bot' ? 'bot-message' : 'user-message';
    message.style.whiteSpace = "pre-wrap";
    message.style.lineHeight = "1.6";
    message.style.padding = "12px";
    message.style.marginBottom = "10px";
    message.style.borderRadius = "10px";
    message.style.backgroundColor = role === 'bot' ? "#f3f4f6" : "#dbeafe";
    message.style.maxWidth = "95%";

    const emoji = role === 'bot' ? "🦉" : getUserEmoji();
    message.textContent = emoji + " " + text;

    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // Envia mensagem ao backend
  async function fetchGPTResponse(prompt, name) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: prompt, name: name || "amigo" })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "⚠️ GPT error.";
  }

  // Ao clicar em enviar
  if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
      const userText = inputField.value.trim();
      if (!userText) return;

      const userName = nameInput?.value?.trim() || "amigo";

      appendMessage(userText, 'user');
      inputField.value = '';

      appendMessage("Typing...", 'bot');

      try {
        const botReply = await fetchGPTResponse(userText, userName);
        const typingMsg = chatBox.querySelector('.bot-message:last-child');
        if (typingMsg) typingMsg.remove();
        appendMessage(botReply, 'bot');
      } catch (err) {
        appendMessage("❌ GPT communication error.", 'bot');
        console.error(err);
      }
    });
  }

  // Microfone (somente Chrome)
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

  // iOS: desbloqueia leitura por clique
  document.addEventListener('click', () => {
    const silent = new SpeechSynthesisUtterance('');
    window.speechSynthesis.speak(silent);
  }, { once: true });
});

