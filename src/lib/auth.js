import { verifyToken } from "./jwt.js";

/**
 * Extract and verify Bearer token from a Next.js Request.
 * Returns the decoded payload or throws an error.
 */
export function getAuthUser(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) throw new Error("Unauthorized");
  return verifyToken(token);
}
