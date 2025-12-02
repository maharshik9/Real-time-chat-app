const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Store active users per room
let activeUsers = {};

const generateColor = () => {
  const colors = ["#FF6B6B", "#4ECDC4", "#FFD93D", "#1A73E8", "#7F00FF", "#00C851"];
  return colors[Math.floor(Math.random() * colors.length)];
};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // User joins a room
  socket.on("join_room", ({ room, username }) => {
    socket.join(room);

    const userColor = generateColor();

    // Ensure room list exists
    if (!activeUsers[room]) activeUsers[room] = [];

    activeUsers[room].push({
      id: socket.id,
      username,
      color: userColor,
    });

    // Save to socket for quick access later
    socket.username = username;
    socket.room = room;
    socket.color = userColor;

    console.log(`${username} joined room ${room}`);

    io.to(room).emit("update_user_list", activeUsers[room]);
  });

  // Receive a message
  socket.on("send_message", (data) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    io.to(data.room).emit("receive_message", {
      username: data.username,
      message: data.message,
      color: socket.color,
      time,
    });
  });

  // User disconnects
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    const room = socket.room;
    if (!room) return;

    // Remove user from room
    if (activeUsers[room]) {
      activeUsers[room] = activeUsers[room].filter((user) => user.id !== socket.id);

      io.to(room).emit("update_user_list", activeUsers[room]);
    }
  });
});

server.listen(3001, () => {
  console.log("Server running on port 3001");
});
