import { NextResponse } from "next/server";
import { getAuthUser } from "../../../../lib/auth.js";
import { supabase } from "../../../../lib/supabase.js";

export async function POST(request) {
  try {
    const user = getAuthUser(request);
    const userId = user.id;

    const body = await request.json();
    const { command, response: botResponse } = body || {};

    if (!command || !botResponse) {
      return NextResponse.json(
        { status: false, response: "command and response are required" },
        { status: 400 }
      );
    }

    const trimmedCommand = String(command).trim();
    const trimmedResponse = String(botResponse).trim();

    if (!trimmedCommand || !trimmedResponse) {
      return NextResponse.json(
        { status: false, response: "command and response cannot be empty" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("bot_commands")
      .insert({ user_id: userId, command: trimmedCommand, response: trimmedResponse })
      .select("id, command, response")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { status: false, response: "Command already exists" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ status: true, response: data }, { status: 201 });
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
