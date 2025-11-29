/**
 * Centralized configuration for API URLs
 * Provides consistent fallback behavior across all components
 */

export const API_CONFIG = {
  // Default port for local development
  DEFAULT_DEV_PORT: 5000,

  // Get base URL from environment or fallback to localhost in development
  getBaseURL: (): string => {
    // Try environment variable first (works in production and configured dev environments)
    const envBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")
    if (envBase) return envBase

    // Fallback for local development without .env.local
    if (typeof window !== "undefined") {
      const host = window.location.hostname
      if (host === "localhost" || host === "127.0.0.1") {
        return `http://localhost:${API_CONFIG.DEFAULT_DEV_PORT}`
      }
    }

    // Same origin for production without explicit URL
    return ""
  },

  // Get WebSocket URL (similar logic but for Socket.IO)
  getWebSocketURL: (): string => {
    return API_CONFIG.getBaseURL()
  },
}

// Export a singleton instance
export const apiBaseURL = API_CONFIG.getBaseURL()
export const wsBaseURL = API_CONFIG.getWebSocketURL()
