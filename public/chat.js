let ws;
let myName = null;

function login() {
  const nameInput = document.getElementById("username");
  const name = nameInput.value.trim();

  if (!name) return alert("Username cannot be empty.");

  myName = name;
  document.getElementById("login").style.display = "none";
  document.getElementById("chatArea").style.display = "block";

  const protocol = location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(`${protocol}://${location.host}`);

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "login", username: myName }));
  };

  let lastMessageDate = "";

  ws.onmessage = async (event) => {
    const data = JSON.parse(
      typeof event.data === "string" ? event.data : await event.data.text()
    );
    const chat = document.getElementById("chat");

    if (data.type === "system") {
      const sys = document.createElement("div");
      sys.className = "system";
      sys.textContent = data.message;
      chat.appendChild(sys);
      chat.scrollTop = chat.scrollHeight;
      return;
    }

    if (data.type === "message") {
      //   const messageDate = new Date();
      const messageDay = new Date(data.timestamp || Date.now());

      const dateKey = messageDay.toDateString();

      // Insert date separator if this is the first message or a new date
      if (dateKey !== lastMessageDate) {
        lastMessageDate = dateKey;
        const dateHeader = document.createElement("div");
        dateHeader.className = "date-label";
        dateHeader.textContent = formatDayLabel(messageDay);
        chat.appendChild(dateHeader);
      }

      const div = document.createElement("div");
      div.classList.add("message");
      div.classList.add(data.sender === myName ? "sender" : "receiver");
      div.innerHTML = `<small>${data.time}</small><br><strong>${data.sender}:</strong> ${data.message}`;
      chat.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
    }
  };

  // Helper to format date as “Today”, “Yesterday”, or full date
  function formatDayLabel(date) {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const dateOnly = date.toDateString();

    if (dateOnly === today.toDateString()) return "Today";
    if (dateOnly === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString();
  }
}

function sendMessage() {
  const input = document.getElementById("msg");
  const message = input.value.trim();
  if (!message) return;

  if (!ws || ws.readyState !== WebSocket.OPEN) {
    alert("⚠️ Connection not open. Please wait or refresh.");
    return;
  }

  ws.send(JSON.stringify({ type: "message", message }));
  input.value = "";
}

document.getElementById("msg").addEventListener("keyup", (e) => {
  if (e.key === "Enter") sendMessage();
});
