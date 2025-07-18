import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // server: {
  //   host: "::",
  //   port: 8080,
  // },
  server: {
    host: "127.0.0.1", // use IP instead of "::" to avoid ambiguity
    port: 8080,
    cors: {
      origin: "https://forsys-quiz-app.onrender.com", // your FastAPI backend
      credentials: true,              // required for session cookies
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
