const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const socketio = require("socket.io");

const cfg = require("./src/config");
const { initDb } = require("./src/db");
const auth = require("./src/middlewares/auth");
const { initAuthRoutes } = require("./src/modules/auth");
const { initMessageRoutes } = require("./src/modules/messages");
const { startSession, getSession, isConnected, getQrDataUrl, logoutSession } = require("./src/modules/session");

async function bootstrap() {
  await initDb();

  const app = express();
  app.use(fileUpload({ createParentPath: true }));
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use("/assets", express.static(__dirname + "/client/assets"));
  app.get("/scan", (req, res) => res.sendFile("./client/server.html", { root: __dirname }));
  app.get("/", (req, res) => res.sendFile("./client/index.html", { root: __dirname }));
  app.get("/health", (_, res) => res.json({ status: true, response: "OK" }));

  const server = http.createServer(app);
  const io = socketio(server);

  io.on("connection", (socket) => {
    socket.on("join", async ({ userId }) => {
      if (!userId) return;
      userId = String(userId);
      socket.join(`user:${userId}`);

      const s = getSession(userId);
      if (isConnected(userId)) socket.emit("qrstatus", "./assets/check.svg");
      else if (s?.qr) {
        const qrcode = require("qrcode");
        const url = await qrcode.toDataURL(s.qr);
        socket.emit("qr", url);
      } else socket.emit("qrstatus", "./assets/loader.gif");
    });
  });

  initAuthRoutes(app);
  initMessageRoutes(app);

  app.post("/api/session/start", auth, async (req, res) => {
    try {
      const userId = String(req.body.userId || req.user.id);
      await startSession(userId, io);
      res.json({ status: true, response: { userId } });
    } catch (e) {
      res.status(500).json({ status: false, response: e.message || e });
    }
  });

  app.get("/api/session/qr", auth, async (req, res) => {
    try {
      const userId = String(req.query.userId || req.user.id);

      if (!getSession(userId)) {
        await startSession(userId, io);
      }

      const qr = await getQrDataUrl(userId);
      if (!qr) {
        return res.status(404).json({
          status: false,
          response: "QR belum tersedia / session sudah terhubung"
        });
      }

      return res.json({
        status: true,
        response: { userId, qr }
      });
    } catch (e) {
      return res.status(500).json({ status: false, response: e.message || e });
    }
  });

  app.post("/api/session/logout", auth, async (req, res) => {
    try {
      const userId = String(req.body.userId || req.user.id);
      await logoutSession(userId, io);
      return res.json({
        status: true,
        response: { userId, message: "Session logout & auth folder deleted" }
      });
    } catch (e) {
      return res.status(500).json({ status: false, response: e.message || e });
    }
  });

  server.listen(cfg.PORT, () => {
    console.log("Server Berjalan pada Port : " + cfg.PORT);
  });
}

bootstrap().catch((e) => {
  console.error("Bootstrap error:", e);
  process.exit(1);
});
