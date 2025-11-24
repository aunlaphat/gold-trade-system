import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export function generateToken(userId, role = "user") {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "1h" }) // Token expires in 1 hour
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" })
    }

    req.userId = decoded.userId
    req.userRole = decoded.role // Attach user role to request
    next()
  } catch (error) {
    console.error("Auth middleware error:", error)
    res.status(401).json({ error: "Authentication failed" })
  }
}

export function adminAuthMiddleware(req, res, next) {
  if (req.userRole !== "admin") {
    return res.status(403).json({ error: "Access denied: Admin privileges required" })
  }
  next()
}
