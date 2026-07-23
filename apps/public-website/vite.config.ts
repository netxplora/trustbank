import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    headers: {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@trustbank/shared-ui": path.resolve(__dirname, "../../packages/shared-ui/src"),
      "@trustbank/shared-utils": path.resolve(__dirname, "../../packages/shared-utils/src"),
      "@trustbank/shared-hooks": path.resolve(__dirname, "../../packages/shared-hooks/src"),
      "@trustbank/shared-types": path.resolve(__dirname, "../../packages/shared-types/src"),
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  esbuild: {
    // Strip all console statements from production builds
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const parts = id.split('node_modules/');
            const name = parts[parts.length - 1].split('/')[0];
            return `vendor-${name}`;
          }
        }
      }
    }
  }
}));
