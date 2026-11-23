import app from "./app.js";
import config, { validateConfig } from "./config/index.js";
import { initDB, pool } from "./db/index.js";

const main = async (): Promise<void> => {
  validateConfig();
  await initDB();

  const server = app.listen(config.port, () => {
    console.log(`DevPulse API is listening on port ${config.port}`);
  });

  const shutdown = (signal: string): void => {
    console.log(`${signal} received. Shutting down gracefully.`);
    server.close(() => {
      void pool.end().finally(() => process.exit(0));
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown startup error";
  console.error(`Failed to start DevPulse API: ${message}`);
  void pool.end().finally(() => process.exit(1));
});
