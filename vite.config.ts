import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import surf from "./plugin";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }), 
    react(), 
    surf({
      client: "src/entry-client.tsx",
      ssr: "src/entry-ssr.tsx",
      apis: {
        rpc: "src/entry-rpc.ts",
      },
    }),
  ],
});
