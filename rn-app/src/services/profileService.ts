import { supabase } from './supabaseClient';

export interface Profile {
    id: string;
    email?: string;
    full_name?: string;
    avatar_url?: string;
    height?: number;
    weight?: number;
    activity_level?: string;
    goal?: string;
    gender?: string;
    age?: number;
    updated_at?: string;
}

export const profileService = {
    getProfile: async (id: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw new Error(error.message);

        if (!data) {
            // Profile missing (e.g. existing user before trigger). Create it.
            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert([{ id }])
                .select()
                .single();

            if (createError) throw new Error(createError.message);
            return newProfile as Profile;
        }

        return data as Profile;
    },

    updateProfile: async (id: string, updates: Partial<Profile>) => {
        const { data, error } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data as Profile;
    }
};
