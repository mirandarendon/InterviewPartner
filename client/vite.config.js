import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Any request to /api/... is forwarded to the Express server,
    // so the browser never talks to Gemini or sees the API key.
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
