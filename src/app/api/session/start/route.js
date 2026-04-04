import { NextResponse } from "next/server";
import { getAuthUser } from "../../../../lib/auth.js";
import { startSession } from "../../../../lib/session.js";
import { getIo } from "../../../../lib/socket.js";

export async function POST(request) {
  try {
    const user = getAuthUser(request);
    const userId = String(user.id);
    const io = getIo();
    await startSession(userId, io);
    return NextResponse.json({ status: true, response: { userId } });
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
