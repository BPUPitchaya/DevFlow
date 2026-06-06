import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  team?: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  darkMode: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  toggleDarkMode: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  darkMode: false,
  setAuth: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
}));
