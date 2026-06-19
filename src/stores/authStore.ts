import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppUser } from "@/types";

type AuthState = {
  user: AppUser | null;
  isLoading: boolean;
  setUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, isLoading: false }),
    }),
    {
      name: "freighter-auth",
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
