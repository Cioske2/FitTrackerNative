import { supabase } from './supabaseClient';
import { logError } from '../utils/logger';
import type { FoodRecord } from '../types/supabase';

export interface FoodInsert {
  name: string;
  servingSize: number;
  serving_unit: string;
  calories: number;
  protein: number;
  carbsTotal: number;
  fiber?: number | '' | null;
  sugar?: number | '' | null;
  fatTotal: number;
  saturatedFat?: number | '' | null;
  barcode?: string | null;
  brand?: string | null;
  isGeneric?: boolean;
}


const normalizeText = (value?: string | null) =>
  value ? value.trim().replace(/\s+/g, ' ') : '';

const normalizeBarcode = (value?: string | null) =>
  value ? value.replace(/\s+/g, '') : '';

export const foodService = {
  addFood: async (food: FoodInsert): Promise<FoodRecord> => {
    const normalizedName = normalizeText(food.name);
    const normalizedBrand = normalizeText(food.brand || undefined);
    const normalizedBarcode = normalizeBarcode(food.barcode || undefined);

    if (normalizedBarcode) {
      const existingByBarcode = await foodService.getFoodByBarcode(normalizedBarcode);
      if (existingByBarcode) return existingByBarcode;
    }

    if (normalizedName) {
      const existingByName = await foodService.getFoodByNameAndBrand(
        normalizedName,
        normalizedBrand || null,
      );
      if (existingByName) return existingByName;
    }

    const dataToInsert: any = {
      name: normalizedName || food.name,
      serving_size: food.servingSize,
      serving_unit: food.serving_unit,
      calories: food.calories,
      protein_g: food.protein,
      carbohydrates_total_g: food.carbsTotal,
      carbohydrates_fiber_g: food.fiber === '' ? null : food.fiber,
      carbohydrates_sugar_g: food.sugar === '' ? null : food.sugar,
      fat_total_g: food.fatTotal,
      fat_saturated_g: food.saturatedFat === '' ? null : food.saturatedFat,
      barcode: normalizedBarcode || null,
      brand: normalizedBrand || null,
      is_generic: food.isGeneric ?? true,
    };
    Object.keys(dataToInsert).forEach(k => dataToInsert[k] === undefined && delete dataToInsert[k]);

    // Always add user_id for RLS policy compliance
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');
    dataToInsert.user_id = user.id;

    const { data, error } = await supabase.from('foods').insert([dataToInsert]).select().single();
    if (error) {
      logError(error, 'Supabase insert food failed', { name: dataToInsert.name, barcode: dataToInsert.barcode });
      throw new Error(error.message);
    }
    return data;
  },

  getAllFoods: async (): Promise<FoodRecord[]> => {
    const { data, error } = await supabase.from('foods').select('*').order('name', { ascending: true });
    if (error) {
      logError(error, 'Supabase getAllFoods failed');
      throw new Error(error.message);
    }
    return data || [];
  },

  getFoodById: async (id: number): Promise<FoodRecord | null> => {
    const { data, error } = await supabase.from('foods').select('*').eq('id', id).maybeSingle();
    if (error && (error as any).code !== 'PGRST116') {
      logError(error, 'Supabase getFoodById failed', { id });
      throw new Error(error.message);
    }
    return data;
  },

  getFoodByBarcode: async (barcode: string): Promise<FoodRecord | null> => {
    const normalized = normalizeBarcode(barcode);
    if (!normalized) return null;
    const { data, error } = await supabase.from('foods').select('*').eq('barcode', normalized).maybeSingle();
    if (error && (error as any).code !== 'PGRST116') {
      logError(error, 'Supabase getFoodByBarcode failed', { barcode: normalized });
      throw new Error(error.message);
    }
    return data;
  },

  getFoodByNameAndBrand: async (
    name: string,
    brand?: string | null,
  ): Promise<FoodRecord | null> => {
    const normalizedName = normalizeText(name);
    if (!normalizedName) return null;
    const normalizedBrand = normalizeText(brand || undefined);
    const query = supabase
      .from('foods')
      .select('*')
      .ilike('name', normalizedName)
      .limit(1);
    const { data, error } = normalizedBrand
      ? await query.ilike('brand', normalizedBrand).maybeSingle()
      : await query.maybeSingle();
    if (error && (error as any).code !== 'PGRST116') {
      logError(error, 'Supabase getFoodByNameAndBrand failed', {
        name: normalizedName,
        brand: normalizedBrand,
      });
      throw new Error(error.message);
    }
    return data;
  },

  searchFoods: async (term: string): Promise<FoodRecord[]> => {
    const normalizedTerm = normalizeText(term);
    if (!normalizedTerm) return [];
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .ilike('name', `%${normalizedTerm.toLowerCase()}%`)
      .limit(15);
    if (error) {
      logError(error, 'Supabase searchFoods failed', { term: normalizedTerm });
      throw new Error(error.message);
    }
    return data || [];
  },
};

export default foodService;