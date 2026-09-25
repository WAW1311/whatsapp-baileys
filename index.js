const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bodyParser = require("body-parser");
const http = require("http");
const socketio = require("socket.io");

const cfg = require("./src/config");
const { initDb, pool } = require("./src/db");
const auth = require("./src/middlewares/auth");
const { initAuthRoutes } = require("./src/modules/auth");
const { initMessageRoutes } = require("./src/modules/messages");
const { initBotRoutes } = require("./src/modules/bot");
const { startSession, getSession, isConnected, getQrDataUrl, logoutSession } = require("./src/modules/session");
const { verifyToken } = require("./src/jwt");

async function bootstrap() {
  await initDb();

  const app = express();

  // Di belakang reverse proxy (mis. nginx) — perlu agar rate-limit membaca IP asli.
  app.set("trust proxy", 1);

  // Origin yang diizinkan. Kosong = izinkan semua (khusus dev) + peringatan.
  const corsOrigins = cfg.CORS_ORIGIN
    ? cfg.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean)
    : null;
  if (!corsOrigins) {
    console.warn("WARN: CORS_ORIGIN kosong — semua origin diizinkan. Set CORS_ORIGIN di .env untuk produksi.");
  }
  const corsOptions = { origin: corsOrigins || true };

  // Header keamanan. CSP dimatikan agar tidak memblok halaman statis /scan & /.
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));
  app.use(cors(corsOptions));

  app.use(fileUpload({
    createParentPath: true,
    safeFileNames: true,
    preserveExtension: true,
    abortOnLimit: true,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  }));
  app.use(bodyParser.json({ limit: "1mb" }));
  app.use(bodyParser.urlencoded({ extended: true, limit: "1mb" }));

  // Rate limit ketat untuk auth (anti brute-force / spam register).
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: false, response: "Terlalu banyak percobaan. Coba lagi nanti." },
  });
  app.use(["/api/auth/login", "/api/auth/register"], authLimiter);

  // Rate limit umum yang longgar untuk seluruh API (guard abuse tanpa mengganggu polling QR).
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: false, response: "Terlalu banyak permintaan. Coba lagi nanti." },
  });
  app.use("/api", apiLimiter);

  app.use("/assets", express.static(__dirname + "/client/assets"));
  app.get("/scan", (req, res) => res.sendFile("./client/server.html", { root: __dirname }));
  app.get("/", (req, res) => res.sendFile("./client/index.html", { root: __dirname }));
  app.get("/health", (_, res) => res.json({ status: true, response: "OK" }));

  const server = http.createServer(app);
  const io = socketio(server, { cors: corsOptions });

  io.on("connection", (socket) => {
    socket.on("join", async () => {
      let userId;
      try {
        const token = socket.handshake.auth?.token;
        if (!token) return;
        const decoded = verifyToken(token);
        const [[u]] = await pool.query("SELECT token_version FROM users WHERE id = ? LIMIT 1", [decoded.id]);
        if (!u || (decoded.tv ?? 0) !== u.token_version) return;
        userId = String(decoded.id);
      } catch (_) {
        return;
      }
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
  initBotRoutes(app);

  app.post("/api/session/start", auth, async (req, res) => {
    try {
      const userId = String(req.user.id);
      await startSession(userId, io);
      res.json({ status: true, response: { userId } });
    } catch (e) {
      console.error("session/start error:", e);
      res.status(500).json({ status: false, response: "Gagal memulai session." });
    }
  });

  app.get("/api/session/qr", auth, async (req, res) => {
    try {
      const userId = String(req.user.id);

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
      console.error("session/qr error:", e);
      return res.status(500).json({ status: false, response: "Gagal mengambil QR." });
    }
  });

  app.post("/api/session/logout", auth, async (req, res) => {
    try {
      const userId = String(req.user.id);
      await logoutSession(userId, io);
      return res.json({
        status: true,
        response: { userId, message: "Session logout & auth folder deleted" }
      });
    } catch (e) {
      console.error("session/logout error:", e);
      return res.status(500).json({ status: false, response: "Gagal logout session." });
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
