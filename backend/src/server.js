const http = require("http");
const app = require("./app");
const env = require("./config/env");
const { connectDB } = require("./config/db");
const { initSocket } = require("./socket");
const releaseExpiredSeats = require("./jobs/seatExpiry.job");

async function bootstrap() {
  try {
    await connectDB();

    // Wrap Express in a native HTTP server so Socket.io can share the port
    const httpServer = http.createServer(app);
    initSocket(httpServer);

    const PORT = env.port || 3000;

    httpServer.listen(PORT, () => {
      console.log(`[Server] Listening on http://localhost:${PORT}`);
    });

    // Run seat-expiry job every 1 minute
    setInterval(() => {
      releaseExpiredSeats();
    }, 60 * 1000);
  } catch (err) {
    console.error("[Bootstrap] Failed:", err);
    process.exit(1);
  }
}

bootstrap();
