import { RPCHandler } from "@orpc/server/fetch";
import { router } from "./.api/router";

const handler = new RPCHandler(router);

export default async function fetch(request: Request): Promise<Response> {
  const { matched, response } = await handler.handle(request, {
    prefix: "/api",
  });

  if (matched) {
    return response;
  }

  return new Response("Not found", {
    status: 404,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
