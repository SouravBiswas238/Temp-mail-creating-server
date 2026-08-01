import pino from "pino";
import { config } from "./config.js";
import { connectMongo } from "./mongoClient.js";
import { createSmtpServer } from "./server.js";

const logger = pino({ name: "smtp-receiver" });

async function main() {
  await connectMongo();
  logger.info({ mongoUri: config.mongoUri }, "connected to MongoDB");

  const server = createSmtpServer(logger);

  server.on("error", (err) => {
    logger.error({ err }, "SMTP server error");
  });

  server.listen(config.port, () => {
    logger.info(
      { port: config.port, domains: config.ownedDomains },
      "SMTP receiver listening (catch-all, receive-only, no relay)"
    );
  });
}

main().catch((err) => {
  logger.error({ err }, "fatal startup error");
  process.exit(1);
});
