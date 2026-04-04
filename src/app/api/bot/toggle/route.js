import { NextResponse } from "next/server";
import { getAuthUser } from "../../../../lib/auth.js";
import { supabase } from "../../../../lib/supabase.js";

export async function PUT(request) {
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

    const newVal = !u.is_makeBot;
    const { error: updateError } = await supabase
      .from("users")
      .update({ is_makeBot: newVal })
      .eq("id", userId);

    if (updateError) throw updateError;

    return NextResponse.json({ status: true, response: { is_makeBot: newVal } });
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
