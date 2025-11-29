import dotenv from "dotenv"

dotenv.config()

const requiredEnvVars = ["JWT_SECRET", "MONGODB_URI"]

function validateEnv() {
  const missing = []

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(", ")}`)
    console.error("Please create .env file with all required variables")
    process.exit(1)
  }

  // Validate JWT_SECRET is strong enough
  if (process.env.JWT_SECRET.length < 32) {
    console.error("❌ JWT_SECRET must be at least 32 characters long for security")
    process.exit(1)
  }

  console.log("✅ All required environment variables are set")
}

export const config = {
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  database: {
    uri: process.env.MONGODB_URI,
    name: process.env.DB_NAME || "gold_trading_system",
  },
  server: {
    port: Number.parseInt(process.env.PORT || "5000", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  },
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://localhost:5173").split(","),
  },
  rateLimit: {
    windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
    maxRequests: Number.parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
  },
}

export default config

// Run validation
validateEnv()
