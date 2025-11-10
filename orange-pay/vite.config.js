import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/v1/split-bill": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      // online service, comment this for local testing
      "/api/v1/user": {
        target: "https://api-dev.orangebybni.my.id",
        changeOrigin: true,
        secure: false,
      },
      "/api/v1/contacts": {
        target: "https://api-dev.orangebybni.my.id",
        changeOrigin: true,
        secure: false,
      },
      "/api/v1": {
        target: "https://api-dev.orangebybni.my.id",
        changeOrigin: true,
        secure: false,
      },
      // uncomment this for local testing and adjust manually the port on each services
      // "/api/v1/contacts": {
      //   target: "http://localhost:8084",
      //   changeOrigin: true,
      //   secure: false,
      // },
      // "/api/v1/user/me": {
      //   target: "http://localhost:8083",
      //   changeOrigin: true,
      //   secure: false,
      // },
      // "/api/v1/auth": {
      //   target: "http://localhost:8081",
      //   changeOrigin: true,
      //   secure: false,
      // },
      // "/api/v1/wallets": {
      //   target: "http://localhost:8080",
      //   changeOrigin: true,
      //   secure: false,
      // },
      // "/api/v1/split-bill": {
      //   target: "http://localhost:5000",
      //   changeOrigin: true,
      //   secure: false,
      // },
      // "/s/": {
      //   target: "http://localhost:5000",
      //   changeOrigin: true,
      //   secure: false,
      // },
      // User service (8082)
      // "/api/v1/user": {
      //   target: "http://localhost:8082",
      //   changeOrigin: true,
      //   secure: false,
      // },
    },
  },
});
