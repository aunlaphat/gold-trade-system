import { getDatabase } from "../config/database.js"
import bcrypt from "bcryptjs"

export class User {
  static collection() {
    return getDatabase().collection("users")
  }

  static async create(userData) {
    const { email, username, password, role = "user" } = userData

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = {
      email,
      username,
      password: hashedPassword,
      role, // Add role field
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    }

    const result = await this.collection().insertOne(user)

    // Create wallet for user with 2 currencies
    const walletsCollection = getDatabase().collection("wallets")
    await walletsCollection.insertOne({
      userId: result.insertedId,
      balance: {
        THB: 0,
        USD: 0,
      },
      goldHoldings: {
        SPOT: 0,
        GOLD_9999: 0,
        GOLD_965: 0,
        GOLD_9999_MTS: 0,
        GOLD_965_MTS: 0,
        GOLD_965_ASSO: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return { ...user, _id: result.insertedId, password: undefined }
  }

  static async findByEmail(email) {
    return await this.collection().findOne({ email })
  }

  static async findByUsername(username) {
    return await this.collection().findOne({ username })
  }

  static async findById(id) {
    const { ObjectId } = await import("mongodb")
    return await this.collection().findOne({ _id: new ObjectId(id) })
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword)
  }
}
