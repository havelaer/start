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
      client: {
        entry: "src/entry-client.tsx",
      },
      ssr: {
        entry: "src/entry-ssr.tsx",
      },
      rpc: {
        entry: "src/entry-rpc.ts",
        
      },
    }),
  ],
});
