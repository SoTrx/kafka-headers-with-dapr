import express, { json } from "express";
import { env } from "node:process";
import { DaprServer } from "@dapr/dapr";

const APP_PORT = String(env.PORT ?? "3001");
const DAPR_PORT = env.DAPR_HTTP_PORT ?? "3502";

/** Main */
if (Boolean(env.USE_SDK)) await withSdk();
else await withYml();

/** Use the JS SDK to register to a Kafka event */
async function withSdk() {
  const server = new DaprServer({
    serverPort: APP_PORT,
    clientOptions: { daprPort: DAPR_PORT },
  });
  await server.pubsub.subscribe(
    "kafka-pubsub",
    "test",
    async (data: Record<string, any>, headers: object) => seekCat(headers)
  );
  await server.start();
}
/** Use the programmatic subscription feature to register to a Kafka event */
async function withYml() {
  const app = express();
  // Required to parse the Cloudevent format
  app.use(json({ type: "application/*+json" }));
  app.get("/dapr/subscribe", (req, res) => {
    res.json([
      {
        pubsubname: "kafka-pubsub",
        topic: "test",
        routes: { rules: [], default: "/message" },
      },
    ]);
  });
  app.post("/message", (req) => seekCat(req.headers));
  app.listen(APP_PORT, () => console.log(`Server up on port ${APP_PORT}`));
}

function seekCat(headers: Record<string, any>) {
  if (headers["x-cat"] === "miaou") {
    console.log("Custom header : found !");
    return;
  }

  console.error(
    `Couldn't find custom header in Kafka headers : ${JSON.stringify(headers)}`
  );
}
