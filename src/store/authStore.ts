// src/store/authStore.ts
import { create } from 'zustand';
import type { UserProfile } from '@/types';
import { loginUser } from '@/actions/authActions'; // Import the server action

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, passwordAttempt: string) => Promise<void>;
  logout: () => void;
  setUser: (user: UserProfile | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Initially true until auth status is checked
  login: async (username: string, passwordAttempt: string) => {
    set({ isLoading: true });
    try {
      const userProfile = await loginUser(username, passwordAttempt);
      set({ user: userProfile, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      throw error; // Re-throw to be caught by the form
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
