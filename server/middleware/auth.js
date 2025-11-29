import jwt from "jsonwebtoken"
import { config } from "../config/env.js"
import { AppError } from "./errorHandler.js"
import logger from "../utils/logger.js"

const JWT_SECRET = config.jwt.secret

export function generateToken(userId, role = "user") {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: config.jwt.expiresIn })
}

export function generateRefreshToken(userId, role = "user") {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: config.jwt.refreshExpiresIn })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    logger.warn("Token verification failed", { error: error.message })
    return null
  }
}

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("No token provided", 401)
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded) {
      throw new AppError("Invalid or expired token", 401)
    }

    req.userId = decoded.userId
    req.userRole = decoded.role
    next()
  } catch (error) {
    next(error)
  }
}

export function adminAuthMiddleware(req, res, next) {
  if (req.userRole !== "admin") {
    throw new AppError("Access denied: Admin privileges required", 403)
  }
  next()
}
