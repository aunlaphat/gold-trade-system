import { GoldStatus } from "../models/GoldStatus.js"

export class GoldStatusService {
  constructor() {
    this.subscribers = new Set()
    this.lastStatuses = new Map() // Store last known statuses
  }

  async initializeStatuses() {
    const allStatuses = await GoldStatus.getAllStatuses()
    allStatuses.forEach(s => this.lastStatuses.set(s.goldType, s.status))
    console.log("[GoldStatusService] Initialized with statuses:", Object.fromEntries(this.lastStatuses))
  }

  async updateAndNotifyStatus(goldType, newStatus) {
    await GoldStatus.updateStatus(goldType, newStatus)
    this.lastStatuses.set(goldType, newStatus)
    const updatedStatus = { goldType, status: newStatus }
    this.notifySubscribers(updatedStatus)
    console.log(`[GoldStatusService] Status for ${goldType} updated to ${newStatus} and broadcasted.`)
  }

  subscribe(callback) {
    this.subscribers.add(callback)
    // Immediately send all last known statuses to new subscriber
    this.lastStatuses.forEach((status, goldType) => {
      try {
        callback({ goldType, status })
      } catch (err) {
        console.error("Error in immediate status subscribe callback:", err)
      }
    })
    return () => this.subscribers.delete(callback)
  }

  notifySubscribers(payload) {
    this.subscribers.forEach((callback) => {
      try {
        callback(payload)
      } catch (error) {
        console.error("Error notifying status subscriber:", error)
      }
    })
  }
}

export const goldStatusService = new GoldStatusService()
