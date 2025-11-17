import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/v1/split-bill": {
        target: "https://ml-dev.orangebybni.my.id",
        changeOrigin: true,
        secure: false,
      },
      "/s/": {
        target: "https://ml-dev.orangebybni.my.id",
        changeOrigin: true,
        secure: false,
      },
      "/api/v1": {
        target: "https://api-dev.orangebybni.my.id",
        changeOrigin: true,
        secure: false,
      },
    },
    host: true,
    port: 5173,
    allowedHosts: ["app-dev.orangebybni.my.id"],
  },
});
