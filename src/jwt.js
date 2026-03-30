const jwt = require("jsonwebtoken");
const cfg = require("./config");

function signToken(payload) {
  return jwt.sign(payload, cfg.JWT_SECRET, { expiresIn: cfg.JWT_EXPIRES });
}
function verifyToken(token) {
  return jwt.verify(token, cfg.JWT_SECRET);
}

module.exports = { signToken, verifyToken };
