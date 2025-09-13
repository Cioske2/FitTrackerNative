import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';

interface AuthState {
  session: any | null;
  user: any | null;
  loading: boolean;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,
  init: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null, loading: false });
    supabase.auth.onAuthStateChange((_ev, session) => {
      set({ session, user: session?.user ?? null });
    });
  },
  signIn: async (email, password) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    set({ session: data.session, user: data.session?.user });
  },
  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  }
}));
