/**
 * MongoDB Database Schema Setup Script
 * Run this script to initialize the database with all required collections
 */

import { MongoClient } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017"
const DB_NAME = "gold_trading_system" // ตั้งชื่อ db

async function setupDatabase() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect() // เชื่อมต่อ db ตามที่ config ไว้ 
    console.log("Connected to MongoDB")

    const db = client.db(DB_NAME)

    // Create Collections
    const collections = ["users", "wallets", "transactions", "gold_prices", "gold_status", "price_history"]

    for (const collectionName of collections) {
      const exists = await db.listCollections({ name: collectionName }).hasNext()
      if (!exists) {
        await db.createCollection(collectionName)
        console.log(`Created collection: ${collectionName}`)
      }
    }

    // Create Indexes
    await db.collection("users").createIndexes([
      { key: { email: 1 }, unique: true },
      { key: { username: 1 }, unique: true },
    ])

    await db.collection("wallets").createIndexes([{ key: { userId: 1 }, unique: true }])

    await db
      .collection("transactions")
      .createIndexes([
        { key: { userId: 1 } },
        { key: { createdAt: -1 } },
        { key: { status: 1 } },
        { key: { goldType: 1 } },
      ])

    await db.collection("gold_prices").createIndexes([{ key: { goldType: 1 }, unique: true }])

    await db.collection("gold_status").createIndexes([{ key: { goldType: 1 }, unique: true }])

    await db
      .collection("price_history")
      .createIndexes([{ key: { goldType: 1, timestamp: -1 } }, { key: { timestamp: -1 } }])

    // Initialize Gold Status
    const goldTypes = ["SPOT", "GOLD_9999", "GOLD_965"]
    for (const goldType of goldTypes) {
      await db.collection("gold_status").updateOne(
        { goldType },
        {
          $setOnInsert: {
            goldType,
            status: "ONLINE", // ONLINE, PAUSE, STOP
            lastUpdated: new Date(),
          },
        },
        { upsert: true },
      )
    }

    console.log("Database setup completed successfully")
  } catch (error) {
    console.error("Database setup error:", error)
    throw error
  } finally {
    await client.close()
  }
}

setupDatabase()
