import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

const STORAGE_KEY = 'fittracker_goals_v1';

export interface Goals {
  calories: number; protein: number; carbohydrates: number; fat: number;
}

const DEFAULT_GOALS: Goals = { calories: 2000, protein: 150, carbohydrates: 250, fat: 70 };

function mergeGoals(base: Goals, partial?: Partial<Goals>): Goals {
  const merged = { ...base } as Goals;
  Object.entries(partial || {}).forEach(([k, v]) => {
    const n = Number(v);
    if (!Number.isNaN(n) && n >= 0) (merged as any)[k] = n;
  });
  return merged;
}

async function getLocalGoals(): Promise<Goals> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_GOALS };
    return mergeGoals(DEFAULT_GOALS, JSON.parse(raw));
  } catch { return { ...DEFAULT_GOALS }; }
}

async function saveLocalGoals(partial: Partial<Goals>) {
  const current = await getLocalGoals();
  const merged = mergeGoals(current, partial);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

export const goalsService = {
  getLocalGoals,
  async getGoals(): Promise<Goals> {
    try {
      const { data, error } = await supabase.from('user_goals').select('*').eq('id', 'singleton').maybeSingle();
      if (error) throw error;
      if (!data) {
        const insertObj = {
          id: 'singleton',
          calories: DEFAULT_GOALS.calories,
          protein_g: DEFAULT_GOALS.protein,
          carbohydrates_g: DEFAULT_GOALS.carbohydrates,
          fat_g: DEFAULT_GOALS.fat,
          updated_at: new Date().toISOString(),
          user_id: (await supabase.auth.getUser()).data.user?.id
        };
        const { data: inserted, error: insErr } = await supabase.from('user_goals').insert([insertObj]).select().single();
        if (insErr) throw insErr;
        const normalized: Goals = {
          calories: inserted.calories,
          protein: inserted.protein_g,
          carbohydrates: inserted.carbohydrates_g,
          fat: inserted.fat_g,
        };
        await saveLocalGoals(normalized);
        return normalized;
      }
      const normalized: Goals = {
        calories: data.calories,
        protein: data.protein_g,
        carbohydrates: data.carbohydrates_g,
        fat: data.fat_g,
      };
      await saveLocalGoals(normalized);
      return normalized;
    } catch {
      return getLocalGoals();
    }
  },
  async saveGoals(partial: Partial<Goals>): Promise<Goals> {
    const optimistic = await saveLocalGoals(partial);
    try {
      const base = await this.getGoals();
      const merged = mergeGoals(base, partial);
      const upsertObj = {
        id: 'singleton',
        calories: merged.calories,
        protein_g: merged.protein,
        carbohydrates_g: merged.carbohydrates,
        fat_g: merged.fat,
        updated_at: new Date().toISOString(),
        user_id: (await supabase.auth.getUser()).data.user?.id
      };
      const { data, error } = await supabase.from('user_goals').upsert(upsertObj, { onConflict: 'id' }).select().single();
      if (error) throw error;
      const normalized: Goals = {
        calories: data.calories,
        protein: data.protein_g,
        carbohydrates: data.carbohydrates_g,
        fat: data.fat_g,
      };
      await saveLocalGoals(normalized);
      return normalized;
    } catch { return optimistic; }
  },
  async resetGoals(): Promise<Goals> {
    await AsyncStorage.removeItem(STORAGE_KEY);
    try {
      const { data, error } = await supabase.from('user_goals').upsert({
        id: 'singleton',
        calories: DEFAULT_GOALS.calories,
        protein_g: DEFAULT_GOALS.protein,
        carbohydrates_g: DEFAULT_GOALS.carbohydrates,
        fat_g: DEFAULT_GOALS.fat,
        updated_at: new Date().toISOString(),
        user_id: (await supabase.auth.getUser()).data.user?.id
      }, { onConflict: 'id' }).select().single();
      if (error) throw error;
      const normalized: Goals = {
        calories: data.calories,
        protein: data.protein_g,
        carbohydrates: data.carbohydrates_g,
        fat: data.fat_g,
      };
      await saveLocalGoals(normalized);
      return normalized;
    } catch { return { ...DEFAULT_GOALS }; }
  }
};

export default goalsService;