import type { IncomingMessage, ServerResponse } from "node:http";
import { RPCHandler } from "@orpc/server/node";
import { CORSPlugin } from "@orpc/server/plugins";
import type { Connect } from "vite";
import { rpcRouter } from "./server/rpc/router";

const rpcHandler = new RPCHandler(rpcRouter, {
  plugins: [new CORSPlugin()],
});

export async function handler({
  req,
  res,
  next,
}: {
  req: Connect.IncomingMessage;
  res: ServerResponse<IncomingMessage>;
  next: Connect.NextFunction;
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
