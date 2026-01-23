import { supabase } from './supabaseClient';

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

export const foodService = {
  addFood: async (food: FoodInsert) => {
    const dataToInsert: any = {
      name: food.name,
      serving_size: food.servingSize,
      serving_unit: food.serving_unit,
      calories: food.calories,
      protein_g: food.protein,
      carbohydrates_total_g: food.carbsTotal,
      carbohydrates_fiber_g: food.fiber === '' ? null : food.fiber,
      carbohydrates_sugar_g: food.sugar === '' ? null : food.sugar,
      fat_total_g: food.fatTotal,
      fat_saturated_g: food.saturatedFat === '' ? null : food.saturatedFat,
      barcode: food.barcode || null,
      brand: food.brand || null,
      is_generic: food.isGeneric ?? true,
    };
    Object.keys(dataToInsert).forEach(k => dataToInsert[k] === undefined && delete dataToInsert[k]);

    // Always add user_id for RLS policy compliance
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');
    dataToInsert.user_id = user.id;

    const { data, error } = await supabase.from('foods').insert([dataToInsert]).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  getAllFoods: async () => {
    const { data, error } = await supabase.from('foods').select('*').order('name', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },

  getFoodById: async (id: number) => {
    const { data, error } = await supabase.from('foods').select('*').eq('id', id).maybeSingle();
    if (error && (error as any).code !== 'PGRST116') throw new Error(error.message);
    return data;
  },

  getFoodByBarcode: async (barcode: string) => {
    if (!barcode) return null;
    const { data, error } = await supabase.from('foods').select('*').eq('barcode', barcode).maybeSingle();
    if (error && (error as any).code !== 'PGRST116') throw new Error(error.message);
    return data;
  },

  searchFoods: async (term: string) => {
    if (!term?.trim()) return [];
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .ilike('name', `%${term.toLowerCase()}%`)
      .limit(15);
    if (error) throw new Error(error.message);
    return data || [];
  },
};

export default foodService;