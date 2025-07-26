import fs from "node:fs/promises";
import path from "node:path";
import { getRequestListener } from "@hono/node-server";
import {
  createServerModuleRunner,
  type EnvironmentOptions,
  type Plugin,
  type ViteDevServer,
} from "vite";

export type ServerEntryHandler = (req: Request) => Promise<Response>;

type AppConfig = {
  entry: string;
  environment?: (env: EnvironmentOptions) => EnvironmentOptions;
};

type APIConfig = {
  entry: string;
  route?: string;
  environment?: (env: EnvironmentOptions) => EnvironmentOptions;
};

type Options = {
  client: string | AppConfig;
  ssr: string | AppConfig;
  apis?: Record<string, string | APIConfig>;
};

const postfixRE = /[?#].*$/;

function cleanUrl(url: string): string {
  return url.replace(postfixRE, "");
}

function getEntry(config: string | AppConfig | APIConfig): string {
  if (typeof config === "string") {
    return config;
  }
  return config.entry;
}

function getEnvironment(
  config: string | AppConfig | APIConfig,
  environment: EnvironmentOptions,
): EnvironmentOptions {
  if (typeof config === "string") {
    return environment;
  }
  return config.environment?.(environment) ?? environment;
}

export default function vlotPlugin(options: Options): Plugin {
  let viteServer: ViteDevServer | undefined;

  return {
    name: "vlot-plugin",
    config() {
      return {
        environments: {
          client: getEnvironment(options.client, {
            build: {
              outDir: "dist/client",
              emitAssets: true,
              copyPublicDir: true,
              emptyOutDir: false,
              rollupOptions: {
                input: path.resolve(__dirname, getEntry(options.client)),
                output: {
                  entryFileNames: "static/[name].js",
                  chunkFileNames: "static/assets/[name]-[hash].js",
                  assetFileNames: "static/assets/[name]-[hash][extname]",
                },
              },
            },
          }),
          ssr: getEnvironment(options.ssr, {
            build: {
              outDir: "dist/ssr",
              copyPublicDir: false,
              emptyOutDir: false,
              ssrEmitAssets: false,
              rollupOptions: {
                input: path.resolve(__dirname, getEntry(options.ssr)),
                output: {
                  entryFileNames: "[name].js",
                  chunkFileNames: "assets/[name]-[hash].js",
                  assetFileNames: "assets/[name]-[hash][extname]",
                },
              },
            },
          }),
          ...(options.apis
            ? Object.entries(options.apis).reduce(
                (apiEnvironments, [api, config]) => {
                  apiEnvironments[api] = getEnvironment(config, {
                    build: {
                      rollupOptions: {
                        input: path.resolve(__dirname, getEntry(config)),
                      },
                      outDir: `dist/${api}`,
                      emptyOutDir: false,
                      copyPublicDir: false,
                    },
                  });
                  return apiEnvironments;
                },
                {} as Record<string, EnvironmentOptions>,
              )
            : {}),
        },
        builder: {
          async buildApp(builder) {
            await fs.rm(path.resolve(builder.config.root, "dist"), {
              recursive: true,
              force: true,
            });
            await Promise.all([
              builder.build(builder.environments.client),
              builder.build(builder.environments.ssr),
              ...(options.apis
                ? Object.entries(options.apis).map(([api]) =>
                    builder.build(builder.environments[api]),
                  )
                : []),
            ]);
          },
        },
        appType: "custom",
      };
    },
    async configureServer(server) {
      viteServer = server;
      const ssrRunner = createServerModuleRunner(server.environments.ssr);

      if (options.apis) {
        Object.entries(options.apis).forEach(([api, config]) => {
          const moduleRunner = createServerModuleRunner(server.environments[api]);
          const route = typeof config !== "string" && config.route ? config.route : `/${api}`;

          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith(route)) {
              const apiFetch = await moduleRunner.import(getEntry(config));

              await getRequestListener(apiFetch.default)(req, res);
              return;
            }
            next();
          });
        });
      }

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
            const ssrFetch = await ssrRunner.import(getEntry(options.ssr));

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
      // auto refresh if ssr is updated
      if (this.environment.name === "ssr" && ctx.modules.length > 0) {
        ctx.server.environments.client.hot.send({
          type: "full-reload",
        });
      }
    },
  };
}
