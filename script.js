
document.getElementById("send").addEventListener("click", () => {
  const input = document.getElementById("userInput").value;
  const responseDiv = document.getElementById("response");
  responseDiv.innerHTML += "<p><strong>You:</strong> " + input + "</p>";
  // Simulação de resposta
  responseDiv.innerHTML += "<p><strong>Owl:</strong> This is a placeholder response.</p>";
});
