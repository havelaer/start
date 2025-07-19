import type { RouterClient } from "@orpc/server";
import type { rpcRouter } from "./server/rpc/router";

export type RouterContext = {
  head: string;
  rpc: RouterClient<typeof rpcRouter>;
};
