import { defineConfig } from "vite";
import ssr from "@havelaer/vite-plugin-ssr";
import react from "@vitejs/plugin-react";
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default defineConfig({
  plugins: [react(), vanillaExtractPlugin(), ssr({
    client: "./src/entry-client.tsx",
    ssr: "./src/entry-ssr.ts",
    apis: {
      api: "./src/entry-api.ts",
    },
  })],
});