import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "../../../../lib/supabase.js";
import { signToken } from "../../../../lib/jwt.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password } = body || {};

    if (!name || !email || !password) {
      return NextResponse.json(
        { status: false, response: "name, email, password wajib" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json(
        { status: false, response: "Email sudah terdaftar" },
        { status: 409 }
      );
    }

    const hash = await bcrypt.hash(password, 10);

    const { data: newUser, error } = await supabase
      .from("users")
      .insert({ name, email, password_hash: hash, is_makeBot: false })
      .select("id, name, email")
      .single();

    if (error) throw error;

    const user = { id: newUser.id, name: newUser.name, email: newUser.email };
    const token = signToken(user);

    return NextResponse.json({ status: true, response: { user, token } });
  } catch (e) {
    return NextResponse.json(
      { status: false, response: e.message || String(e) },
      { status: 500 }
    );
  }
}
