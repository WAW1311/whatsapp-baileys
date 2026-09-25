const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../db");
const { signToken } = require("../jwt");
const auth = require("../middlewares/auth");

function initAuthRoutes(app) {
  const r = express.Router();

  r.post("/register", async (req, res) => {
    try {
      const { name, email, password } = req.body || {};
      if (!name || !email || !password) return res.status(400).json({ status: false, response: "name,email,password wajib" });

      const emailStr = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
        return res.status(400).json({ status: false, response: "Format email tidak valid" });
      }
      if (String(password).length < 8) {
        return res.status(400).json({ status: false, response: "Password minimal 8 karakter" });
      }

      const [exists] = await pool.query("SELECT id FROM users WHERE email=? LIMIT 1", [emailStr]);
      if (exists.length) return res.status(409).json({ status: false, response: "Email sudah terdaftar" });

      const hash = await bcrypt.hash(password, 10);
      const [ins] = await pool.query("INSERT INTO users(name,email,password_hash) VALUES (?,?,?)", [name, emailStr, hash]);

      const user = { id: ins.insertId, name, email: emailStr };
      const token = signToken({ ...user, tv: 0 });
      return res.json({ status: true, response: { user, token } });
    } catch (e) {
      console.error("register error:", e);
      return res.status(500).json({ status: false, response: "Registrasi gagal." });
    }
  });

  r.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) return res.status(400).json({ status: false, response: "email,password wajib" });

      const emailStr = String(email).trim().toLowerCase();
      const [rows] = await pool.query("SELECT * FROM users WHERE email=? LIMIT 1", [emailStr]);
      if (!rows.length) return res.status(401).json({ status: false, response: "Email/password salah" });

      const u = rows[0];
      const ok = await bcrypt.compare(password, u.password_hash);
      if (!ok) return res.status(401).json({ status: false, response: "Email/password salah" });

      const user = { id: u.id, name: u.name, email: u.email };
      const token = signToken({ ...user, tv: u.token_version ?? 0 });
      return res.json({ status: true, response: { user, token } });
    } catch (e) {
      console.error("login error:", e);
      return res.status(500).json({ status: false, response: "Login gagal." });
    }
  });

  r.get("/me", auth, (req, res) => res.json({ status: true, response: req.user }));

  // POST /logout — cabut semua token milik user dengan menaikkan token_version.
  r.post("/logout", auth, async (req, res) => {
    try {
      await pool.query("UPDATE users SET token_version = token_version + 1 WHERE id = ?", [req.user.id]);
      return res.json({ status: true, response: { message: "Logout berhasil, semua token dicabut." } });
    } catch (e) {
      console.error("auth/logout error:", e);
      return res.status(500).json({ status: false, response: "Logout gagal." });
    }
  });

  app.use("/api/auth", r);
}

module.exports = { initAuthRoutes };
