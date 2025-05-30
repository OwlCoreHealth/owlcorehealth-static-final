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

      const lastText = botMessages[botMessages.length - 1].textContent.replace(/^🦉\s*/, '');
      const utterance = new SpeechSynthesisUtterance(lastText);

      const voices = await getVoicesSafe();
      const isPortuguese = /[ãõçáéíóúâêôà]|(você|saude|problema|obrigado|como|tenho|sentindo)/i.test(lastText);

      utterance.lang = isPortuguese ? "pt-BR" : "en-US";
      utterance.voice = voices.find(v => v.lang === utterance.lang) || voices[0];

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
if (role === 'bot') {
  message.innerHTML = emoji + " " + text; // Usar innerHTML para mensagens do bot
} else {
  message.textContent = emoji + " " + text; // Manter textContent para mensagens do usuário
}
    chatBox.appendChild(message);

    if (role === 'bot') {
      setTimeout(() => {
        message.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  async function fetchGPTResponse(prompt, name) {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, name: name || "amigo" })
      });

      const data = await response.json();

      if (data.choices && data.choices[0] && data.choices[0].message) {
        return {
          text: data.choices[0].message.content,
          followups: data.choices[0].message.followups || []
        };
      } else if (data.message) {
        return { text: data.message, followups: [] };
      } else {
        throw new Error("Empty GPT response.");
      }
    } catch (err) {
      console.error("GPT fetch error:", err);
      throw err;
    }
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
        const { text: botReply, followups } = await fetchGPTResponse(userText, userName);
        const typingMsg = chatBox.querySelector('.bot-message:last-child');
        if (typingMsg) typingMsg.remove();
        appendMessage(botReply, 'bot');
        // ✅ Mostrar campo de subscrição após a primeira resposta
const emailPrompt = document.getElementById("email-prompt");
if (emailPrompt && !emailPrompt.dataset.shown) {
  emailPrompt.style.display = "block";
  emailPrompt.dataset.shown = "true";
}

        renderFollowUpButtons(followups);
      } catch (err) {
        appendMessage("❌ GPT communication error.", 'bot');
      }
    });
  }

  function renderFollowUpButtons(questions) {
    if (!questions || !questions.length) return;

    const suggestionsContainer = document.createElement("div");
    suggestionsContainer.className = "follow-up-buttons";

    questions.forEach(question => {
      const btn = document.createElement("button");
      btn.textContent = question.trim();
      btn.className = "follow-up-btn";
      btn.onclick = () => sendMessageWithSuggestion(question.trim());
      suggestionsContainer.appendChild(btn);
    });

    chatBox.appendChild(suggestionsContainer);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function sendMessageWithSuggestion(text) {
    inputField.value = text;
    sendBtn.click();
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

  document.addEventListener('click', () => {
    const silent = new SpeechSynthesisUtterance('');
    speechSynthesis.speak(silent);
  }, { once: true });

  // ✅ BLOCO FINAL ADICIONADO: Subscrição com apenas e-mail
const subscribeBtn = document.querySelector('.subscribe-btn');

if (subscribeBtn) {
  subscribeBtn.addEventListener('click', async () => {
    subscribeBtn.disabled = true;

    const email = document.querySelector('.email-input')?.value.trim() || "";
    if (!email) {
      alert("Por favor, insira um e-mail válido.");
      subscribeBtn.disabled = false;
      return;
    }

    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      alert("✔️ Subscrição enviada com sucesso!");
    } catch (err) {
      alert("❌ Erro ao enviar subscrição.");
      console.error(err);
    } finally {
      subscribeBtn.disabled = false;
    }
  });
}

// ✅ EXIBIR FORMULÁRIO DE E-MAIL APÓS A PRIMEIRA RESPOSTA DO BOT
const observer = new MutationObserver(() => {
  const botMessages = document.querySelectorAll('.chat-box .bot-message');
  const emailPrompt = document.getElementById('email-prompt');

  if (botMessages.length >= 1 && emailPrompt && emailPrompt.style.display === "none") {
    emailPrompt.style.display = "block";
    emailPrompt.scrollIntoView({ behavior: 'smooth' });
    observer.disconnect(); // só executa uma vez
  }
});

observer.observe(document.querySelector('.chat-box'), { childList: true });

// Função para lidar com cliques nas perguntas sugeridas
function handleQuestionClick(element) {
  const question = decodeURIComponent(element.getAttribute('data-question'));
  document.querySelector('.chat-input').value = question;
  document.querySelector('.send-btn').click();
}

// Ao adicionar mensagens do bot à chat-box, use innerHTML em vez de textContent
function addBotMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'bot-message';
  messageElement.innerHTML = message;
  document.querySelector('.chat-box').appendChild(messageElement);
}
