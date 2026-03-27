import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: path.resolve(__dirname, "src/web"),
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4010"
    }
  },
  build: {
    outDir: path.resolve(__dirname, "dist/web"),
    emptyOutDir: true
  }
});
