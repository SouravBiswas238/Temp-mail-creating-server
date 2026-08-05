import { createApp } from "./app.js";
import { config } from "./config.js";
import { connectMongo } from "./mongoClient.js";

async function main() {
  if (config.mailboxTokenSecret === "dev-only-insecure-secret-change-me") {
    // eslint-disable-next-line no-console
    console.warn(
      "WARNING: MAILBOX_TOKEN_SECRET is not set - using an insecure default. " +
        "Set a real secret (e.g. `openssl rand -hex 32`) before deploying to production."
    );
  }
  await connectMongo();
  const app = createApp();
  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`api-server listening on :${config.port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("fatal startup error", err);
  process.exit(1);
});
