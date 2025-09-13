import { supabase } from './supabaseClient';

export interface DiaryEntryInsert {
  foodId?: number; // optional if free text snapshot only
  foodName: string;
  consumedQuantity: number;
  consumedUnit: string;
  conversionFactorToServingUnit?: number | null;
  calculatedNutrients: {
    calories: number;
    protein: number;
    carbohydrates_total: number;
    fat_total: number;
    fiber?: number | '' | null;
    sugar?: number | '' | null;
  };
  mealType?: string | null;
  consumptionDate: string; // YYYY-MM-DD
  notes?: string | null;
}

export const diaryService = {
  addDiaryEntry: async (entry: DiaryEntryInsert) => {
    const dataToInsert: any = {
      food_id: entry.foodId,
      food_name_snapshot: entry.foodName,
      consumed_quantity: entry.consumedQuantity,
      consumed_unit: entry.consumedUnit,
      conversion_factor: entry.conversionFactorToServingUnit,
      calories_calculated: entry.calculatedNutrients.calories,
      protein_g_calculated: entry.calculatedNutrients.protein,
      carbohydrates_total_g_calculated: entry.calculatedNutrients.carbohydrates_total,
      fat_total_g_calculated: entry.calculatedNutrients.fat_total,
      fiber_g_calculated: entry.calculatedNutrients.fiber === '' ? null : entry.calculatedNutrients.fiber,
      sugar_g_calculated: entry.calculatedNutrients.sugar === '' ? null : entry.calculatedNutrients.sugar,
      meal_type: entry.mealType || null,
      consumption_date: entry.consumptionDate,
      notes: entry.notes || null,
    };

    Object.keys(dataToInsert).forEach(k => dataToInsert[k] === undefined && delete dataToInsert[k]);

    const { data, error } = await supabase
      .from('diary_entries')
      .insert([dataToInsert])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  getDiaryEntriesForDate: async (dateString: string) => {
    if (!dateString) throw new Error('dateString richiesto');
    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('consumption_date', dateString)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },

  getDiaryEntriesInRange: async (startDate: string, endDate: string) => {
    if (!startDate || !endDate) throw new Error('date range richiesto');
    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .gte('consumption_date', startDate)
      .lte('consumption_date', endDate)
      .order('consumption_date', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },

  updateDiaryEntry: async (entryId: number, patch: Partial<DiaryEntryInsert>) => {
    const dataToUpdate: any = {};
    if (patch.foodName !== undefined) dataToUpdate.food_name_snapshot = patch.foodName;
    if (patch.consumedQuantity !== undefined) dataToUpdate.consumed_quantity = patch.consumedQuantity;
    if (patch.consumedUnit !== undefined) dataToUpdate.consumed_unit = patch.consumedUnit;
    if (patch.calculatedNutrients) {
      const n = patch.calculatedNutrients;
      dataToUpdate.calories_calculated = n.calories;
      dataToUpdate.protein_g_calculated = n.protein;
      dataToUpdate.carbohydrates_total_g_calculated = n.carbohydrates_total;
      dataToUpdate.fat_total_g_calculated = n.fat_total;
      if (n.fiber !== undefined) dataToUpdate.fiber_g_calculated = n.fiber === '' ? null : n.fiber;
      if (n.sugar !== undefined) dataToUpdate.sugar_g_calculated = n.sugar === '' ? null : n.sugar;
    }
    if (patch.mealType !== undefined) dataToUpdate.meal_type = patch.mealType || null;
    if (patch.notes !== undefined) dataToUpdate.notes = patch.notes || null;
    Object.keys(dataToUpdate).forEach(k => dataToUpdate[k] === undefined && delete dataToUpdate[k]);
    const { data, error } = await supabase.from('diary_entries').update(dataToUpdate).eq('id', entryId).select().maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },

  deleteDiaryEntry: async (entryId: number) => {
    const { error } = await supabase.from('diary_entries').delete().eq('id', entryId);
    if (error) throw new Error(error.message);
    return true;
  },
};

export default diaryService;