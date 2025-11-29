import { MongoClient } from "mongodb"
import { config } from "./env.js"
import logger from "../utils/logger.js"

const MONGODB_URI = config.database.uri
const DB_NAME = config.database.name

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

    await createIndexes()

    logger.info("MongoDB connected successfully", { database: DB_NAME })
    return db
  } catch (error) {
    logger.error("MongoDB connection error", { error: error.message })
    throw error
  }
}

async function createIndexes() {
  try {
    // Index for user lookups
    await db.collection("users").createIndex({ email: 1 }, { unique: true })
    await db.collection("users").createIndex({ username: 1 }, { unique: true })

    // Index for wallet lookups
    await db.collection("wallets").createIndex({ userId: 1 }, { unique: true })

    // Index for transaction queries
    await db.collection("transactions").createIndex({ userId: 1, createdAt: -1 })
    await db.collection("transactions").createIndex({ status: 1, createdAt: -1 })

    // Index for gold status
    await db.collection("gold_statuses").createIndex({ goldType: 1 }, { unique: true })

    // Index for price history
    await db.collection("price_history").createIndex({ goldType: 1, timestamp: -1 })

    logger.info("Database indexes created successfully")
  } catch (error) {
    logger.warn("Index creation warning", { error: error.message })
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
    logger.info("MongoDB connection closed")
  }
}
