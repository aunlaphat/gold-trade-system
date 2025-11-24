"use client"

import { io, type Socket } from "socket.io-client"

const WS_URL = process.env.NEXT_PUBLIC_API_URL

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
