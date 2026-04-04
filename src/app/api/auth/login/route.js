import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "../../../../lib/supabase.js";
import { signToken } from "../../../../lib/jwt.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { status: false, response: "email, password wajib" },
        { status: 400 }
      );
    }

    const { data: u, error } = await supabase
      .from("users")
      .select("id, name, email, password_hash")
      .eq("email", email)
      .single();

    if (error || !u) {
      return NextResponse.json(
        { status: false, response: "Email/password salah" },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) {
      return NextResponse.json(
        { status: false, response: "Email/password salah" },
        { status: 401 }
      );
    }

    const user = { id: u.id, name: u.name, email: u.email };
    const token = signToken(user);

    return NextResponse.json({ status: true, response: { user, token } });
  } catch (e) {
    return NextResponse.json(
      { status: false, response: e.message || String(e) },
      { status: 500 }
    );
  }
}
