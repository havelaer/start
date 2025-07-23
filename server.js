import * as zlib from "node:zlib";
import express from "express";
import { handler as rpcHandler } from "./dist/rpc/entry-rpc.js";
import { handler as ssrHandler } from "./dist/ssr/entry-ssr.js";
import compression from "compression";

export async function createServer() {
  const app = express();

  app.use(
    compression({
      brotli: {
        flush: zlib.constants.BROTLI_OPERATION_FLUSH,
      },
      flush: zlib.constants.Z_SYNC_FLUSH,
    }),
  );

  app.use(express.static("./dist/client"));

  app.use("/rpc*", async (req, res, next) => {
    rpcHandler({ req, res, next });
  });

  app.use("*", async (req, res, _next) => {
    try {
      await ssrHandler({ req, res });
    } catch (e) {
      console.info(e.stack);
      res.status(500).end(e.stack);
    }
  });

  return app;
}

createServer().then(async (app) =>
  app.listen(3000, () => {
    console.info("Client Server: http://localhost:3000");
  }),
);
