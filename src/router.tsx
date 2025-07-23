import { createRouter as createReactRouter } from "@tanstack/react-router";
import { client } from "./orpc";
import { routeTree } from "./routeTree.gen";

export function createRouter() {
  return createReactRouter({
    routeTree,
    context: {
      head: "",
      rpc: client,
    },
    defaultPreload: "intent",
    scrollRestoration: true,
  });
}

// declare module "@tanstack/react-router" {
//   interface Register {
//     router: ReturnType<typeof createRouter>;
//   }
// }
