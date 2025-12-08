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
