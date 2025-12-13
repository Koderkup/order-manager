import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: number;
  role: "admin" | "client" | "manager";
  email: string;
  access: number | boolean;
  create_time: string;
  code: string | null;
  name: string | null;
  inn: string | null;
  kpp: string | null;
  legal_address: string | null;
  actual_address: string | null;
  active: boolean;
  phone?: string | null; // Добавим опциональное поле для телефона
}

interface UserState {
  user: User | null;
  viewedUser: User | null;
  setUser: (user: User | null) => void;
  setViewedUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void; 
  updateViewedUser: (updates: Partial<User>) => void; 
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      viewedUser: null,
      setUser: (user) => set({ user }),
      setViewedUser: (user) => set({ viewedUser: user }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      updateViewedUser: (updates) =>
        set((state) => ({
          viewedUser: state.viewedUser
            ? { ...state.viewedUser, ...updates }
            : null,
        })),
    }),
    {
      name: "user-storage",
    }
  )
);
