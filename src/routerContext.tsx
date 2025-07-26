import type { RouterClient } from "@orpc/server";
import type { rpcRouter } from "./server/rpc/router";

export type RouterContext = {
  rpc: RouterClient<typeof rpcRouter>;
  _: unknown;
};
