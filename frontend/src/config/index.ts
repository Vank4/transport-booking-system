/**
 * Centralized frontend configuration.
 * All values default to localhost for local development.
 * Override by setting the corresponding env variables in .env.
 */
const config = {
  /** Base URL for REST API calls (no trailing slash) */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api",

  /** WebSocket server URL — used by socket.io-client */
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3000",

  /** How many seconds a seat hold lasts (must match backend env.seatHoldTtlMinutes) */
  seatHoldDurationSeconds: 15 * 60,

  /** Fallback seat base price in VND if price_modifier is the only data */
  defaultSeatPrice: 450_000,
} as const;

export default config;
