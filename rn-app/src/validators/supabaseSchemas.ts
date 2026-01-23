import { z } from "zod";

export const foodRecordSchema = z.object({
  id: z.number(),
  name: z.string(),
  serving_size: z.number(),
  serving_unit: z.string(),
  calories: z.number(),
  protein_g: z.number(),
  carbohydrates_total_g: z.number(),
  fat_total_g: z.number(),
  carbohydrates_fiber_g: z.number().nullable().optional(),
  carbohydrates_sugar_g: z.number().nullable().optional(),
  fat_saturated_g: z.number().nullable().optional(),
  barcode: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  is_generic: z.boolean().optional(),
  created_at: z.string().optional(),
  user_id: z.string().optional(),
});

export const workoutRecordSchema = z.object({
  id: z.any(),
  exercise: z.string(),
  workout_date: z.string(),
  sets: z.number(),
  reps: z.number(),
  weight: z.number(),
  notes: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export const diaryEntrySchema = z.object({
  id: z.number(),
  food_id: z.number().nullable().optional(),
  food_name_snapshot: z.string(),
  consumed_quantity: z.number(),
  consumed_unit: z.string(),
  conversion_factor: z.number().nullable().optional(),
  calories_calculated: z.number(),
  protein_g_calculated: z.number(),
  carbohydrates_total_g_calculated: z.number(),
  fat_total_g_calculated: z.number(),
  fiber_g_calculated: z.number().nullable().optional(),
  sugar_g_calculated: z.number().nullable().optional(),
  meal_type: z.string().nullable().optional(),
  consumption_date: z.string(),
  notes: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export const compositeMealSchema = z.object({
  id: z.number(),
  name: z.string(),
  meal_type: z.string().nullable().optional(),
  consumption_date: z.string(),
  total_calories: z.number(),
  total_protein_g: z.number(),
  total_carbohydrates_g: z.number(),
  total_fat_g: z.number(),
  notes: z.string().nullable().optional(),
  created_at: z.string().optional(),
  items: z.array(z.any()).optional(),
});

export const workoutPlanSchema = z.object({
  id: z.any(),
  weekday: z.number(),
  exercise: z.string(),
  sets: z.number(),
  reps: z.number(),
  notes: z.string().nullable().optional(),
});
