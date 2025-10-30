import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/v1/auth": {
        target: "http://localhost:8081",
        changeOrigin: true,
        secure: false,
      },
      "/api/v1/wallets": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      //default receive wallet
      "/api/v1/users/me": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      // User service (8082)
      '/api/v1/user': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
