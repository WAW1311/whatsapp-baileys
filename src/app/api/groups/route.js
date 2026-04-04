import { NextResponse } from "next/server";
import { getAuthUser } from "../../../lib/auth.js";
import { getSession, isConnected } from "../../../lib/session.js";

export async function GET(request) {
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
    const getGroups = await sock.groupFetchAllParticipating();
    const groups = Object.values(getGroups || {}).map((g) => ({
      id: g.id,
      subject: g.subject,
      subjectOwner: g.subjectOwner || null,
      subjectTime: g.subjectTime || null,
      size: g.size || 0,
      creation: g.creation || null,
      owner: g.owner || null,
      desc: g.desc || "",
    }));

    return NextResponse.json({
      status: true,
      response: { userId, total: groups.length, groups },
    });
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
