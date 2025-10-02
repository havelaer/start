import { os } from "@orpc/server";
import { PrismaClient } from "@prisma/client";

let db: PrismaClient;

export const dbMiddleware = os.middleware(async ({ context, next }) => {
  if (!db) db = new PrismaClient();

  return await next({
    context: {
      ...context,
      db,
    },
  });
});
