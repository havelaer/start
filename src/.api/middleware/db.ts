import { os } from "@orpc/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../env.js";
import { PrismaClient } from "../generated/prisma/client.js";

let db: PrismaClient;

export const dbMiddleware = os.middleware(async ({ context, next }) => {
    if (!db) {
        const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
        db = new PrismaClient({ adapter });
    }

    return await next({
        context: {
            ...context,
            db,
        },
    });
});
