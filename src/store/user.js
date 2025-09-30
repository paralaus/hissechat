import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUserStore = create()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      updateUser: (user) => set({ user: { ...get().user, ...user } }),
    }),
    { name: "user-store" }
  )
);
