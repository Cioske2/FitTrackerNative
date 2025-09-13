import { create, StateCreator } from 'zustand';
import { diaryService, DiaryEntryInsert } from '../services/diaryService';

interface DiaryState {
  date: string; // YYYY-MM-DD
  entries: any[];
  loading: boolean;
  error?: string | null;
  setDate: (d: string) => void;
  load: () => Promise<void>;
  addEntry: (payload: any) => Promise<void>;
  removeEntry: (id: number) => Promise<void>;
  updateEntry: (id: number, patch: any) => Promise<void>;
  history7d: { date: string; calories: number; protein: number; carbs: number; fat: number }[];
  loadHistory: (days: number) => Promise<void>;
}

const creator: StateCreator<DiaryState> = (set, get) => ({
  date: new Date().toISOString().slice(0,10),
  entries: [],
  loading: false,
  error: null,
  history7d: [],
  setDate: (d: string) => set({ date: d }),
  load: async () => {
    const { date } = get();
    set({ loading: true, error: null });
    try {
      const data = await diaryService.getDiaryEntriesForDate(date);
      set({ entries: data, loading: false });
    } catch (e:any) {
      set({ error: e.message, loading: false });
    }
  },
  addEntry: async (payload: DiaryEntryInsert) => {
    await diaryService.addDiaryEntry(payload);
    await get().load();
  },
  removeEntry: async (id: number) => {
    await diaryService.deleteDiaryEntry(id);
    set((state: any) => ({ entries: state.entries.filter((e:any) => e.id !== id) }));
  },
  updateEntry: async (id: number, patch: any) => {
    await diaryService.updateDiaryEntry(id, patch);
    await get().load();
  },
  loadHistory: async (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    const startStr = start.toISOString().slice(0,10);
    const endStr = end.toISOString().slice(0,10);
    try {
      const data = await diaryService.getDiaryEntriesInRange(startStr, endStr);
      const map: Record<string, { calories:number; protein:number; carbs:number; fat:number }> = {};
      for (let i=0;i<days;i++) {
        const d = new Date(start);
        d.setDate(start.getDate()+i);
        const key = d.toISOString().slice(0,10);
        map[key] = { calories:0, protein:0, carbs:0, fat:0 };
      }
      data.forEach((e:any) => {
        const key = e.consumption_date;
        if (!map[key]) map[key] = { calories:0, protein:0, carbs:0, fat:0 };
        map[key].calories += e.calories_calculated || 0;
        map[key].protein += e.protein_g_calculated || 0;
        map[key].carbs += e.carbohydrates_total_g_calculated || 0;
        map[key].fat += e.fat_total_g_calculated || 0;
      });
      const history = Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0])).map(([date,vals])=>({ date, ...vals }));
      set({ history7d: history });
    } catch(e:any) { /* ignore */ }
  }
});

export const useDiaryStore = create<DiaryState>(creator);
