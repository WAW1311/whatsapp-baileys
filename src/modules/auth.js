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

      const [exists] = await pool.query("SELECT id FROM users WHERE email=? LIMIT 1", [email]);
      if (exists.length) return res.status(409).json({ status: false, response: "Email sudah terdaftar" });

      const hash = await bcrypt.hash(password, 10);
      const [ins] = await pool.query("INSERT INTO users(name,email,password_hash) VALUES (?,?,?)", [name, email, hash]);

      const user = { id: ins.insertId, name, email };
      const token = signToken(user);
      return res.json({ status: true, response: { user, token } });
    } catch (e) {
      return res.status(500).json({ status: false, response: e.message || e });
    }
  });

  r.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) return res.status(400).json({ status: false, response: "email,password wajib" });

      const [rows] = await pool.query("SELECT * FROM users WHERE email=? LIMIT 1", [email]);
      if (!rows.length) return res.status(401).json({ status: false, response: "Email/password salah" });

      const u = rows[0];
      const ok = await bcrypt.compare(password, u.password_hash);
      if (!ok) return res.status(401).json({ status: false, response: "Email/password salah" });

      const user = { id: u.id, name: u.name, email: u.email };
      const token = signToken(user);
      return res.json({ status: true, response: { user, token } });
    } catch (e) {
      return res.status(500).json({ status: false, response: e.message || e });
    }
  });

  r.get("/me", auth, (req, res) => res.json({ status: true, response: req.user }));

  app.use("/api/auth", r);
}

module.exports = { initAuthRoutes };
