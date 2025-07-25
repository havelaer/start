import fs from "node:fs/promises";
import path from "node:path";
import { getRequestListener } from "@hono/node-server";
import { createServerModuleRunner, type Plugin, type ViteDevServer } from "vite";

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
              outDir: "dist/ssr",
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

          await getRequestListener(rpcFetch.default)(req, res);
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

            await getRequestListener(ssrFetch.default)(req, res);
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
