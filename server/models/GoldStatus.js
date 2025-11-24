import { getDatabase } from "../config/database.js"

export class GoldStatus {
  static collection() {
    return getDatabase().collection("gold_status")
  }

  static async updateStatus(goldType, status) {
    return await this.collection().updateOne(
      { goldType },
      {
        $set: {
          status, // ONLINE, PAUSE, STOP
          lastUpdated: new Date(),
        },
      },
      { upsert: true },
    )
  }

  static async getStatus(goldType) {
    return await this.collection().findOne({ goldType })
  }

  static async getAllStatuses() {
    return await this.collection().find({}).toArray()
  }
}
