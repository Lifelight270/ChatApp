const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, "public")));

const users = new Map();

function broadcastJSON(data, except = null) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client !== except && client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

wss.on("connection", (ws) => {
  let username = null;

  ws.on("message", (raw) => {
    const data = JSON.parse(raw);

    if (data.type === "login") {
      username = data.username;

      // Prevent duplicate names
      if ([...users.values()].includes(username)) {
        ws.send(
          JSON.stringify({ type: "system", message: "Username already taken." })
        );
        ws.close();
        return;
      }

      users.set(ws, username);
      broadcastJSON({ type: "system", message: `${username} joined.` }, ws);
    }

    if (data.type === "message" && username) {
      const now = new Date();
      const message = {
        type: "message",
        sender: username,
        message: data.message,
        time: now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestamp: now.toISOString(),
      };

      // ✅ No MongoDB — just broadcast to others
      broadcastJSON(message);
    }
  });

  ws.on("close", () => {
    if (username) {
      users.delete(ws);
      broadcastJSON({ type: "system", message: `${username} left.` });
    }
  });
});

server.listen(3000, () => {
  console.log("✅ Chat server running at http://localhost:3000");
});
