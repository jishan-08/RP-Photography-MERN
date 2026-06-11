import jwt from "jsonwebtoken";

export function createToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role, name: user.name },
    process.env.JWT_SECRET || "development-secret",
    { expiresIn: "12h" }
  );
}

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Authentication required" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "development-secret");
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired session" });
  }
}
