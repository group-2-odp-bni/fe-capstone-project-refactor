import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/v1/auth": {
        target: "https://api-dev.orangebybni.my.id",
        changeOrigin: true,
        secure: false,
      },
      "/api/v1/wallets": {
        target: "https://api-dev.orangebybni.my.id",
        changeOrigin: true,
        secure: false,
      },
      //default receive wallet
      "/api/v1/users/me": {
        target: "https://api-dev.orangebybni.my.id",
        changeOrigin: true,
        secure: false,
      },
      //limit
      "/api/v1/users/me/limits": {
        target: "https://api-dev.orangebybni.my.id",
        changeOrigin: true,
        secure: false,
      },
      "/api/v1/invites": {
        target: "https://api-dev.orangebybni.my.id",
        changeOrigin: true,
        secure: false,
      },
      // User service (8082)
      "/api/v1/user": {
        target: "https://api-dev.orangebybni.my.id",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
