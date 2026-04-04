import { NextResponse } from "next/server";
import { getAuthUser } from "../../../../lib/auth.js";
import { getSession, getQrDataUrl, startSession } from "../../../../lib/session.js";
import { getIo } from "../../../../lib/socket.js";

export async function GET(request) {
  try {
    const user = getAuthUser(request);
    const userId = String(user.id);
    const io = getIo();

    if (!getSession(userId)) {
      await startSession(userId, io);
    }

    const qr = await getQrDataUrl(userId);
    if (!qr) {
      return NextResponse.json(
        { status: false, response: "QR belum tersedia / session sudah terhubung" },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: true, response: { userId, qr } });
  } catch (e) {
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
