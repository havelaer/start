import { RPCHandler } from "@orpc/server/node";
import { CORSPlugin } from "@orpc/server/plugins";
import type express from "express";
import { rpcRouter } from "./server/rpc/router";

const rpcHandler = new RPCHandler(rpcRouter, {
  plugins: [new CORSPlugin()],
});

export async function handler({
  req,
  res,
  next,
}: {
  req: express.Request;
  res: express.Response;
  next: express.NextFunction;
}) {
  const { matched } = await rpcHandler.handle(req, res, {
    prefix: "/rpc",
    context: {},
  });

  if (matched) {
    return;
  }

  next();
}
