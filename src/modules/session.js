const {
  default: makeWASocket,
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidBroadcast,
  // makeInMemoryStore,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const qrcode = require("qrcode");
const fs = require("fs");
const path = require("path");
// baileys-antiban@1.1.0 adalah ESM-only: field `exports` hanya punya kondisi
// "import", tanpa "require"/"default". Jadi `require('baileys-antiban')` selalu
// gagal (ERR_PACKAGE_PATH_NOT_EXPORTED) di Node versi mana pun. Muat lewat
// dynamic import() (di-cache sekali) lalu di-await di startSession.
let wrapSocketPromise;
function loadWrapSocket() {
  if (!wrapSocketPromise) {
    wrapSocketPromise = import("baileys-antiban").then((m) => m.wrapSocket);
  }
  return wrapSocketPromise;
}
const { pool } = require("../db");

// const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });
const sessions = new Map();

function getSession(userId) {
  return sessions.get(String(userId));
}
function isConnected(userId) {
  return !!getSession(userId)?.sock?.user;
}
function getRawQr(userId) {
  return getSession(userId)?.qr || null;
}
async function getQrDataUrl(userId) {
  const raw = getRawQr(userId);
  if (!raw) return null;
  return qrcode.toDataURL(raw);
}

function deleteAuthDir(userId) {
  const authDir = path.join(process.cwd(), "baileys_auth_info", String(userId));
  if (fs.existsSync(authDir)) {
    fs.rmSync(authDir, { recursive: true, force: true });
  }
}

// --- Persistensi state warm-up anti-ban ---
// baileys-antiban@1.1.0 tidak menulis statePath otomatis, jadi kita simpan/muat
// manual agar progres warm-up tidak reset tiap server restart.
function warmUpStatePath(userId) {
  return path.join(process.cwd(), "baileys_auth_info", String(userId), "warmup.json");
}

function loadWarmUpState(userId) {
  try {
    const raw = fs.readFileSync(warmUpStatePath(userId), "utf8");
    return JSON.parse(raw);
  } catch {
    return undefined; // belum ada / rusak → mulai warm-up baru
  }
}

function saveWarmUpState(userId) {
  const s = getSession(userId);
  if (!s?.sock?.antiban) return;
  try {
    const state = s.sock.antiban.exportWarmUpState();
    const file = warmUpStatePath(userId);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(state));
  } catch (e) {
    console.error(`Gagal menyimpan warm-up state user ${userId}:`, e);
  }
}

function stopWarmUpAutosave(userId) {
  const s = getSession(userId);
  if (s?.saveTimer) {
    clearInterval(s.saveTimer);
    s.saveTimer = null;
  }
}

