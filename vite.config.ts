import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";
import { ssamGit } from "vite-plugin-ssam-git";

export default defineConfig({
  base: "./",
  plugins: [
    glsl({
      warnDuplicatedImports: false,
    }),
    ssamGit(),
  ],
  clearScreen: false,
  build: {
    outDir: "./dist",
    assetsDir: ".",
    rollupOptions: {
      input: {
        main: "./index.html",
        konfigurator: "./konfigurator.html"
      }
    },
  },
  server: {
    open: true,
    host: "0.0.0.0"
  }
});
