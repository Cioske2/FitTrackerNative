import { z } from "zod";
import diaryService, { DiaryEntryInsert } from "../services/diaryService";
import { diaryEntrySchema, compositeMealSchema } from "../validators/supabaseSchemas";

const diaryArraySchema = z.array(diaryEntrySchema);
const compositeArraySchema = z.array(compositeMealSchema);

export const diaryRepository = {
  getEntriesForDate: async (date: string) => {
    const data = await diaryService.getDiaryEntriesForDate(date);
    return diaryArraySchema.parse(data);
  },
  getEntriesInRange: async (start: string, end: string) => {
    const data = await diaryService.getDiaryEntriesInRange(start, end);
    return diaryArraySchema.parse(data);
  },
  addEntry: async (payload: DiaryEntryInsert) => {
    const data = await diaryService.addDiaryEntry(payload);
    return diaryEntrySchema.parse(data);
  },
  updateEntry: async (id: number, patch: Partial<DiaryEntryInsert>) => {
    const data = await diaryService.updateDiaryEntry(id, patch);
    if (!data) return null;
    return diaryEntrySchema.parse(data);
  },
  deleteEntry: async (id: number) => diaryService.deleteDiaryEntry(id),
  addCompositeMeal: async (payload: any) => diaryService.addCompositeMeal(payload),
  getCompositeMealsForDate: async (date: string) => {
    const data = await diaryService.getCompositeMealsForDate(date);
    return compositeArraySchema.parse(data);
  },
};

export default diaryRepository;
