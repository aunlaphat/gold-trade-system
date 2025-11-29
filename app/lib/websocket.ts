"use client"

import { io, type Socket } from "socket.io-client"
import { wsBaseURL } from "./config"

let socket: Socket | null = null

export function connectWebSocket() {
  if (socket?.connected) return socket

  socket = io(wsBaseURL, {
    transports: ["websocket", "polling"],
  })

  socket.on("connect", () => {
    console.log("WebSocket connected to:", wsBaseURL)
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
