import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api/v1/auth": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/api/v1/admin": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/api/v1/profiles": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
      "/api/v1/partnerships": {
        target: "http://localhost:8082",
        changeOrigin: true,
      },
      "/api/v1/mitra": {
        target: "http://localhost:8082",
        changeOrigin: true,
      },
      "/api/v1/umkm": {
        target: "http://localhost:8082",
        changeOrigin: true,
      },
      "/api/v1/sales": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
      "/api/v1/products": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
      "/api/v1/documents": {
        target: "http://localhost:8083",
        changeOrigin: true,
      },
    },
  },
});
