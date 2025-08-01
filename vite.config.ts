import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import ssr from "@havelaer/vite-ssr/plugin";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }), 
    react(), 
    vanillaExtractPlugin(),
    ssr({
      client: "src/entry-client.tsx",
      ssr: "src/entry-ssr.tsx",
      apis: {
        rpc: "src/entry-rpc.ts",
      },
    }),
  ],
});
