import { NextResponse } from "next/server";
import { getAuthUser } from "../../../../lib/auth.js";
import { supabase } from "../../../../lib/supabase.js";

export async function GET(request) {
  try {
    const decoded = getAuthUser(request);

    const { data: u, error } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", decoded.id)
      .single();

    if (error || !u) {
      return NextResponse.json(
        { status: false, response: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: true, response: u });
  } catch (e) {
    return NextResponse.json(
      { status: false, response: "Unauthorized" },
      { status: 401 }
    );
  }
}
