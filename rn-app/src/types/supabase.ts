export interface FoodRecord {
  id: number;
  name: string;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein_g: number;
  carbohydrates_total_g: number;
  fat_total_g: number;
  carbohydrates_fiber_g?: number | null;
  carbohydrates_sugar_g?: number | null;
  fat_saturated_g?: number | null;
  barcode?: string | null;
  brand?: string | null;
  is_generic?: boolean;
  created_at?: string;
  user_id?: string;
}

export interface WorkoutRecord {
  id: string;
  exerciseName: string;
  date: string;
  sets: number;
  reps: number;
  weight: number;
  notes?: string | null;
  createdAt?: string | null;
}
