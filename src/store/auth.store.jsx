// src/store/auth.store.jsx
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useAuthStore = create()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      setTokens: ({ accessToken, refreshToken }) =>
        set({
          accessToken,
          refreshToken,
          isAuthenticated: !!accessToken,
        }),

      setUser: (user) => set({ user }),

      // Lazy import api here to avoid circular import at module load
      logout: async () => {
        try {
          const { default: api } = await import("../lib/api");
          await api.post("/auth/logout");
        } catch (error) {
          console.error("Gagal melakukan logout di server, melanjutkan di client:", error);
        } finally {
          set({
            accessToken: null,
            refreshToken: null,
            user: null,
            isAuthenticated: false,
          });
        }
      },
    }),
    {
      name: "auth-storage",
      // SSR-safe: only use localStorage on the client
      storage:
        typeof window !== "undefined"
          ? createJSONStorage(() => localStorage)
          : undefined,
    }
  )
);
