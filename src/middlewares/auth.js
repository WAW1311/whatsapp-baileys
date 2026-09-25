const { verifyToken } = require("../jwt");
const { pool } = require("../db");

// Verifikasi JWT + cek token_version di DB. Token dengan tv lebih lama dari
// users.token_version dianggap sudah dicabut (mis. setelah logout).
module.exports = async function auth(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) return res.status(401).json({ status: false, response: "Unauthorized" });

    const decoded = verifyToken(token);

    const [[user]] = await pool.query(
      "SELECT token_version FROM users WHERE id = ? LIMIT 1",
      [decoded.id]
    );
    if (!user) return res.status(401).json({ status: false, response: "Invalid token" });
    if ((decoded.tv ?? 0) !== user.token_version) {
      return res.status(401).json({ status: false, response: "Token dicabut, silakan login ulang." });
    }

    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ status: false, response: "Invalid token" });
  }
};
