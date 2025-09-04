import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function reorderMethodPatchPlugin() {
  return {
    name: "patch-reorder-post-to-patch",
    configureServer(server: any) {
      server.middlewares.use((req: any, _res: any, next: any) => {
        if (req.url?.match(/^\/api\/tasks\/\d+\/reorder(\?|$)/) && req.method === "POST") {
          req.method = "PATCH";
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), reorderMethodPatchPlugin()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        // DELETE がまれに詰まる環境の保険
        timeout: 60_000,
        proxyTimeout: 60_000,
      },
    },
  },
});
