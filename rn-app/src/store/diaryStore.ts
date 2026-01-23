import { create, StateCreator } from 'zustand';
import { DiaryEntryInsert } from '../services/diaryService';
import { queryClient } from '../queryClient';
import diaryRepository from '../repositories/diaryRepository';
import { enqueueOfflineOperation } from '../services/offlineSyncService';
import { trackEvent } from '../services/analyticsService';

interface DiaryState {
  date: string; // YYYY-MM-DD
  entries: any[];
  loading: boolean;
  error?: string | null;
  compositeMeals?: any[];
  loadingComposite?: boolean;
  setDate: (d: string) => void;
  load: () => Promise<void>;
  loadCompositeMeals?: () => Promise<void>;
  addEntry: (payload: any) => Promise<void>;
  removeEntry: (id: number) => Promise<void>;
  updateEntry: (id: number, patch: any) => Promise<void>;
  history7d: { date: string; calories: number; protein: number; carbs: number; fat: number }[];
  loadHistory: (days: number) => Promise<void>;
  addCompositeMealFromAI?: (payload: { dishes: { name: string; calories: number; protein: number; carbs: number; fat: number; quantityText: string }[] }) => Promise<void>;
}

const buildLocalEntry = (entry: DiaryEntryInsert) => ({
  id: -Date.now(),
  food_id: entry.foodId ?? null,
  food_name_snapshot: entry.foodName,
  consumed_quantity: entry.consumedQuantity,
  consumed_unit: entry.consumedUnit,
  conversion_factor: entry.conversionFactorToServingUnit ?? null,
  calories_calculated: entry.calculatedNutrients.calories,
  protein_g_calculated: entry.calculatedNutrients.protein,
  carbohydrates_total_g_calculated: entry.calculatedNutrients.carbohydrates_total,
  fat_total_g_calculated: entry.calculatedNutrients.fat_total,
  fiber_g_calculated: entry.calculatedNutrients.fiber ?? null,
  sugar_g_calculated: entry.calculatedNutrients.sugar ?? null,
  meal_type: entry.mealType ?? null,
  consumption_date: entry.consumptionDate,
  notes: entry.notes ?? null,
  created_at: new Date().toISOString(),
  local_only: true,
});

const buildLocalComposite = (payload: any) => ({
  id: -Date.now(),
  name: payload.name || 'Pasto AI (offline)',
  meal_type: payload.mealType || 'AI',
  consumption_date: payload.date,
  total_calories: payload.totals?.calories || 0,
  total_protein_g: payload.totals?.protein || 0,
  total_carbohydrates_g: payload.totals?.carbs || 0,
  total_fat_g: payload.totals?.fat || 0,
  notes: payload.notes || null,
  created_at: new Date().toISOString(),
  items: payload.items || [],
  local_only: true,
});

const creator: StateCreator<DiaryState> = (set, get) => ({
  date: new Date().toISOString().slice(0, 10),
  entries: [],
  loading: false,
  error: null,
  history7d: [],
  compositeMeals: [],
  loadingComposite: false,
  setDate: (d: string) => set({ date: d }),
  load: async () => {
    const { date } = get();
    set({ loading: true, error: null });
    try {
      const data = await queryClient.fetchQuery({
        queryKey: ['diaryEntries', date],
        queryFn: () => diaryRepository.getEntriesForDate(date),
      });
      set({ entries: data, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },
  loadCompositeMeals: async () => {
    const { date } = get();
    set({ loadingComposite: true });
    try {
      const meals = await queryClient.fetchQuery({
        queryKey: ['compositeMeals', date],
        queryFn: () => diaryRepository.getCompositeMealsForDate(date),
      });
      set({ compositeMeals: meals, loadingComposite: false });
    } catch { set({ loadingComposite: false }); }
  },
  addEntry: async (payload: DiaryEntryInsert) => {
    try {
      const saved = await diaryRepository.addEntry(payload);
      set((state: any) => ({ entries: [...state.entries, saved] }));
      queryClient.invalidateQueries({ queryKey: ['diaryEntries', payload.consumptionDate] });
      trackEvent('diary_add');
    } catch {
      await enqueueOfflineOperation({ type: 'diary:add', payload });
      const localEntry = buildLocalEntry(payload);
      set((state: any) => ({ entries: [...state.entries, localEntry] }));
      trackEvent('diary_add_offline');
    }
  },
  removeEntry: async (id: number) => {
    try {
      await diaryRepository.deleteEntry(id);
      trackEvent('diary_delete');
    } catch {
      await enqueueOfflineOperation({ type: 'diary:delete', payload: { id } });
      trackEvent('diary_delete_offline');
    }
    set((state: any) => ({ entries: state.entries.filter((e: any) => e.id !== id) }));
  },
  updateEntry: async (id: number, patch: any) => {
    try {
      const updated = await diaryRepository.updateEntry(id, patch);
      if (updated) {
        set((state: any) => ({
          entries: state.entries.map((e: any) => (e.id === id ? updated : e)),
        }));
      }
      trackEvent('diary_update');
    } catch {
      await enqueueOfflineOperation({ type: 'diary:update', payload: { id, patch } });
      set((state: any) => ({
        entries: state.entries.map((e: any) => (e.id === id ? { ...e, ...patch } : e)),
      }));
      trackEvent('diary_update_offline');
    }
  },
  loadHistory: async (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);
    try {
      const data = await queryClient.fetchQuery({
        queryKey: ['diaryHistory', startStr, endStr],
        queryFn: () => diaryRepository.getEntriesInRange(startStr, endStr),
      });
      const map: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {};
      for (let i = 0; i < days; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        map[key] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      data.forEach((e: any) => {
        const key = e.consumption_date;
        if (!map[key]) map[key] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        map[key].calories += e.calories_calculated || 0;
        map[key].protein += e.protein_g_calculated || 0;
        map[key].carbs += e.carbohydrates_total_g_calculated || 0;
        map[key].fat += e.fat_total_g_calculated || 0;
      });
      const history = Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).map(([date, vals]) => ({ date, ...vals }));
      set({ history7d: history });
    } catch (e: any) { /* ignore */ }
  },
  addCompositeMealFromAI: async ({ dishes }) => {
    // Remove try/catch to let errors propagate to the UI
    const today = get().date;
    const totals = dishes.reduce((acc, d) => { acc.calories += d.calories; acc.protein += d.protein; acc.carbs += d.carbs; acc.fat += d.fat; return acc; }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    // Save only as composite meal (not as individual diary entries to avoid duplicates)
    const payload = {
      name: `Pasto AI ${new Date().toLocaleTimeString()}`,
      mealType: 'AI',
      date: today,
      totals: {
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat
      },
      items: dishes.map(d => ({
        name: d.name,
        originalName: d.name,
        quantity: 1,
        unit: d.quantityText || 'porzione',
        calories: d.calories,
        protein: d.protein,
        carbs: d.carbs,
        fat: d.fat
      }))
    };

    try {
      if ((diaryRepository as any).addCompositeMeal) {
        await (diaryRepository as any).addCompositeMeal(payload);
      }
      trackEvent('composite_meal_add');
    } catch {
      await enqueueOfflineOperation({ type: 'diary:composite-add', payload });
      const local = buildLocalComposite(payload);
      set((state: any) => ({ compositeMeals: [...(state.compositeMeals || []), local] }));
      trackEvent('composite_meal_add_offline');
    }

    // Refresh composite meals list
    const lcm = (get() as any).loadCompositeMeals; if (typeof lcm === 'function') await lcm();
  }
});

export const useDiaryStore = create<DiaryState>(creator);
