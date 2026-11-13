const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const config = require('../configs/config');

let io;
// userId -> Set<socketId>  (multi-tab / multi-device support)
const onlineUsers = new Map();

// Client se aane wali chatId sirf chhoti string honi chahiye
const isValidChatId = (value) =>
  typeof value === "string" && value.length > 0 && value.length <= 100;

function initializeSocket(server) {
  io = new Server(server, {
    cors: { origin: config.CLIENT_URL, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Unauthorized"));

      const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user_${socket.userId}`);
    
    const wasOffline = !onlineUsers.has(socket.userId);

    if (!onlineUsers.has(socket.userId)) {
      onlineUsers.set(socket.userId, new Set());
    }
    onlineUsers.get(socket.userId).add(socket.id);

    socket.emit("onlineUsersList", Array.from(onlineUsers.keys()));

    // sirf tab/device ka pehla connection hone par hi "online" broadcast karo
    if (wasOffline) {
      socket.broadcast.emit("userOnline", socket.userId);
    }

    // NOTE: payload undefined/galat ho to pehle ye handlers TypeError throw karte the
    // (destructuring), jo poora server gira sakta tha. Ab har handler payload check karta hai.
    socket.on("joinChat", (chatId) => {
      if (isValidChatId(chatId)) socket.join(chatId);
    });

    socket.on("leaveChat", (chatId) => {
      if (isValidChatId(chatId)) socket.leave(chatId);
    });

    socket.on("typing", (payload) => {
      const chatId = payload?.chatId;
      if (!isValidChatId(chatId)) return;
      socket.to(chatId).emit("typing", { chatId, senderId: socket.userId });
    });

    socket.on("stopTyping", (payload) => {
      const chatId = payload?.chatId;
      if (!isValidChatId(chatId)) return;
      socket.to(chatId).emit("stopTyping", { chatId, senderId: socket.userId });
    });

    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(socket.userId);
      if (!sockets) return;

      sockets.delete(socket.id);

      // sirf tab jab is user ka koi bhi connection baqi na bache, tab hi offline mark karo
      if (sockets.size === 0) {
        onlineUsers.delete(socket.userId);
        io.emit("userOffline", socket.userId);
      }
    });
  });
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

// Ab ye ek user ke SAB active socket ids ka array return karta hai (empty array agar offline)
function getReceiverSocketId(userId) {
  const sockets = onlineUsers.get(userId.toString());
  return sockets ? Array.from(sockets) : [];
}

module.exports = { initializeSocket, getIO, getReceiverSocketId };