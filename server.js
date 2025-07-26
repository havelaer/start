import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { compress } from "hono/compress";
import rpcFetch from "./dist/rpc/entry-rpc.js";
import ssrFetch from "./dist/ssr/entry-ssr.js";

const app = new Hono();

app.use(compress());

app.use(serveStatic({ root: "./dist/client" }));

app.use("/rpc/*", (c) => rpcFetch(c.req.raw));

app.use((c) => ssrFetch(c.req.raw));

serve(app, (info) => {
  console.log(`Listening on http://localhost:${info.port}`); // Listening on http://localhost:3000
});
