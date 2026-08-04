import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import viteCompression from 'vite-plugin-compression';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

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
  plugins: [
    react(),
    viteCompression({ algorithm: 'gzip', ext: '.gz', deleteOriginFile: false }),
    viteCompression({ algorithm: 'brotliCompress', ext: '.br', deleteOriginFile: false }),
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 80 },
      jpg: { quality: 80 },
      webp: { lossless: false, quality: 85 },
      svg: {
        multipass: true,
        plugins: ['preset-default'],
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  build: {
    // Target modern ESNext — avoids transpilation overhead, smaller output
    target: 'esnext',
    minify: 'esbuild',
    // Split CSS per chunk for faster paint
    cssCodeSplit: true,
    cssMinify: true,
    // No sourcemaps in production
    sourcemap: false,
    // Warn only on large chunks (reduced threshold to catch regressions)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
      },
      output: {
        // Long-term caching via content hash
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          // PDF generation — heavy, only used on demand
          // Includes jsPDF, canvg (SVG renderer), and ALL their transitive deps:
          // fflate/fast-png (compression/image), @babel/runtime (Babel helpers),
          // css-tree/css-select/entities (canvg CSS parsing), pako (inflate/deflate),
          // rgbcolor/stack-blur (canvg rendering helpers), @csstools (CSS utilities)
          if (
            id.includes('jspdf') ||
            id.includes('canvg') ||
            id.includes('fflate') ||
            id.includes('fast-png') ||
            id.includes('@babel/runtime') ||
            id.includes('css-tree') ||
            id.includes('css-select') ||
            id.includes('entities') ||
            id.includes('pako') ||
            id.includes('rgbcolor') ||
            id.includes('stack-blur') ||
            id.includes('@csstools')
          ) return 'vendor-pdf';

          // Charts — loaded lazily per page (includes recharts' bundled d3 via victory-vendor)
          if (
            id.includes('recharts') ||
            id.includes('victory-vendor') ||
            id.includes('d3-scale') ||
            id.includes('d3-shape') ||
            id.includes('d3-path') ||
            id.includes('d3-color') ||
            id.includes('d3-interpolate') ||
            id.includes('d3-format') ||
            id.includes('d3-array') ||
            id.includes('d3-time')
          ) return 'vendor-charts';

          // Animations — includes framer-motion v12 split packages
          if (
            id.includes('framer-motion') ||
            id.includes('motion-dom') ||
            id.includes('motion-utils')
          ) return 'vendor-motion';

          // Icons — shared but large
          if (id.includes('lucide-react')) return 'vendor-icons';

          // Radix UI primitives + positioning engine + utilities
          if (
            id.includes('@radix-ui') ||
            id.includes('@floating-ui') ||
            id.includes('aria-hidden') ||
            id.includes('react-remove-scroll') ||
            id.includes('use-callback-ref') ||
            id.includes('use-sidecar')
          ) return 'vendor-radix';

          // Supabase + all realtime/WebSocket transitive deps
          // (whatwg-url/tr46/punycode = URL/Unicode parsing; ws/isows = WebSocket; phoenix = realtime protocol)
          if (
            id.includes('@supabase') ||
            id.includes('whatwg-url') ||
            id.includes('tr46') ||
            id.includes('punycode') ||
            id.includes('/ws/') ||
            id.includes('isows') ||
            id.includes('phoenix')
          ) return 'vendor-supabase';

          // Routing
          if (id.includes('react-router')) return 'vendor-router';

          // React core — single instance required
          if (id.includes('react-dom') || id.match(/[/\\]react[/\\]/) || id.match(/[/\\]react@/)) return 'vendor-react';

          // TanStack Query
          if (id.includes('@tanstack')) return 'vendor-query';

          // Date utilities
          if (id.includes('date-fns')) return 'vendor-date';

          // Forms
          if (id.includes('react-hook-form') || id.includes('@hookform')) return 'vendor-forms';

          // Stripe — payment SDK, only on deposit/payment pages
          if (id.includes('@stripe')) return 'vendor-stripe';

          // Virtualisation
          if (id.includes('react-virtuoso')) return 'vendor-virtual';

          // Carousel
          if (id.includes('embla-carousel')) return 'vendor-carousel';

          // Date picker UI
          if (id.includes('react-day-picker')) return 'vendor-date';

          // Resizable panel layouts
          if (id.includes('react-resizable-panels')) return 'vendor-panels';

          // Small utilities
          if (
            id.includes('zod') ||
            id.includes('clsx') ||
            id.includes('class-variance-authority') ||
            id.includes('tailwind-merge') ||
            id.includes('dompurify') ||
            id.includes('uqr') ||
            id.includes('input-otp') ||
            id.includes('cmdk') ||
            id.includes('vaul') ||
            id.includes('sonner') ||
            id.includes('next-themes') ||
            id.includes('scheduler') ||
            id.includes('tslib') ||
            id.includes('nanoid')
          ) return 'vendor-utils';

          // Remaining node_modules (catch-all)
          return 'vendor-misc';
        },
      },
    },
  },
}));
