import { NextResponse } from "next/server";
import { getAuthUser } from "../../../../lib/auth.js";
import { logoutSession } from "../../../../lib/session.js";

export async function POST(request) {
  try {
    const user = getAuthUser(request);
    const userId = String(user.id);
    await logoutSession(userId);
    return NextResponse.json({
      status: true,
      response: { userId, message: "Session logout & auth folder deleted" },
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
