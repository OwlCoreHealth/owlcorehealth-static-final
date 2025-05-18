
document.addEventListener("DOMContentLoaded", function () {
  const darkModeToggle = document.querySelector('.dark-mode-toggle');
  const readAloudBtn = document.querySelector('.read-aloud');
  const sendBtn = document.querySelector('.send-btn');
  const micBtn = document.querySelector('.mic-btn');
  const inputField = document.querySelector('.chat-input');
  const chatBox = document.querySelector('.chat-box');
  const nameInput = document.querySelector('.user-name');
  let isSpeaking = false;
  let userName = "amigo";

  function getEmojiFromName(name) {
    const clean = (name || "").toLowerCase();
    if (clean.endsWith("a") || clean.endsWith("e")) return "👩";
    if (clean.endsWith("o") || clean.endsWith("r")) return "👨";
    return "👤";
  }

  async function getVoicesSafe() {
    return new Promise(resolve => {
      let voices = speechSynthesis.getVoices();
      if (voices.length) return resolve(voices);
      speechSynthesis.onvoiceschanged = () => {
        voices = speechSynthesis.getVoices();
        resolve(voices);
      };
    });
  }

  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
    });
  }

  if (readAloudBtn) {
  readAloudBtn.addEventListener('click', async () => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      isSpeaking = false;
      return;
    }

    const botMessages = document.querySelectorAll('.chat-box .bot-message');
    if (!botMessages.length) return;

    const lastText = botMessages[botMessages.length - 1].textContent;
    const utterance = new SpeechSynthesisUtterance(lastText);

    const voices = await new Promise(resolve => {
      let all = speechSynthesis.getVoices();
      if (all.length) return resolve(all);
      speechSynthesis.onvoiceschanged = () => resolve(speechSynthesis.getVoices());
    });

    // DETECTA SE A MENSAGEM ESTÁ EM PORTUGUÊS
    const isPortuguese = /[ãõçáéíóúâêôà]|\\b(você|saúde|obrigado|como|problema)\\b/i.test(lastText);

    let preferredVoice = null;

    if (isPortuguese) {
      utterance.lang = "pt-BR";
      preferredVoice = voices.find(v => v.lang === "pt-BR" && v.name.toLowerCase().includes("luciana"));
    } else {
      utterance.lang = "en-US";
      preferredVoice = voices.find(v =>
        v.lang === 'en-US' &&
        (v.name.toLowerCase().includes("david") ||
         v.name.toLowerCase().includes("male") ||
         v.name.toLowerCase().includes("ricardo") ||
         v.name.toLowerCase().includes("daniel"))
      );
    }

    utterance.voice = preferredVoice || voices.find(v => v.lang === utterance.lang) || voices[0];

    utterance.onend = () => { isSpeaking = false; };
    isSpeaking = true;

    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  });
}

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

    const emoji = role === 'bot' ? "🦉" : getEmojiFromName(userName);
    message.textContent = emoji + " " + text;
    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  async function fetchGPTResponse(prompt, name) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt, name: name || "amigo" })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "⚠️ GPT error.";
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
      const userText = inputField.value.trim();
      if (!userText) return;

      userName = nameInput?.value?.trim() || "amigo";
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

  // Ativa o áudio no iOS ao primeiro clique
  document.addEventListener('click', () => {
    const silent = new SpeechSynthesisUtterance('');
    speechSynthesis.speak(silent);
  }, { once: true });
});
