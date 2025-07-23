import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import vlotPlugin from "./plugin";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }), 
    react(), 
    vlotPlugin({
      clientEntry: "src/entry-client.tsx",
      ssrEntry: "src/entry-ssr.tsx",
      rpcEntry: "src/entry-rpc.ts",
    }),
  ],
});
