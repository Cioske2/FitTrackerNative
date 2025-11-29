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
  // ---- Composite meals (AI analyzed) ----
  addCompositeMeal: async (mealData: { name?: string; mealType?: string; date: string; totals: { calories: number; protein: number; carbs: number; fat: number }; items: { name: string; originalName?: string; quantity: number; unit: string; calories: number; protein: number; carbs: number; fat: number; foodId?: number | null; source?: string | null }[]; notes?: string | null }) => {
    const header = {
      name: mealData.name || `Pasto ${mealData.date}`,
      meal_type: mealData.mealType || 'AI',
      consumption_date: mealData.date,
      total_calories: mealData.totals.calories,
      total_protein_g: mealData.totals.protein,
      total_carbohydrates_g: mealData.totals.carbs,
      total_fat_g: mealData.totals.fat,
      notes: mealData.notes || null
    } as any;
    const { data: insertedMeal, error: mealErr } = await supabase.from('composite_meals').insert(header).select().single();
    if (mealErr) throw new Error(mealErr.message);
    if (!insertedMeal?.id) throw new Error('Insert composite meal failed');
    const itemsPayload = mealData.items.map(i => ({
      composite_meal_id: insertedMeal.id,
      item_name: i.name,
      quantity: i.quantity,
      unit: i.unit,
      calories: i.calories,
      protein_g: i.protein,
      carbohydrates_g: i.carbs,
      fat_g: i.fat,
      food_database_id: i.foodId || null,
      source_database: i.source || null,
      original_cv_name: i.originalName || i.name
    }));
    const { error: itemsErr } = await supabase.from('composite_meal_items').insert(itemsPayload);
    if (itemsErr) { await supabase.from('composite_meals').delete().eq('id', insertedMeal.id); throw new Error(itemsErr.message); }
    return insertedMeal;
  },
  getCompositeMealsForDate: async (dateString: string) => {
    const { data: meals, error } = await supabase.from('composite_meals').select('*').eq('consumption_date', dateString).order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    if (!meals || meals.length === 0) return [];
    const withItems = await Promise.all(meals.map(async (m: any) => {
      const { data: items, error: itemsErr } = await supabase.from('composite_meal_items').select('*').eq('composite_meal_id', m.id).order('created_at', { ascending: true });
      return { ...m, items: itemsErr ? [] : (items || []) };
    }));
    return withItems;
  }
};

export default diaryService;