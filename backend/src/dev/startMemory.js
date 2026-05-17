const { MongoMemoryServer } = require("mongodb-memory-server");

async function main() {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.REDIS_URL = "";
  process.env.AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

  const { server } = require("../server");
  const { connectDatabase } = require("../config/database");
  const { startScheduler } = require("../jobs/scheduler");
  const env = require("../config/env");

  await connectDatabase();
  startScheduler();
  server.listen(env.port, () => {
    console.log(`HackHub API listening on port ${env.port} using in-memory MongoDB`);
  });

  async function shutdown() {
    await mongo.stop();
    process.exit(0);
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
