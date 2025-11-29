// server/services/exchangeRateService.js

const EXCHANGE_RATE_API = "https://api.exchangerate-api.com/v4/latest/THB"

export class ExchangeRateService {
  constructor() {
    // 👇 ค่าเริ่มต้น (ใช้ได้ทันที ตอน dev / ตอน API ล่ม)
    // แปลว่า 1 USD = 35 THB
    this.exchangeRates = {
      THB: 1.0,
      USD: 35.0, // เดิมเป็น null → ทำให้ trade เจอ "Exchange rate not available"
    }
    this.updateInterval = null
    this.lastUpdate = null
  }

  // 👉 เพิ่ม getter ให้ compatible กับ trading.js ที่ใช้ lastRates
  get lastRates() {
    return this.exchangeRates
  }

  // Fetch exchange rate from API
  async fetchExchangeRate() {
    try {
      // Try to get USD/THB rate (inverse of THB/USD)
      const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD")
      const data = await response.json()

      if (data && data.rates && data.rates.THB) {
        const thbPerUsd = data.rates.THB
        this.exchangeRates.USD = thbPerUsd
        this.lastUpdate = new Date()
        console.log(`Exchange rate updated: 1 USD = ${thbPerUsd} THB`)
        return this.exchangeRates
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error)
    }

    // Fallback: ใช้ fixed rate ถ้าเรียก API ล้มเหลว
    if (!this.exchangeRates.USD) {
      this.exchangeRates.USD = 35.0 // Fallback rate
      console.log("Using fallback exchange rate: 1 USD = 35 THB")
    }

    return this.exchangeRates
  }

  // Get current exchange rates
  getRates() {
    return { ...this.exchangeRates }
  }

  // Convert THB to USD
  thbToUsd(thbAmount) {
    if (!this.exchangeRates.USD) return null
    return thbAmount / this.exchangeRates.USD
  }

  // Convert USD to THB
  usdToThb(usdAmount) {
    if (!this.exchangeRates.USD) return null
    return usdAmount * this.exchangeRates.USD
  }

  // Start automatic updates (every 1 hour)
  startUpdates() {
    // Initial fetch
    this.fetchExchangeRate()

    // Update every 1 hour
    this.updateInterval = setInterval(() => {
      this.fetchExchangeRate()
    }, 60 * 60 * 1000) // 1 hour

    console.log("Exchange rate service started (updates every 1 hour)")
  }

  stopUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
      console.log("Exchange rate service stopped")
    }
  }
}

export const exchangeRateService = new ExchangeRateService()
