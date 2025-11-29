import rateLimit from "express-rate-limit"
import { config } from "../config/env.js"

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { error: "Too many requests", details: "Please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
})

// Stricter limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 attempts per window
  skipSuccessfulRequests: true, // Don't count successful logins
  message: {
    error: "Too many authentication attempts",
    details: "Please try again after 15 minutes",
  },
})

// Stricter limiter for trading endpoints
export const tradeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Max 20 trades per minute
  message: {
    error: "Trading rate limit exceeded",
    details: "Please slow down your trading frequency",
  },
})
