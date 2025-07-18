import express from "express";
import getPort, { portNumbers } from "get-port";
import path from "node:path";
import * as zlib from "node:zlib";

const isTest = process.env.NODE_ENV === "test" || !!process.env.VITE_TEST_BUILD;

export async function createServer(
	root = process.cwd(),
	isProd = process.env.NODE_ENV === "production",
	hmrPort,
) {
	const app = express();
	let runner;
  let jiti;

	/**
	 * @type {import('vite').ViteDevServer}
	 */
	let vite;
	if (!isProd) {
		const { createServer: createViteServer, createServerModuleRunner } = await import("vite");
		const { createJiti } = await import("jiti");

		jiti = createJiti(import.meta.url, {
      moduleCache: false
    });

		vite = await createViteServer({
			root,
			logLevel: isTest ? "error" : "info",
			server: {
				middlewareMode: true,
				watch: {
					// During tests we edit the files too fast and sometimes chokidar
					// misses change events, so enforce polling for consistency
					usePolling: true,
					interval: 100,
				},
				hmr: {
					port: hmrPort,
				},
			},
			appType: "custom",
		});

		runner = createServerModuleRunner(vite.environments.ssr);

		// use vite's connect instance as middleware
		app.use(vite.middlewares);
	} else {
		app.use(
			(await import("compression")).default({
				brotli: {
					flush: zlib.constants.BROTLI_OPERATION_FLUSH,
				},
				flush: zlib.constants.Z_SYNC_FLUSH,
			}),
		);
	}

	if (isProd) app.use(express.static("./dist/client"));

  app.use("/rpc*", async (req, res, next) => {
    const entryRPC = await (async () => {
      if (!isProd) {
        return jiti.import("./src/entry-rpc.ts");
      } else {
        return import("./dist/rpc/entry-rpc.js");
      }
    })();

    entryRPC.handler({ req, res, next });
  });

	app.use("*", async (req, res) => {
		try {
			const url = req.originalUrl;

			if (path.extname(url) !== "") {
				console.warn(`${url} is not valid router path`);
				res.status(404);
				res.end(`${url} is not valid router path`);
				return;
			}

			// Best effort extraction of the head from vite's index transformation hook
			let viteHead = !isProd
				? await vite.transformIndexHtml(
						url,
						`<html><head></head><body></body></html>`,
					)
				: "";

			viteHead = viteHead.substring(
				viteHead.indexOf("<head>") + 6,
				viteHead.indexOf("</head>"),
			);

			const entrySSR = await (async () => {
				if (!isProd) {
					return runner.import("/src/entry-ssr.tsx");
				} else {
					return import("./dist/ssr/entry-ssr.js");
				}
			})();

			console.info("Rendering: ", url, "...");
			entrySSR.handler({ req, res, head: viteHead });
		} catch (e) {
			!isProd && vite.ssrFixStacktrace(e);
			console.info(e.stack);
			res.status(500).end(e.stack);
		}
	});

	return { app, vite };
}

if (!isTest) {
	createServer().then(async ({ app }) =>
		app.listen(await getPort({ port: portNumbers(3000, 3100) }), () => {
			console.info("Client Server: http://localhost:3000");
		}),
	);
}
