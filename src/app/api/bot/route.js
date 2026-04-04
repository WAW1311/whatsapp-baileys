import { NextResponse } from "next/server";
import { getAuthUser } from "../../../lib/auth.js";
import { supabase } from "../../../lib/supabase.js";

export async function GET(request) {
  try {
    const user = getAuthUser(request);
    const userId = user.id;

    const { data: u, error: ue } = await supabase
      .from("users")
      .select("is_makeBot")
      .eq("id", userId)
      .single();

    if (ue || !u) {
      return NextResponse.json(
        { status: false, response: "User not found" },
        { status: 404 }
      );
    }

    const { data: commands, error: ce } = await supabase
      .from("bot_commands")
      .select("id, command, response, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (ce) throw ce;

    return NextResponse.json({
      status: true,
      response: { is_makeBot: !!u.is_makeBot, commands: commands || [] },
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
