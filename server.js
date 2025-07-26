import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { compress } from "hono/compress";
import rpcFetch from "./dist/rpc/entry-rpc.js";
import ssrFetch from "./dist/ssr/entry-ssr.js";

const app = new Hono();

app.use(async (c, next) => {
  const start = performance.now();
  await next();
  const end = performance.now();
  console.log(`${c.req.method} ${c.req.url} ${end - start}ms`);
});

app.use(compress());

app.use("/*", serveStatic({ root: "./dist/client" }));

app.use("/rpc/*", async (c) => {
  const response = await rpcFetch(c.req.raw);
  return c.newResponse(response.body, response);
});

app.use(async (c) => {
  const response = await ssrFetch(c.req.raw);
  return c.newResponse(response.body, response);
});

serve(app, (info) => {
  console.log(`Listening on http://localhost:${info.port}`); // Listening on http://localhost:3000
});
