"use strict";
require("dotenv").config();

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server: SocketServer } = require("socket.io");
const qrcode = require("qrcode");

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT || 8000);

async function bootstrap() {
  // Dynamically import ESM modules
  const { verifyToken } = await import("./src/lib/jwt.js");
  const { startSession, getSession, isConnected } = await import("./src/lib/session.js");
  const { setIo } = await import("./src/lib/socket.js");

  const app = next({ dev });
  const handle = app.getRequestHandler();

  await app.prepare();

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketServer(httpServer, {
    cors: { origin: "*" },
  });

  // Share io instance with API routes via singleton
  setIo(io);

  io.on("connection", (socket) => {
    socket.on("join", async () => {
      let userId;
      try {
        const token = socket.handshake.auth?.token;
        if (!token) return;
        const decoded = verifyToken(token);
        userId = String(decoded.id);
      } catch (_) {
        return;
      }

      socket.join(`user:${userId}`);

      if (isConnected(userId)) {
        socket.emit("qrstatus", "/assets/check.svg");
      } else {
        const s = getSession(userId);
        if (s?.qr) {
          const url = await qrcode.toDataURL(s.qr);
          socket.emit("qr", url);
        } else {
          socket.emit("qrstatus", "/assets/loader.gif");
        }
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Server running on http://localhost:${port}`);
  });
}

bootstrap().catch((e) => {
  console.error("Bootstrap error:", e);
  process.exit(1);
});
