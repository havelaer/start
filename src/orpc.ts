import { createORPCClient, onError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { router } from "./rpc";

const link = new RPCLink({
	url: "http://localhost:3000/rpc",
	headers: () => ({
		authorization: "Bearer token",
	}),
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

// Create a client for your router
export const client: RouterClient<typeof router> = createORPCClient(link);
