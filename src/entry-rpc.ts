import { RPCHandler } from "@orpc/server/fetch";
import { CORSPlugin } from "@orpc/server/plugins";
import { rpcRouter } from "./server/rpc/router";

const rpcHandler = new RPCHandler(rpcRouter, {
  plugins: [new CORSPlugin()],
});

export default async function fetch(req: Request): Promise<Response> {
  const { matched, response } = await rpcHandler.handle(req, {
    prefix: "/rpc",
    context: {},
  });

  if (matched) {
    return response;
  }

  return new Response("Not found", { status: 404 });
}
