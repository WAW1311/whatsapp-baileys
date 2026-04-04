import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "ganti_rahasia_jwt";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
