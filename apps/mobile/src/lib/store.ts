import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  isDemo: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  loadAuth: () => Promise<void>;
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
  user: null,
  token: null,
  isDemo: false,
  setAuth: async (user, token) => {
    await AsyncStorage.setItem('user', JSON.stringify(user));
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('isDemo', 'false');
    set({ user, token, isDemo: false });
  },
  logout: async () => {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('isDemo');
    set({ user: null, token: null, isDemo: false });
  },
  loadAuth: async () => {
    const user = await AsyncStorage.getItem('user');
    const token = await AsyncStorage.getItem('token');
    const isDemo = await AsyncStorage.getItem('isDemo');
    if (user && token) {
      set({ user: JSON.parse(user), token, isDemo: isDemo === 'true' });
    }
  },
  switchUser: (userId: string) => {
    const newUser = demoUsers[userId];
    if (newUser) {
      set({ user: newUser, token: 'demo-token', isDemo: true });
    }
  },
}));
