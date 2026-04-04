import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import os from "os";
import { getAuthUser } from "../../../lib/auth.js";
import { getSession, isConnected } from "../../../lib/session.js";

function normalizeNumber(number) {
  const n = String(number || "").replace(/[^\d]/g, "");
  if (n.startsWith("62")) return `${n}@s.whatsapp.net`;
  if (n.startsWith("0")) return `62${n.slice(1)}@s.whatsapp.net`;
  return `62${n}@s.whatsapp.net`;
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
    let number, message;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      number = formData.get("number");
      message = formData.get("message") || "";

      if (!number) {
        return NextResponse.json(
          { status: false, response: "Nomor WA belum disertakan!" },
          { status: 400 }
        );
      }

      const jid = normalizeNumber(number);
      const exists = await sock.onWhatsApp(jid);
      const target = exists?.jid || exists?.[0]?.jid;
      if (!target) {
        return NextResponse.json(
          { status: false, response: `Nomor ${number} tidak terdaftar.` },
          { status: 404 }
        );
      }

      const file = formData.get("file_dikirim");
      if (!file || typeof file === "string") {
        const result = await sock.sendMessage(target, { text: message });
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
        result = await sock.sendMessage(target, { image: { url: filePath }, caption: message });
      } else if ([".mp3", ".ogg"].includes(ext)) {
        result = await sock.sendMessage(target, { audio: { url: filePath }, mimetype: "audio/mp4" });
      } else {
        result = await sock.sendMessage(target, {
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
      number = body.number;
      message = body.message || "";

      if (!number) {
        return NextResponse.json(
          { status: false, response: "Nomor WA belum disertakan!" },
          { status: 400 }
        );
      }

      const jid = normalizeNumber(number);
      const exists = await sock.onWhatsApp(jid);
      const target = exists?.jid || exists?.[0]?.jid;
      if (!target) {
        return NextResponse.json(
          { status: false, response: `Nomor ${number} tidak terdaftar.` },
          { status: 404 }
        );
      }

      const result = await sock.sendMessage(target, { text: message });
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
