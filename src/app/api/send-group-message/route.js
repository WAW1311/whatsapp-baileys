import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import os from "os";
import { getAuthUser } from "../../../lib/auth.js";
import { getSession, isConnected } from "../../../lib/session.js";

function isGroupJid(id) {
  return String(id || "").endsWith("@g.us");
}

async function safeUnlink(filePath) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
}

export async function POST(request) {
  let filePath = null;
  try {
    const user = getAuthUser(request);
    const userId = String(user.id);
    const sess = getSession(userId);

    if (!sess || !isConnected(userId)) {
      return NextResponse.json(
        { status: false, response: "WhatsApp belum terhubung." },
        { status: 500 }
      );
    }

    const sock = sess.sock;
    const contentType = request.headers.get("content-type") || "";
    let idGroup, message;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      idGroup = formData.get("id_group");
      message = formData.get("message") || "";

      if (!idGroup) {
        return NextResponse.json(
          { status: false, response: "Id Group belum disertakan!" },
          { status: 400 }
        );
      }

      if (!isGroupJid(idGroup)) idGroup = `${idGroup}@g.us`;

      let metadata;
      try {
        metadata = await sock.groupMetadata(idGroup);
      } catch (_) {
        return NextResponse.json(
          { status: false, response: `ID Group ${idGroup} tidak ditemukan / tidak dapat diakses.` },
          { status: 404 }
        );
      }

      const groupJid = metadata?.id;
      if (!groupJid) {
        return NextResponse.json(
          { status: false, response: `ID Group ${idGroup} tidak terdaftar.` },
          { status: 404 }
        );
      }

      const file = formData.get("file_dikirim");
      if (!file || typeof file === "string") {
        const result = await sock.sendMessage(groupJid, { text: message });
        return NextResponse.json({ status: true, response: result });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = path.extname(file.name).toLowerCase();
      const filename = `${Date.now()}_${file.name}`;
      filePath = path.join(os.tmpdir(), filename);
      fs.writeFileSync(filePath, buffer);

      let result;
      if ([".jpeg", ".jpg", ".png", ".gif", ".webp"].includes(ext)) {
        result = await sock.sendMessage(groupJid, { image: { url: filePath }, caption: message });
      } else if ([".mp3", ".ogg"].includes(ext)) {
        result = await sock.sendMessage(groupJid, { audio: { url: filePath }, mimetype: "audio/mp4" });
      } else {
        result = await sock.sendMessage(groupJid, {
          document: { url: filePath },
          mimetype: file.type,
          fileName: file.name,
          caption: message,
        });
      }

      await safeUnlink(filePath);
      return NextResponse.json({ status: true, response: result });
    } else {
      const body = await request.json();
      idGroup = body.id_group;
      message = body.message || "";

      if (!idGroup) {
        return NextResponse.json(
          { status: false, response: "Id Group belum disertakan!" },
          { status: 400 }
        );
      }

      if (!isGroupJid(idGroup)) idGroup = `${idGroup}@g.us`;

      let metadata;
      try {
        metadata = await sock.groupMetadata(idGroup);
      } catch (_) {
        return NextResponse.json(
          { status: false, response: `ID Group ${idGroup} tidak ditemukan / tidak dapat diakses.` },
          { status: 404 }
        );
      }

      const groupJid = metadata?.id;
      if (!groupJid) {
        return NextResponse.json(
          { status: false, response: `ID Group ${idGroup} tidak terdaftar.` },
          { status: 404 }
        );
      }

      const result = await sock.sendMessage(groupJid, { text: message });
      return NextResponse.json({ status: true, response: result });
    }
  } catch (e) {
    if (filePath) await safeUnlink(filePath);
    if (e.message === "Unauthorized") {
      return NextResponse.json(
        { status: false, response: "Unauthorized" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { status: false, response: e.message || String(e) },
      { status: 500 }
    );
  }
}
