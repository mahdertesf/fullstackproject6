import { create } from 'zustand';
import type { UserProfile, UserRole } from '@/types';
import { mockUserProfiles } from '@/lib/data'; // For mock login

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string) /* For mock, just username */ => Promise<void>;
  logout: () => void;
  setUser: (user: UserProfile | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Initially true until auth status is checked
  login: async (username: string) => {
    // Mock login: find user by username
    const foundUser = mockUserProfiles.find(u => u.username === username);
    if (foundUser) {
      set({ user: foundUser, isAuthenticated: true, isLoading: false });
    } else {
      set({ user: null, isAuthenticated: false, isLoading: false });
      throw new Error('Invalid credentials');
    }
  },
  logout: () => {
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
  setUser: (user) => {
     set({ user, isAuthenticated: !!user, isLoading: false });
  },
}));

// Simulate initial auth check (e.g., from a token in localStorage)
// In a real app, this would involve an API call or token validation
if (typeof window !== 'undefined') {
    // For demo purposes, let's auto-login a default user or leave as null
    // const storedUser = localStorage.getItem('mockUser');
    // if (storedUser) {
    //     useAuthStore.getState().setUser(JSON.parse(storedUser));
    // } else {
        useAuthStore.getState().setUser(null); // No user logged in initially
    // }
}
