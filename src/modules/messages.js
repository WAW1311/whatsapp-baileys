const express = require("express");
const path = require("path");
const fs = require("fs");
const auth = require("../middlewares/auth");
const { getSession, isConnected } = require("./session");

function normalizeNumber(number) {
  const n = String(number || "").replace(/[^\d]/g, "");
  if (n.startsWith("62")) return `${n}@s.whatsapp.net`;
  if (n.startsWith("0")) return `62${n.slice(1)}@s.whatsapp.net`;
  return `62${n}@s.whatsapp.net`;
}

function isGroupJid(id) {
  return String(id || "").endsWith("@g.us");
}

async function safeUnlink(filePath) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
}

function initMessageRoutes(app) {
  const r = express.Router();

  // =========================
  // GET ALL GROUPS
  // =========================
  r.get("/groups", auth, async (req, res) => {
    try {
      const userId = String(req.user.id);
      const sess = getSession(userId);

      if (!sess || !isConnected(userId)) {
        return res.status(500).json({ status: false, response: "WhatsApp belum terhubung." });
      }

      const sock = sess.sock;

      const getGroups = await sock.groupFetchAllParticipating();
      const groups = Object.values(getGroups || {}).map((g) => ({
        id: g.id,
        subject: g.subject,
        subjectOwner: g.subjectOwner || null,
        subjectTime: g.subjectTime || null,
        size: g.size || 0,
        creation: g.creation || null,
        owner: g.owner || null,
        desc: g.desc || ""
      }));

      return res.json({
        status: true,
        response: {
          userId,
          total: groups.length,
          groups
        }
      });
    } catch (e) {
      return res.status(500).json({ status: false, response: e.message || e });
    }
  });

  // =========================
  // SEND PERSONAL MESSAGE
  // =========================
  r.post("/send-message", auth, async (req, res) => {
    try {
      const userId = String(req.user.id);
      const sess = getSession(userId);
      if (!sess || !isConnected(userId)) {
        return res.status(500).json({ status: false, response: "WhatsApp belum terhubung." });
      }

      const sock = sess.sock;
      const message = req.body.message || req.query.message || "";
      const number = req.body.number || req.query.number;
      if (!number) return res.status(400).json({ status: false, response: "Nomor WA belum disertakan!" });

      const jid = normalizeNumber(number);
      const exists = await sock.onWhatsApp(jid);
      const target = exists?.jid || exists?.[0]?.jid;
      if (!target) return res.status(404).json({ status: false, response: `Nomor ${number} tidak terdaftar.` });

      if (!req.files || !req.files.file_dikirim) {
        const result = await sock.sendMessage(target, { text: message });
        return res.json({ status: true, response: result });
      }

      const file = req.files.file_dikirim;
      const filename = `${Date.now()}_${file.name}`;
      const filePath = `./uploads/${filename}`;
      await file.mv(filePath);

      const ext = path.extname(filePath).toLowerCase();
      let result;
      if ([".jpeg", ".jpg", ".png", ".gif", ".webp"].includes(ext)) {
        result = await sock.sendMessage(target, { image: { url: filePath }, caption: message });
      } else if ([".mp3", ".ogg"].includes(ext)) {
        result = await sock.sendMessage(target, { audio: { url: filePath }, mimetype: "audio/mp4" });
      } else {
        result = await sock.sendMessage(target, {
          document: { url: filePath },
          mimetype: file.mimetype,
          fileName: file.name,
          caption: message
        });
      }

      await safeUnlink(filePath);
      return res.json({ status: true, response: result });
    } catch (e) {
      return res.status(500).json({ status: false, response: e.message || e });
    }
  });

  // =========================
  // SEND GROUP MESSAGE
  // =========================
  r.post("/send-group-message", auth, async (req, res) => {
    let filePath = null;

    try {
      const userId = String(req.user.id);
      const sess = getSession(userId);
      if (!sess || !isConnected(userId)) {
        return res.status(500).json({ status: false, response: "WhatsApp belum terhubung." });
      }

      const sock = sess.sock;
      const message = req.body.message || req.query.message || "";
      let idGroup = req.body.id_group || req.query.id_group;

      if (!idGroup) {
        return res.status(400).json({ status: false, response: "Id Group belum disertakan!" });
      }

      if (!isGroupJid(idGroup)) idGroup = `${idGroup}@g.us`;

      let metadata;
      try {
        metadata = await sock.groupMetadata(idGroup);
      } catch (_) {
        return res.status(404).json({
          status: false,
          response: `ID Group ${idGroup} tidak ditemukan / tidak dapat diakses.`
        });
      }

      const groupJid = metadata?.id;
      if (!groupJid) {
        return res.status(404).json({
          status: false,
          response: `ID Group ${idGroup} tidak terdaftar.`
        });
      }

      if (!req.files || !req.files.file_dikirim) {
        const result = await sock.sendMessage(groupJid, { text: message });
        return res.json({ status: true, response: result });
      }

      const file = req.files.file_dikirim;
      const filename = `${Date.now()}_${file.name}`;
      filePath = `./uploads/${filename}`;
      await file.mv(filePath);

      const ext = path.extname(filePath).toLowerCase();
      let result;

      if ([".jpeg", ".jpg", ".png", ".gif", ".webp"].includes(ext)) {
        result = await sock.sendMessage(groupJid, {
          image: { url: filePath },
          caption: message
        });
      } else if ([".mp3", ".ogg"].includes(ext)) {
        result = await sock.sendMessage(groupJid, {
          audio: { url: filePath },
          mimetype: "audio/mp4"
        });
      } else {
        result = await sock.sendMessage(groupJid, {
          document: { url: filePath },
          mimetype: file.mimetype,
          fileName: file.name,
          caption: message
        });
      }

      await safeUnlink(filePath);
      return res.json({ status: true, response: result });
    } catch (e) {
      if (filePath) await safeUnlink(filePath);
      return res.status(500).json({ status: false, response: e.message || e });
    }
  });

  app.use("/api", r);
}

module.exports = { initMessageRoutes };