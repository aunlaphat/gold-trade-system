import { MongoClient } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017"
const DB_NAME = process.env.DB_NAME || "gold_trading_system"

let client = null
let db = null

export async function connectDatabase() {
  if (db) return db

  try {
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 100,
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    })

    await client.connect()
    db = client.db(DB_NAME)

    console.log("MongoDB connected successfully")
    return db
  } catch (error) {
    console.error("MongoDB connection error:", error)
    throw error
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error("Database not connected. Call connectDatabase() first.")
  }
  return db
}

export function getClient() {
  if (!client) {
    throw new Error("Database not connected. Call connectDatabase() first.")
  }
  return client
}

export async function closeDatabase() {
  if (client) {
    await client.close()
    client = null
    db = null
    console.log("MongoDB connection closed")
  }
}
