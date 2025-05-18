
document.addEventListener("DOMContentLoaded", function () {
  const darkModeToggle = document.querySelector('.dark-mode-toggle');
  const readAloudBtn = document.querySelector('.read-aloud');
  const sendBtn = document.querySelector('.send-btn');
  const micBtn = document.querySelector('.mic-btn');
  const inputField = document.querySelector('.chat-input');
  const chatBox = document.querySelector('.chat-box');
  let isSpeaking = false;

  // DARK MODE
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
    });
  }

  // READ ALOUD TOGGLE (male voice US/Portuguese)
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

        const voices = window.speechSynthesis.getVoices();
        const preferredVoices = voices.filter(v =>
          (v.lang === 'en-US' && v.name.toLowerCase().includes('male')) ||
          (v.lang === 'pt-PT' && v.name.toLowerCase().includes('male'))
        );

        utterance.voice = preferredVoices[0] || voices.find(v => v.lang === 'en-US') || null;
        utterance.onend = () => { isSpeaking = false; };
        isSpeaking = true;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    });
  }

  // ADD MESSAGE TO CHAT WITH STYLE
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
    message.textContent = text;
    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // FETCH FROM GPT
  async function fetchGPTResponse(prompt) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: prompt })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "⚠️ GPT error.";
  }

  // SEND BUTTON HANDLER
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
        appendMessage("❌ GPT communication error.", 'bot');
        console.error(err);
      }
    });
  }

  // MICROPHONE (CHROME ONLY)
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

  // ENABLE AUDIO ON FIRST CLICK (iOS fix)
  document.addEventListener('click', () => {
    const silent = new SpeechSynthesisUtterance('');
    window.speechSynthesis.speak(silent);
  }, { once: true });
});
