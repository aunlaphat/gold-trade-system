import { getDatabase } from "../config/database.js"

export class GoldPrice {
  static collection() {
    return getDatabase().collection("gold_prices")
  }

  static historyCollection() {
    return getDatabase().collection("price_history")
  }

  static async updatePrice(goldType, priceData) {
    const price = {
      goldType,
      ...priceData,
      lastUpdated: new Date(),
    }

    // Update current price
    await this.collection().updateOne({ goldType }, { $set: price }, { upsert: true })

    // Save to history for charts
    await this.historyCollection().insertOne({
      goldType,
      ...priceData,
      timestamp: new Date(),
    })

    return price
  }

  static async getCurrentPrices() {
    return await this.collection().find({}).toArray()
  }

  static async getPriceHistory(goldType, fromTimestamp, toTimestamp) {
    const query = { goldType }

    if (fromTimestamp || toTimestamp) {
      query.timestamp = {}
      if (fromTimestamp) query.timestamp.$gte = new Date(fromTimestamp * 1000)
      if (toTimestamp) query.timestamp.$lte = new Date(toTimestamp * 1000)
    }

    return await this.historyCollection().find(query).sort({ timestamp: 1 }).toArray()
  }
}
