import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';
import { profileService, Profile } from '../services/profileService';

interface AuthState {
  session: any | null;
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  init: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    let profile = null;
    if (session?.user) {
      try {
        profile = await profileService.getProfile(session.user.id);
      } catch (e) {
        console.log('Profile not found or error, logging out:', e);
        // Profile doesn't exist - logout to force re-registration
        await supabase.auth.signOut();
        set({ session: null, user: null, profile: null, loading: false });
        return;
      }
    }
    set({ session, user: session?.user ?? null, profile, loading: false });

    supabase.auth.onAuthStateChange(async (_ev, session) => {
      let newProfile = get().profile;
      if (session?.user && !newProfile) {
        try {
          newProfile = await profileService.getProfile(session.user.id);
        } catch (e) {
          console.log('Profile error during auth change, logging out:', e);
          await supabase.auth.signOut();
          set({ session: null, user: null, profile: null });
          return;
        }
      }
      set({ session, user: session?.user ?? null, profile: newProfile });
    });
  },
  signIn: async (email, password) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Profile will be loaded by onAuthStateChange or init, but we can force fetch here if needed
    if (data.session?.user) {
      const profile = await profileService.getProfile(data.session.user.id);
      set({ session: data.session, user: data.session.user, profile });
    } else {
      set({ session: data.session, user: data.session?.user });
    }
  },
  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },
  updateProfile: async (updates: Partial<Profile>) => {
    const user = get().user;
    if (!user) return;

    // First, ensure the profile exists
    let profile = get().profile;
    if (!profile) {
      try {
        profile = await profileService.getProfile(user.id);
        set({ profile });
      } catch (e) {
        console.error('Error getting profile, logging out:', e);
        // Profile doesn't exist and can't be created - logout
        await supabase.auth.signOut();
        set({ session: null, user: null, profile: null });
        return;
      }
    }

    // Now update it
    try {
      const updated = await profileService.updateProfile(user.id, updates);
      set({ profile: updated });
    } catch (e) {
      console.error('Error updating profile, logging out:', e);
      // Can't update profile - logout
      await supabase.auth.signOut();
      set({ session: null, user: null, profile: null });
    }
  }
}));
