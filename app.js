const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// チャットメッセージを保存するJSONファイルのパス
const messagesFilePath = __dirname + "/messages.json";
const maxMessages = 20; // メッセージの最大数

// ホームページの表示
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// クライアントが接続した時の処理
io.on("connection", (socket) => {
  console.log("クライアントが接続しました");

  // チャットメッセージを読み込む関数
  function loadMessages() {
    try {
      const messagesData = fs.readFileSync(messagesFilePath, "utf8");
      return JSON.parse(messagesData);
    } catch (error) {
      console.error("メッセージの読み込みエラー:", error);
      return [];
    }
  }

  // チャットメッセージを保存する関数
  function saveMessages(messages) {
    try {
      const data = JSON.stringify(messages.slice(-maxMessages), null, 2);
      fs.writeFileSync(messagesFilePath, data);
    } catch (error) {
      console.error("メッセージの保存エラー:", error);
    }
  }

  // クライアントからメッセージを受信した時の処理
  socket.on("chat message", (msg) => {
    console.log("メッセージを受信しました: " + msg);

    // 受信したメッセージを全てのクライアントに送信
    io.emit("chat message", msg);

    // 新しいメッセージをJSONファイルに追加して保存
    const messages = loadMessages();
    messages.push(msg);
    saveMessages(messages);
  });

  // クライアントが切断した時の処理
  socket.on("disconnect", () => {
    console.log("クライアントが切断しました");
  });

  // 初期メッセージを読み込んでクライアントに送信
  const initialMessages = loadMessages();
  initialMessages.forEach((msg) => {
    socket.emit("chat message", msg);
  });
});

// サーバーを指定ポートで起動
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で起動しました`);
});
