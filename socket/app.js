import express from "express";
import dotenv from "dotenv";
import { createServer } from "https";
import { readFileSync } from "fs";
import { Server } from "socket.io";
import cors from "cors";

dotenv.config();

const SOCKET_PORT = 8080;
const app = express();
const server = createServer(
  {
    key: readFileSync(process.env.KEY),
    cert: readFileSync(process.env.CERT),
  },
  app
);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
  allowEIO3: true,
});
app.use(cors());
io.on("connection", (socket) => {
  socket.on("join", ({ userId }) => {
    socket.join(userId ? userId : socket.id);
  });
  socket.on("userToAdmin", (message) => {
    const { content } = message;
    const id = message?.data?.userId ?? socket.id;
    io.emit("admin", { data: { id, content } });
  });
  socket.on("adminToUser", (message) => {
    const { userId, content } = message;
    io.to(userId).emit("user", { data: { content } });
  });
  socket.on("message", (messageObj) => {
    const { from, to, message } = messageObj;
    io.emit("message", { data: { from, to, message } });
  });
});
server.listen(SOCKET_PORT || 8080, () =>
  console.log(`Socket listen on ${SOCKET_PORT || 8080}`)
);
