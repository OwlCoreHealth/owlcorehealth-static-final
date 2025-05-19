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

      // ✅ Detecta se é português com segurança
      const isPortuguese = /[ãõçáéíóúâêôà]|(você|saude|problema|obrigado|como|tenho|sentindo)/i.test(lastText);

      utterance.lang = isPortuguese ? "pt-BR" : "en-US";

      // ✅ Escolhe voz genérica compatível com Android/iOS/Desktop
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
    message.textContent = emoji + " " + text;
    chatBox.appendChild(message);

    // ✅ Rolar até o início da nova resposta do bot
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
        return data.choices[0].message.content;
      } else if (data.message) {
        return data.message;
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
        const botReply = await fetchGPTResponse(userText, userName);
        const typingMsg = chatBox.querySelector('.bot-message:last-child');
        if (typingMsg) typingMsg.remove();
        appendMessage(botReply, 'bot');
        renderFollowUpQuestions(botReply);
      } catch (err) {
        appendMessage("❌ GPT communication error.", 'bot');
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

  document.addEventListener('click', () => {
    const silent = new SpeechSynthesisUtterance('');
    speechSynthesis.speak(silent);
  }, { once: true });

  function renderFollowUpQuestions(botMessage) {
    const match = botMessage.match(/(?:Here are 3 related questions:|Aqui estão 3 perguntas relacionadas:)\s*1[.)-]?\s*(.*?)\s*2[.)-]?\s*(.*?)\s*3[.)-]?\s*(.*)/i);

    if (match) {
      const [, q1, q2, q3] = match;
      const suggestionsContainer = document.createElement("div");
      suggestionsContainer.className = "follow-up-buttons";

      [q1, q2, q3].forEach(question => {
        const btn = document.createElement("button");
        btn.textContent = question.trim();
        btn.className = "follow-up-btn";
        btn.onclick = () => sendMessageWithSuggestion(question.trim());
        suggestionsContainer.appendChild(btn);
      });

      chatBox.appendChild(suggestionsContainer);
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }

  function sendMessageWithSuggestion(text) {
    inputField.value = text;
    sendBtn.click();
  }

  // ✅ BLOCO FINAL ADICIONADO: Envia dados para o Google Sheets
  const subscribeBtn = document.querySelector('.subscribe-btn');

if (subscribeBtn) {
  subscribeBtn.addEventListener('click', async () => {
    subscribeBtn.disabled = true; // ✅ Evita múltiplos envios

    const name = document.querySelector('.user-name')?.value.trim() || "";
    const email = document.querySelector('.email-input')?.value.trim() || "";
    const gender = document.querySelector('.gender-input')?.value.trim() || "";
    const age = document.querySelector('.age-input')?.value.trim() || "";

    const data = { name, email, gender, age };

    try {
      await fetch("https://script.google.com/macros/s/AKfycbw7KDyhCxI459o2bxbcUaHcb_td7FFrJSSJF59Wp8DkuQVD4ajL9JZ-nhqa6iQiEO-s-g/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      alert("✔️ Subscrição enviada com sucesso!");
    } catch (err) {
      alert("❌ Erro ao enviar subscrição.");
      console.error(err);
    } finally {
      subscribeBtn.disabled = false; // ✅ Reativa o botão
    }
  });
}
  
});

