"use client"

import { io, type Socket } from "socket.io-client"

const envBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")
let WS_URL = envBase

// If no env var and in browser, fallback to localhost for development
if (!WS_URL && typeof window !== "undefined") {
  const host = window.location.hostname
  if (host === "localhost" || host === "127.0.0.1") {
    WS_URL = "http://localhost:5000"
  } else {
    WS_URL = "" // Same origin for production
  }
}

let socket: Socket | null = null

export function connectWebSocket() {
  if (socket?.connected) return socket

  socket = io(WS_URL, {
    transports: ["websocket", "polling"],
  })

  socket.on("connect", () => {
    console.log("WebSocket connected")
  })

  socket.on("disconnect", () => {
    console.log("WebSocket disconnected")
  })

  return socket
}

export function disconnectWebSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function getSocket() {
  return socket
}
