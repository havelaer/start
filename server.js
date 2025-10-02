import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { ssr, api } from "./dist/index.js";

const app = new Hono();

app.use(compress());

app.use(serveStatic({ root: "./dist/client" }));

app.use("/api/*", (c) => api(c.req.raw));

app.use((c) => ssr(c.req.raw));

serve(app, (info) => {
  console.log(`Listening on http://localhost:${info.port}`);
});