import type { RouterClient } from "@orpc/server";
import type { router } from "./rpc";

export type RouterContext = {
	head: string;
	rpc: RouterClient<typeof router>;
};
