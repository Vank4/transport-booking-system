import { io as SocketIOClient, Socket } from "socket.io-client";
import config from "@/config";

// Singleton socket instance
let socket: Socket | null = null;

/**
 * Returns the Socket.io client, initialising it on first call.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = SocketIOClient(config.wsUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });
  }
  return socket;
}

/**
 * Disconnect and destroy the socket singleton.
 * Call this when navigating away from the seat-map page.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
