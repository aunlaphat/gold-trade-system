const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

class ApiClient {
  private token: string | null = null

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headersObj: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    }

    const currentToken = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (currentToken) {
      headersObj["Authorization"] = `Bearer ${currentToken}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: headersObj,
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type") || ""
      let errorMsg = response.statusText || "Request failed"
      try {
        if (contentType.includes("application/json")) {
          const errBody = await response.json()
          // Prioritize 'error' and 'details' fields from our standardized backend errors
          errorMsg = errBody?.error || errBody?.message || JSON.stringify(errBody)
          const errorDetails = errBody?.details || errorMsg
          const customError = new Error(errorMsg) as any
          customError.details = errorDetails
          throw customError
        } else {
          const text = await response.text()
          errorMsg = text ? (text.length > 200 ? text.slice(0, 200) + "..." : text) : errorMsg
          throw new Error(errorMsg || `HTTP ${response.status}`)
        }
      } catch (e) {
        // If parsing JSON or text fails, or if customError is thrown, re-throw it
        if (e instanceof Error && (e as any).details) {
          throw e
        }
        throw new Error(errorMsg || `HTTP ${response.status}`)
      }
    }

    const contentType = response.headers.get("content-type") || ""
    if (contentType.includes("application/json")) return response.json()
    return response.text()
  }

  // Auth
  async register(email: string, username: string, password: string) {
    return this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, username, password }),
    })
  }

  async login(email: string, password: string) {
    const response = await this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    this.setToken(response.token)
    return response
  }

  // Wallet
  async getWallet() {
    return this.request("/api/wallet")
  }

  async deposit(amount: number) {
    return this.request("/api/wallet/deposit", {
      method: "POST",
      body: JSON.stringify({ amount }),
    })
  }

  async withdraw(amount: number) {
    return this.request("/api/wallet/withdraw", {
      method: "POST",
      body: JSON.stringify({ amount }),
    })
  }

  async exchangeCurrency(data: { fromCurrency: string; toCurrency: string; amount: number }) {
    return this.request("/api/wallet/exchange", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Prices
  async getCurrentPrices() {
    return this.request("/api/prices/current")
  }

  async getPriceHistory(goldType: string, from?: number, to?: number) {
    const params = new URLSearchParams()
    if (from) params.append("from", from.toString())
    if (to) params.append("to", to.toString())
    return this.request(`/api/prices/history/${goldType}?${params.toString()}`)
  }

  // Admin (Status)
  async getStatuses() {
    return this.request("/api/admin/status")
  }

  async updateStatus(goldType: string, status: string) {
    return this.request(`/api/admin/status/${goldType}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    })
  }

  async executeTrade(goldType: string, action: "BUY" | "SELL", amount: number, currency: "THB" | "USD") {
    return this.request("/api/trading/execute", {
      method: "POST",
      body: JSON.stringify({ goldType, action, amount, currency }),
    })
  }

  async getTransactionHistory() {
    return this.request("/api/trading/history")
  }

  async executeBulkTrades(trades: any[]) {
    return this.request("/api/trading/execute-bulk", {
      method: "POST",
      body: JSON.stringify({ trades }),
    })
  }
}

export const apiClient = new ApiClient()

export async function request(path: string, opts: RequestInit = {}) {

  const headers = new Headers(opts.headers || {})

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
  if (token) headers.set("Authorization", `Bearer ${token}`)
  headers.set("Accept", "application/json")
  opts.headers = headers

  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`

  const response = await fetch(url, opts)

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || ""
    let errorMsg = response.statusText || "Request failed"
    try {
      if (contentType.includes("application/json")) {
        const errorBody = await response.json()
        errorMsg = errorBody?.error || errorBody?.message || JSON.stringify(errorBody)
        const errorDetails = errorBody?.details || errorMsg
        const customError = new Error(errorMsg) as any
        customError.details = errorDetails
        throw customError
      } else {
        const text = await response.text()
        errorMsg = text ? (text.length > 200 ? text.slice(0, 200) + "..." : text) : errorMsg
        throw new Error(errorMsg || `HTTP ${response.status}`)
      }
    } catch (e) {
      if (e instanceof Error && (e as any).details) {
        throw e
      }
      throw new Error(errorMsg || `HTTP ${response.status}`)
    }
  }

  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) return response.json()
  return response.text()
}
