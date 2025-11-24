import { getDatabase } from "../config/database.js"

export class Transaction {
  static collection() {
    return getDatabase().collection("transactions")
  }

  static async create(transactionData) {
    const transaction = {
      ...transactionData,
      status: "PENDING", // PENDING, COMPLETED, FAILED, CANCELLED
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await this.collection().insertOne(transaction)
    return { ...transaction, _id: result.insertedId }
  }

  static async findByUserId(userId, limit = 50) {
    const { ObjectId } = await import("mongodb")
    return await this.collection()
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()
  }

  static async updateStatus(transactionId, status) {
    const { ObjectId } = await import("mongodb")
    return await this.collection().updateOne(
      { _id: new ObjectId(transactionId) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      },
    )
  }

  static async createBulk(transactions) {
    const ops = transactions.map((tx) => ({
      ...tx,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    }))

    return await this.collection().insertMany(ops, { ordered: false })
  }
}
