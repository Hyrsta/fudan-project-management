import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  base: command === "serve" ? "/" : "/static/react/",
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8000",
      "/briefs": "http://127.0.0.1:8000",
    },
  },
  build: {
    outDir: "../news_brief_mvp/static/react",
    emptyOutDir: true,
  },
}));
