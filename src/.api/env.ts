import { config } from "dotenv";
import { z } from "zod";

config({ quiet: true });

const envSchema = z.object({
    DATABASE_URL: z.string().min(1),
});

export const env = envSchema.parse(process.env);
