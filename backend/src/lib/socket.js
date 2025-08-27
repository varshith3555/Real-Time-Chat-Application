import { Server } from "socket.io";
import http from "http";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Determine allowed origins based on environment
const allowedOrigins = process.env.NODE_ENV === "production" 
  ? [
      "https://socketspeak-production.up.railway.app", 
      "http://socketspeak-production.up.railway.app", 
      "https://socketspeak.up.railway.app",
      // Allow all origins in production for testing
      "*"
    ] 
  : ["http://localhost:5173"];

console.log("Socket.IO allowed origins:", allowedOrigins);
console.log("Node ENV:", process.env.NODE_ENV);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 30000,
  forceNew: true
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle image download events
  socket.on("downloadImage", (data) => {
    console.log("Download image event received", data);
    const receiverSocketId = getReceiverSocketId(data.recipientId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("imageDownload", data);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
