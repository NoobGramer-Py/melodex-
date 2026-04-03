import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { AuthUser } from '../types';

interface AuthStore {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ user: session?.user as AuthUser | null ?? null, initialized: true });
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user as AuthUser | null ?? null });
    });
  },

  signInWithEmail: async (email, password) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } finally {
      set({ loading: false });
    }
  },

  signUpWithEmail: async (email, password) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));