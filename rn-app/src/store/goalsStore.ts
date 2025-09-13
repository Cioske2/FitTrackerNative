import { create, StateCreator } from 'zustand';
import { goalsService } from '../services/goalsService';

interface GoalsState {
  goals: { calories:number; protein:number; carbohydrates:number; fat:number } | null;
  loading: boolean;
  load: () => Promise<void>;
  save: (partial: Partial<{ calories:number; protein:number; carbohydrates:number; fat:number }>) => Promise<void>;
  reset: () => Promise<void>;
}

const creator: StateCreator<GoalsState> = (set, get) => ({
  goals: null,
  loading: false,
  load: async () => {
    set({ loading: true });
    const g = await goalsService.getGoals();
    set({ goals: g, loading: false });
  },
  save: async (partial: Partial<{ calories:number; protein:number; carbohydrates:number; fat:number }>) => {
    const g = await goalsService.saveGoals(partial);
    set({ goals: g });
  },
  reset: async () => {
    const g = await goalsService.resetGoals();
    set({ goals: g });
  }
});

export const useGoalsStore = create<GoalsState>(creator);
