import { create } from "zustand";
import { persist } from "zustand/middleware";

const useBearStore = create(
  persist(
    (set, get) => ({
      // App
      appName: "BidKomKom",
      setAppName: (name) => set({ appName: name }),

      // Auth
      user: null,          // { username: "..." }
      token: null,
      isAuthed: false,

      setAuth: ({ user, token = null }) =>
        set({ user, token, isAuthed: !!user }),

      logout: () => set({ user: null, token: null, isAuthed: false }),

      // Hydration flag for Next.js
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: "app-auth",
      // mark when localStorage has been loaded
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      // (optional) only persist what you need
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthed: state.isAuthed,
        appName: state.appName,
      }),
    }
  )
);

export default useBearStore;
