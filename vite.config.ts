import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import laravel from "laravel-vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"

export default defineConfig({
  plugins: [
    laravel({
      input: ["resources/js/app.tsx"],
      refresh: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./resources/js"),
    },
  },
  server: {
    port: 5173,
  },
})
