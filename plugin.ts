import fs from "node:fs/promises";
import path from "node:path";
import { createServerModuleRunner, type Plugin, type ViteDevServer } from "vite";

type Options = {
  clientEntry: string;
  ssrEntry: string;
  rpcEntry: string;
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
                input: path.resolve(__dirname, options.clientEntry),
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
                input: path.resolve(__dirname, options.ssrEntry),
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
                input: path.resolve(__dirname, options.rpcEntry),
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
          const entryRPC = await rpcRunner.import(options.rpcEntry);
          entryRPC.handler({ req, res, next });
          return;
        }
        next();
      });

      return async () => {
        server.middlewares.use(async (req, res, next) => {
          console.log("middleware", req.url);

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
            // Best effort extraction of the head from vite's index transformation hook
            let viteHead =
              (await viteServer?.transformIndexHtml(
                url,
                `<html><head></head><body></body></html>`,
              )) ?? "";

            viteHead = viteHead.substring(
              viteHead.indexOf("<head>") + 6,
              viteHead.indexOf("</head>"),
            );

            const entrySSR = await ssrRunner.import(options.ssrEntry);

            await entrySSR.handler({ req, res, head: viteHead });
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
