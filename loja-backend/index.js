const { onRequest } = require("firebase-functions/v2/https");

const app = require("./server");

exports.api = onRequest(
  {
    region: "southamerica-east1",
    timeoutSeconds: 60,
    memory: "256MiB",
    secrets: ["MP_ACCESS_TOKEN"],
  },
  app,
);
