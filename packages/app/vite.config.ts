// SPDX-License-Identifier: MIT
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import dts from "vite-plugin-dts";
import tailwindcss from "tailwindcss";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env': {}
  },
  build: {
    lib: {
      entry: resolve(__dirname, "./lib/index.ts"),
      name: "react-form",
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "tailwindcss"
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react-dom/client": "ReactDOMClient",
          "react/jsx-runtime": "jsxRuntime",
          tailwindcss: "tailwindcss",
        },
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
  plugins: [react(), dts({ rollupTypes: true })],
  css: {
    postcss: {
      plugins: [tailwindcss],
    },
  },
});
