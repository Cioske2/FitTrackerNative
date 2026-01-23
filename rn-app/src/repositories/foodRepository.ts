import { z } from "zod";
import { foodService, FoodInsert } from "../services/foodService";
import type { FoodRecord } from "../types/supabase";
import { foodRecordSchema } from "../validators/supabaseSchemas";

const foodArraySchema = z.array(foodRecordSchema);

export const foodRepository = {
  addFood: async (payload: FoodInsert): Promise<FoodRecord> => {
    const data = await foodService.addFood(payload);
    return foodRecordSchema.parse(data);
  },
  getByBarcode: async (barcode: string): Promise<FoodRecord | null> => {
    const data = await foodService.getFoodByBarcode(barcode);
    if (!data) return null;
    return foodRecordSchema.parse(data);
  },
  searchFoods: async (term: string): Promise<FoodRecord[]> => {
    const data = await foodService.searchFoods(term);
    return foodArraySchema.parse(data);
  },
  getAllFoods: async (): Promise<FoodRecord[]> => {
    const data = await foodService.getAllFoods();
    return foodArraySchema.parse(data);
  },
};

export default foodRepository;
