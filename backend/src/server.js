const app = require("./app");
const env = require("./config/env");
const { connectDB } = require("./config/db");

const releaseExpiredSeats = require("./jobs/seatExpiry.job");

async function bootstrap() {
  try {
    await connectDB();

    const PORT = env.port || 3000;

    app.listen(PORT, () => {
      console.log(`[Server] Listening on http://localhost:${PORT}`);
    });

    // chạy job mỗi 1 phút
    setInterval(() => {
      releaseExpiredSeats();
    }, 60 * 1000);
  } catch (err) {
    console.error("[Bootstrap] Failed:", err);
    process.exit(1);
  }
}

bootstrap();
