
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
      return data.message; // resposta de erro vinda do backend
    } else {
      throw new Error("Empty response from GPT");
    }
  } catch (error) {
    console.error("GPT fetch error:", error);
    throw error;
  }
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

function renderFollowUpQuestions(botMessage) {
  const questionRegex = /Here are 3 related questions:\s*1[.)-]?\s*(.*?)\s*2[.)-]?\s*(.*?)\s*3[.)-]?\s*(.*)/i;
  const match = botMessage.match(questionRegex);

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

