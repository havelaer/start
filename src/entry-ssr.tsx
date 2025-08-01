import "./rpc/client";
import {
  createRequestHandler,
  RouterServer,
  renderRouterToStream,
} from "@tanstack/react-router/ssr/server";
import { createRouter } from "./router";

export default async function fetch(req: Request): Promise<Response> {
  // Create a request handler
  const handler = createRequestHandler({
    request: req,
    createRouter,
  });

  // Let's use the default stream handler to create the response
  return await handler(({ request, responseHeaders, router }) =>
    renderRouterToStream({
      request,
      responseHeaders,
      router,
      children: <RouterServer router={router} />,
    }),
  );
}
