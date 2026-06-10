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
  isDemo: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  toggleDarkMode: () => void;
  switchUser: (userId: string) => void;
}

// Demo users for testing different perspectives
const demoUsers: Record<string, User> = {
  'u1': { id: 'u1', email: 'john@example.com', name: 'John Doe', role: 'LEAD_ENGINEER', team: { id: 't1', name: 'Engineering Team' } },
  'u2': { id: 'u2', email: 'jane@example.com', name: 'Jane Smith', role: 'SENIOR_ENGINEER', team: { id: 't1', name: 'Engineering Team' } },
  'u3': { id: 'u3', email: 'bob@example.com', name: 'Bob Wilson', role: 'FRONTEND_DEVELOPER', team: { id: 't1', name: 'Engineering Team' } },
  'u4': { id: 'u4', email: 'alice@example.com', name: 'Alice Johnson', role: 'BACKEND_DEVELOPER', team: { id: 't1', name: 'Engineering Team' } },
  'u5': { id: 'u5', email: 'grace@example.com', name: 'Grace Lee', role: 'DESIGN_LEAD', team: { id: 't2', name: 'Design Team' } },
  'u6': { id: 'u6', email: 'liam@example.com', name: 'Liam Brown', role: 'MARKETING_LEAD', team: { id: 't3', name: 'Marketing Team' } },
  'u7': { id: 'u7', email: 'paul@example.com', name: 'Paul Thompson', role: 'OPERATIONS_LEAD', team: { id: 't4', name: 'Operations Team' } },
  'u8': { id: 'u8', email: 'admin@example.com', name: 'Admin User', role: 'ADMIN', team: { id: 't1', name: 'Engineering Team' } },
};

export const useAuthStore = create<AuthState>((set) => ({
  user: demoUsers['u1'], // Default to lead engineer
  token: 'demo-token',
  darkMode: false,
  isDemo: true, // Default to demo mode
  setAuth: (user, token) => set({ user, token, isDemo: false }), // Real user sets isDemo to false
  logout: () => set({ user: null, token: null, isDemo: false }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  switchUser: (userId: string) => {
    const newUser = demoUsers[userId];
    if (newUser) {
      set({ user: newUser, isDemo: true }); // Demo user sets isDemo to true
    }
  },
}));

export { demoUsers };
