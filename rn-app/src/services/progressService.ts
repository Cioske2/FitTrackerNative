import { supabase } from './supabaseClient';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export interface ProgressEntry {
    id: string;
    user_id: string;
    photo_path: string;
    date: string;
    weight?: number;
    notes?: string;
    created_at: string;
}

export const progressService = {
    async uploadProgressPhoto(uri: string): Promise<string> {
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error('User not authenticated');

            const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `${user.id}/${Date.now()}.${ext}`;

            // Read file as base64
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from('progress_photos')
                .upload(fileName, decode(base64), {
                    contentType: `image/${ext}`,
                    upsert: false,
                });

            if (error) throw error;

            return data.path;
        } catch (error: any) {
            console.error('Error uploading photo:', error);
            throw new Error(error.message || 'Failed to upload photo');
        }
    },

    async addProgressEntry(photoPath: string, weight?: number, notes?: string): Promise<ProgressEntry> {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('progress_entries')
            .insert([
                {
                    user_id: user.id,
                    photo_path: photoPath,
                    weight,
                    notes,
                    date: new Date().toISOString().split('T')[0], // Current date YYYY-MM-DD
                },
            ])
            .select()
            .single();

        if (error) throw error;
        return data as ProgressEntry;
    },

    async getProgressEntries(): Promise<ProgressEntry[]> {
        const { data, error } = await supabase
            .from('progress_entries')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;
        return data as ProgressEntry[];
    },

    getPublicUrl(path: string): string {
        const { data } = supabase.storage
            .from('progress_photos')
            .getPublicUrl(path);
        return data.publicUrl;
    },

    async deleteProgressEntry(id: string): Promise<void> {
        try {
            // First, get the entry to know which photo to delete
            const { data: entry, error: fetchError } = await supabase
                .from('progress_entries')
                .select('photo_path')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;
            if (!entry) throw new Error('Progress entry not found');

            // Delete from database first
            const { error: dbError } = await supabase
                .from('progress_entries')
                .delete()
                .eq('id', id);

            if (dbError) throw dbError;

            // Then delete photo from storage
            const { error: storageError } = await supabase.storage
                .from('progress_photos')
                .remove([entry.photo_path]);

            if (storageError) {
                console.warn('Failed to delete photo from storage:', storageError);
                // Don't throw here - DB entry is already deleted
            }
        } catch (error: any) {
            console.error('Error deleting progress entry:', error);
            throw new Error(error.message || 'Failed to delete progress entry');
        }
    }
};
