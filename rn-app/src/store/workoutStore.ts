import { create, StateCreator } from 'zustand';
import { workoutService } from '../services/workoutService';

interface WorkoutState {
  workouts: any[];
  loading: boolean;
  load: () => Promise<void>;
  add: (w: any) => Promise<void>;
  remove: (id: string) => Promise<void>;
  plannedToday: any | null;
  loadPlannedToday: () => Promise<void>;
  plannedTodayList: any[];
  loadPlannedTodayList: () => Promise<void>;
}

const creator: StateCreator<WorkoutState> = (set, get) => ({
  workouts: [],
  plannedToday: null,
  plannedTodayList: [],
  loading: false,
  load: async () => {
    set({ loading: true });
    try {
      const data = await workoutService.loadWorkouts();
      set({ workouts: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  add: async (w: any) => { await workoutService.addWorkout(w); await get().load(); },
  remove: async (id: string) => { await workoutService.deleteWorkout(id); set({ workouts: get().workouts.filter((w:any) => w.id !== id) }); },
  loadPlannedToday: async () => {
    try {
      const planned = await workoutService.getPlannedWorkoutForToday();
      set({ plannedToday: planned });
    } catch { /* ignore planned error */ }
  },
  loadPlannedTodayList: async () => {
    try {
      const list = await workoutService.getPlannedWorkoutsForToday();
      set({ plannedTodayList: list });
    } catch { /* ignore list error */ }
  },
});

export const useWorkoutStore = create<WorkoutState>(creator);
