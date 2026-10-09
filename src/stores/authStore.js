import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      loginAt: null,
      setAuth: ({ user, accessToken, refreshToken }) =>
        set({ user, accessToken, refreshToken, loginAt: Date.now() }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null, loginAt: null }),
      // Check if session should expire (end of day or 12h max)
      checkSession: () => {
        const { loginAt, logout } = get();
        if (!loginAt) return;
        const hoursSinceLogin = (Date.now() - loginAt) / (1000 * 60 * 60);
        if (hoursSinceLogin > 12) {
          logout();
          window.location.href = '/login';
        }
      },
    }),
    { name: 'ezehub-tenant-auth' }
  )
);
