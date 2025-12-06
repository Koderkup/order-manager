import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: number;
  create_time: string;
  name: string;
  sirname: string;
  email: string;
  inn: number;
  role: string;
  access: number;
}

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    {
      name: "user-storage", 
    }
  )
);