async function startSession(userId, io) {
  userId = String(userId);
  if (getSession(userId)?.sock) return getSession(userId);

  const authPath = `baileys_auth_info/${userId}`;
  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  const { version } = await fetchLatestBaileysVersion();

  // Konfigurasi anti-ban (profil konservatif). Feed event health monitor
  // di connection.update agar auto-pause bisa aktif saat risiko tinggi.
  const antibanCfg = {
    rateLimiter: {
      maxPerMinute: 5, maxPerHour: 60, maxPerDay: 400,
      minDelayMs: 3000, maxDelayMs: 10000, newChatDelayMs: 8000,
      maxIdenticalMessages: 3, burstAllowance: 2,
    },
    warmUp: {
      warmUpDays: 7, day1Limit: 20, growthFactor: 1.8,
      inactivityThresholdHours: 72,
    },
    health: {
      autoPauseAt: "high",
      onRiskChange: (st) => {
        io.to(`user:${userId}`).emit("log", `Ban-risk: ${st.risk} (skor ${st.score})`);
      },
    },
    logging: true,
  };

  const wrapSocket = await loadWrapSocket();
  const sock = wrapSocket(
    makeWASocket({
      printQRInTerminal: false,
      auth: state,
      logger: pino({ level: "silent" }),
      version,
      browser: Browsers.macOS("Safari"),   // fingerprint wajar & konsisten
      markOnlineOnConnect: false,           // jangan tampil "online" seketika
      syncFullHistory: false,
      shouldIgnoreJid: jid => isJidBroadcast(jid),
    }),
    antibanCfg,
    loadWarmUpState(userId),                 // lanjutkan progres warm-up bila ada
  );

  sessions.set(userId, { sock, qr: null });
  // store.bind(sock.ev);
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      // Only handle incoming private messages (not sent by the bot itself)
      if (msg.key.fromMe) continue;
      const jid = msg.key.remoteJid;
      if (!jid || jid.endsWith("@g.us") || jid.endsWith("@broadcast")) continue;

      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        "";

      if (!text) continue;

      try {
        const [[row]] = await pool.query(
          `SELECT bc.response
           FROM users u
           JOIN bot_commands bc ON bc.user_id = u.id AND bc.command = ?
           WHERE u.id = ? AND u.is_makeBot = 1
           LIMIT 1`,
          [text.trim(), userId]
        );
        if (!row) continue;

        const s = getSession(userId);
        if (s?.sock) {
          await s.sock.sendMessage(jid, { text: row.response });
        }
      } catch (e) {
        console.error(`Bot auto-reply error for user ${userId}:`, e);
      }
    }
  });

  sock.ev.on("connection.update", async (update) => {
    const s = getSession(userId);
    if (!s) return;
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      s.qr = qr;
      const url = await qrcode.toDataURL(qr);
      io.to(`user:${userId}`).emit("qr", url);
      io.to(`user:${userId}`).emit("log", "QR Code received, please scan!");
    }

    if (connection === "open") {
      s.qr = null;
      io.to(`user:${userId}`).emit("qrstatus", "./assets/check.svg");
      io.to(`user:${userId}`).emit("log", "WhatsApp terhubung!");

      // Beri tahu health monitor koneksi pulih, simpan warm-up, & aktifkan
      // autosave berkala (5 menit) agar progres tidak hilang saat crash.
      try { s.sock.antiban?.onReconnect(); } catch (_) { }
      saveWarmUpState(userId);
      if (!s.saveTimer) {
        s.saveTimer = setInterval(() => saveWarmUpState(userId), 5 * 60 * 1000);
        if (s.saveTimer.unref) s.saveTimer.unref();
      }
    }

    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error).output.statusCode;

      // Umpankan disconnect ke health monitor (sumber skor risiko utama),
      // hentikan autosave, dan persist warm-up sebelum session dihapus.
      try { s.sock.antiban?.onDisconnect(reason); } catch (_) { }
      stopWarmUpAutosave(userId);
      saveWarmUpState(userId);

      if (
        reason === DisconnectReason.connectionClosed ||
        reason === DisconnectReason.connectionLost ||
        reason === DisconnectReason.restartRequired ||
        reason === DisconnectReason.timedOut
      ) {
        sessions.delete(userId);
        setTimeout(() => startSession(userId, io).catch(() => { }), 1200);
      } else {
        sessions.delete(userId);
        if (
          reason === DisconnectReason.loggedOut ||
          reason === DisconnectReason.badSession
        ) {
          deleteAuthDir(userId);
        }
      }
    }
  });

  return getSession(userId);
}

async function logoutSession(userId) {
  userId = String(userId);
  const s = getSession(userId);

  stopWarmUpAutosave(userId);

  if (s?.sock) {
    try { await s.sock.logout(); } catch (e) {
      console.error(`Error logging out session for user ${userId}:`, e);
    }
    try { s.sock.end?.(); } catch (e) {
      console.error(`Error closing session for user ${userId}:`, e);
    }
  }

  sessions.delete(userId);

  deleteAuthDir(userId);

  return true;
}

module.exports = {
  startSession,
  getSession,
  isConnected,
  getRawQr,
  getQrDataUrl,
  logoutSession
};