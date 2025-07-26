import { createRouter as createReactRouter } from "@tanstack/react-router";
import { client } from "./orpc";
import { routeTree } from "./routeTree.gen";

export function createRouter() {
  return createReactRouter({
    routeTree,
    context: {
      rpc: client,
      // Prevent TanStack Router Devtools from JSON.stringify-ing
      // the rpc client and accidentally calling it with `toJSON`.
      _: 0,
    },
    defaultPreload: false,
    scrollRestoration: true,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
