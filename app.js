const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const messagesFilePath = __dirname + "/messages.json";
const maxMessages = 20;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
  console.log("クライアントが接続しました");

  function loadMessages() {
    try {
      const messagesData = fs.readFileSync(messagesFilePath, "utf8");
      return JSON.parse(messagesData);
    } catch (error) {
      console.error("メッセージの読み込みエラー:", error);
      return [];
    }
  }

  function saveMessages(messages) {
    try {
      const data = JSON.stringify(messages.slice(-maxMessages), null, 2);
      fs.writeFileSync(messagesFilePath, data);
    } catch (error) {
      console.error("メッセージの保存エラー:", error);
    }
  }

  socket.on("chat message", (msg) => {
    console.log("メッセージを受信しました: " + msg);

    io.emit("chat message", msg);

    const messages = loadMessages();
    messages.push(msg);
    saveMessages(messages);
  });

  socket.on("disconnect", () => {
    console.log("クライアントが切断しました");
  });

  const initialMessages = loadMessages();
  initialMessages.forEach((msg) => {
    socket.emit("chat message", msg);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で起動しました`);
});
