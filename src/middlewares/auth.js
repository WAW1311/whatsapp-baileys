const { verifyToken } = require("../jwt");

module.exports = function auth(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) return res.status(401).json({ status: false, response: "Unauthorized" });
    req.user = verifyToken(token);
    next();
  } catch (e) {
    return res.status(401).json({ status: false, response: "Invalid token" });
  }
};
