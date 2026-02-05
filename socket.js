const jwt = require("jsonwebtoken");
const cookie = require("cookie");

let io;
const onlineUsers = new Map(); // userId -> socketId

const initSocket = (server) => {
  const { Server } = require("socket.io");

  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // frontend origin
      credentials: true, // ✅ ALLOW COOKIES
    },
  });

  io.use((socket, next) => {
    try {
      const cookieHeader = socket.request.headers.cookie;
      if (!cookieHeader) return next(new Error("No cookies"));

      const cookies = cookie.parse(cookieHeader);
      const token = cookies.jwt; // 🔑 YOUR COOKIE NAME

      if (!token) return next(new Error("No token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;

      next();
    } catch (err) {
      next(new Error("Socket authentication failed"));
    }
  });
  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.userId);
  });

  io.on("connection", (socket) => {
    onlineUsers.set(socket.userId.toString(), socket.id);
    console.log("🟢 Socket connected:", socket.userId);

    socket.on("disconnect", () => {
      onlineUsers.delete(socket.userId.toString());
      console.log("🔴 Socket disconnected:", socket.userId);
    });
  });
};

const sendNotification = (userId, payload) => {
  if (!io) return;

  const socketId = onlineUsers.get(userId.toString());
  if (socketId) {
    io.to(socketId).emit("notification", payload);
  }
};

module.exports = {
  initSocket,
  sendNotification,
};
