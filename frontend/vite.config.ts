import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function reorderMethodPatchPlugin() {
  return {
    name: "patch-reorder-post-to-patch",
    configureServer(server: any) {
      server.middlewares.use((req: any, _res: any, next: any) => {
        if (
          req.url?.match(/^\/api\/tasks\/\d+\/reorder(\?|$)/) &&
          req.method === "POST"
        ) {
          // console.log("[dev-proxy] POST -> PATCH", req.url);
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
    headers: {
      // 開発環境でもセキュリティヘッダーを設定
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    },
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        timeout: 60_000,
        proxyTimeout: 60_000,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // React関連を1つのチャンクに
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // 大きなライブラリを個別チャンクに
          'fullcalendar': [
            '@fullcalendar/core',
            '@fullcalendar/react',
            '@fullcalendar/daygrid',
            '@fullcalendar/timegrid',
            '@fullcalendar/interaction',
          ],
          // その他のベンダーライブラリ
          'vendor': ['axios', '@tanstack/react-query'],
        },
      },
    },
  },
});