import "./server/rpc/client";
import { pipeline } from "node:stream/promises";
import {
  createRequestHandler,
  RouterServer,
  renderRouterToStream,
} from "@tanstack/react-router/ssr/server";
import type express from "express";
import { createRouter } from "./router";
import { Connect } from "vite";
import { IncomingMessage, ServerResponse } from "node:http";

export async function handler({
  req,
  res,
  head,
}: {
  head: string;
  req: Connect.IncomingMessage;
  res: ServerResponse<IncomingMessage>;
}) {
  // Convert the express request to a fetch request
  const url = new URL(req.originalUrl || req.url!, "https://localhost:3000").href;

  const request = new Request(url, {
    method: req.method,
    headers: (() => {
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        headers.set(key, value as any);
      }
      return headers;
    })(),
  });

  // Create a request handler
  const handler = createRequestHandler({
    request,
    createRouter: () => {
      const router = createRouter();

      // Update each router instance with the head info from vite
      router.update({
        context: {
          ...router.options.context,
          head: head,
        },
      });
      return router;
    },
  });

  // Let's use the default stream handler to create the response
  const response = await handler(({ request, responseHeaders, router }) =>
    renderRouterToStream({
      request,
      responseHeaders,
      router,
      children: <RouterServer router={router} />,
    }),
  );

  // Convert the fetch response back to an express response
  res.statusMessage = response.statusText;
  res.statusCode = response.status;

  response.headers.forEach((value, name) => {
    res.setHeader(name, value);
  });

  // Stream the response body
  return pipeline(response.body as any, res);
}
