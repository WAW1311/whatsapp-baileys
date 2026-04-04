import {
  default as makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidBroadcast,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import pino from "pino";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode";
import fs from "fs";
import path from "path";
import { wrapSocket } from "baileys-antiban";
import { supabase } from "./supabase.js";

const sessions = new Map();

export function getSession(userId) {
  return sessions.get(String(userId));
}

export function isConnected(userId) {
  return !!getSession(userId)?.sock?.user;
}

export function getRawQr(userId) {
  return getSession(userId)?.qr || null;
}

export async function getQrDataUrl(userId) {
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

export async function startSession(userId, io) {
  userId = String(userId);
  if (getSession(userId)?.sock) return getSession(userId);

  const authPath = `baileys_auth_info/${userId}`;
  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = wrapSocket(
    makeWASocket({
      printQRInTerminal: false,
      auth: state,
      logger: pino({ level: "silent" }),
      version,
      shouldIgnoreJid: (jid) => isJidBroadcast(jid),
    })
  );

  sessions.set(userId, { sock, qr: null });
  sock.ev.on("creds.update", saveCreds);

  // Auto-reply bot handler
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      const jid = msg.key.remoteJid;
      if (!jid || jid.endsWith("@g.us") || jid.endsWith("@broadcast")) continue;

      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        "";
      if (!text) continue;

      try {
        const { data: user } = await supabase
          .from("users")
          .select("is_makeBot")
          .eq("id", userId)
          .single();

        if (!user || !user.is_makeBot) continue;

        const { data: cmd } = await supabase
          .from("bot_commands")
          .select("response")
          .eq("user_id", userId)
          .eq("command", text.trim())
          .single();

        if (!cmd) continue;

        const s = getSession(userId);
        if (s?.sock) {
          await s.sock.sendMessage(jid, { text: cmd.response });
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
      if (io) {
        io.to(`user:${userId}`).emit("qr", url);
        io.to(`user:${userId}`).emit("log", "QR Code received, please scan!");
      }
    }

    if (connection === "open") {
      s.qr = null;
      if (io) {
        io.to(`user:${userId}`).emit("qrstatus", "/assets/check.svg");
        io.to(`user:${userId}`).emit("log", "WhatsApp terhubung!");
      }
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
        setTimeout(() => startSession(userId, io).catch(() => {}), 1200);
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

export async function logoutSession(userId) {
  userId = String(userId);
  const s = getSession(userId);

  if (s?.sock) {
    try {
      await s.sock.logout();
    } catch (e) {
      console.error(`Error logging out session for user ${userId}:`, e);
    }
    try {
      s.sock.end?.();
    } catch (e) {
      console.error(`Error closing session for user ${userId}:`, e);
    }
  }

  sessions.delete(userId);
  deleteAuthDir(userId);
  return true;
}
