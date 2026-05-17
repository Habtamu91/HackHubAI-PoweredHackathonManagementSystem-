import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setSession: ({ user, accessToken }) => set({ user, accessToken }),
      clearSession: () => set({ user: null, accessToken: null })
    }),
    {
      name: "hackhub-session",
      storage: createJSONStorage(() => sessionStorage)
    }
  )
);
