const app = require("./app");
const env = require("./config/env");
const { connectDB } = require("./config/db");

async function bootstrap() {
  await connectDB();

  app.listen(env.port, () => {
    console.log(`[Server] Listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((e) => {
  console.error("[Bootstrap] Failed:", e);
  process.exit(1);
});
