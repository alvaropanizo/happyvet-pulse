import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  envPrefix: ["VITE_", "BACKEND_"],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    exclude: ["tests/e2e/**", "node_modules/**"],
  },
});
