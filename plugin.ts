import fs from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { createServerModuleRunner, type Plugin, type ViteDevServer } from "vite";
import { serve, getRequestListener, type ServerType } from "@hono/node-server";

export type ServerEntryHandler = (req: Request) => Promise<Response>;

type EntryConfig = {
  entry: string;
};

type Options = {
  client: EntryConfig;
  ssr: EntryConfig;
  rpc: EntryConfig;
};

const postfixRE = /[?#].*$/;

function cleanUrl(url: string): string {
  return url.replace(postfixRE, "");
}

// For now we're not streaming the response (only dev mode)
// TODO: stream the response
async function toNodeServerResponse(response: Response, res: ServerResponse) {
  response.headers.forEach((value, name) => {
    res.setHeader(name, value);
  });

  res.write(await response.text());
  res.end();
}

// Naive conversion from node request to fetch request
function fromNodeIncomingMessage(req: IncomingMessage): Request {
  const url = new URL(req.url!, "https://localhost:3000").href;
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

  return request;
}

export const environmentNames = {
  client: "client",
  ssr: "ssr",
  rpc: "rpc",
};

export default function vlotPlugin(options: Options): Plugin {
  let viteServer: ViteDevServer | undefined;

  return {
    name: "vlot-plugin",
    config() {
      return {
        environments: {
          [environmentNames.client]: {
            build: {
              outDir: "dist/client",
              emitAssets: true,
              copyPublicDir: true,
              emptyOutDir: true,
              rollupOptions: {
                input: path.resolve(__dirname, options.client.entry),
                output: {
                  entryFileNames: "static/[name].js",
                  chunkFileNames: "static/assets/[name]-[hash].js",
                  assetFileNames: "static/assets/[name]-[hash][extname]",
                },
              },
            },
          },
          [environmentNames.ssr]: {
            build: {
              // ssr: true,
              outDir: "dist/ssr",
              // ssrEmitAssets: true,
              copyPublicDir: false,
              emptyOutDir: true,
              rollupOptions: {
                input: path.resolve(__dirname, options.ssr.entry),
                output: {
                  entryFileNames: "[name].js",
                  chunkFileNames: "assets/[name]-[hash].js",
                  assetFileNames: "assets/[name]-[hash][extname]",
                },
              },
            },
          },
          [environmentNames.rpc]: {
            build: {
              rollupOptions: {
                input: path.resolve(__dirname, options.rpc.entry),
              },
              outDir: "dist/rpc",
              emptyOutDir: false,
              copyPublicDir: false,
            },
          },
        },
        builder: {
          async buildApp(builder) {
            await fs.rm(path.resolve(builder.config.root, "dist"), {
              recursive: true,
              force: true,
            });
            await Promise.all([
              builder.build(builder.environments[environmentNames.client]),
              builder.build(builder.environments[environmentNames.ssr]),
              builder.build(builder.environments[environmentNames.rpc]),
            ]);
          },
        },
        appType: "custom",
      };
    },
    async configureServer(server) {
      viteServer = server;

      const ssrRunner = createServerModuleRunner(server.environments[environmentNames.ssr]);
      const rpcRunner = createServerModuleRunner(server.environments[environmentNames.rpc]);

      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith("/rpc")) {
          const rpcFetch = await rpcRunner.import(options.rpc.entry);

          const handler = getRequestListener(rpcFetch.default);
          await handler(req, res).then(
            () => {
              next();
            },
            (err) => {
              console.error(err);
              next(err);
            },
          );
          return;
        }
        next();
      });

      return async () => {
        server.middlewares.use(async (req, res, next) => {
          if (res.writableEnded) {
            return next();
          }

          const url = req.url && cleanUrl(req.url);

          if (!url || path.extname(url) !== "") {
            console.warn(`${url} is not valid router path`);
            res.statusCode = 404;
            res.end(`${url} is not valid router path`);
            return;
          }

          try {
            const ssrFetch = await ssrRunner.import(options.ssr.entry);
            const response = await ssrFetch.default(fromNodeIncomingMessage(req));

            await toNodeServerResponse(response, res);
          } catch (e: any) {
            viteServer?.ssrFixStacktrace(e);
            console.info(e.stack);
            res.statusCode = 500;
            res.end(e.stack);
          }
        });
      };
    },
    hotUpdate(ctx) {
      // auto refresh if server is updated
      if (
        (this.environment.name === environmentNames.ssr ||
          this.environment.name === environmentNames.rpc) &&
        ctx.modules.length > 0
      ) {
        ctx.server.environments.client.hot.send({
          type: "full-reload",
        });
      }
    },
  };
}
