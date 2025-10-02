import type { RouterClient } from "@orpc/server";
import * as users from "./routes/users";

export const router = {
  users,
};

export type RPCClient = RouterClient<typeof router>;
