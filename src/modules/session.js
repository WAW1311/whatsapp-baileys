const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidBroadcast,
  makeInMemoryStore,
  useMultiFileAuthState
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const qrcode = require("qrcode");
const fs = require("fs");
const path = require("path");

const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });
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

async function startSession(userId, io) {
  userId = String(userId);
  if (getSession(userId)?.sock) return getSession(userId);

  const authPath = `baileys_auth_info/${userId}`;
  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    printQRInTerminal: false,
    auth: state,
    logger: pino({ level: "silent" }),
    version,
    shouldIgnoreJid: jid => isJidBroadcast(jid),
  });

  sessions.set(userId, { sock, qr: null });
  store.bind(sock.ev);
  sock.ev.on("creds.update", saveCreds);

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
    }

    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error).output.statusCode;
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