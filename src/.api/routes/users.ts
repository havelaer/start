import { os } from "@orpc/server";
import { z } from "zod";
import { dbMiddleware } from "../middleware/db";

export const listUsers = os
  .use(dbMiddleware)
  .input(
    z.object({
      limit: z.number().int().min(1).max(100).optional(),
    }),
  )
  .output(
    z.array(
      z.object({
        id: z.string(),
        email: z.string(),
        name: z.string(),
      }),
    ),
  )
  .handler(async ({ input, context }) => {
    const { db } = context;
    const users = await db.user.findMany({
      take: input.limit,
    });

    return users;
  });
