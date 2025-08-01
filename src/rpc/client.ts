import { createRouterClient } from "@orpc/server";
import { rpcRouter } from "./router";

globalThis.$client = createRouterClient(rpcRouter);
