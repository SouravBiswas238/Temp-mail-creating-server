import { createApp } from "./app.js";
import { config } from "./config.js";
import { connectMongo } from "./mongoClient.js";

async function main() {
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
