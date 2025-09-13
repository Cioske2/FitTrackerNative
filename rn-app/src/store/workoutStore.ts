import { create, StateCreator } from 'zustand';
import { workoutService } from '../services/workoutService';

interface WorkoutState {
  workouts: any[];
  loading: boolean;
  load: () => Promise<void>;
  add: (w: any) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const creator: StateCreator<WorkoutState> = (set, get) => ({
  workouts: [],
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
});

export const useWorkoutStore = create<WorkoutState>(creator);
