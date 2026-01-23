import { create, StateCreator } from 'zustand';
import { queryClient } from '../queryClient';
import workoutRepository from '../repositories/workoutRepository';
import { enqueueOfflineOperation } from '../services/offlineSyncService';
import { trackEvent } from '../services/analyticsService';

interface WorkoutState {
  workouts: any[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  page: number;
  pageSize: number;
  load: () => Promise<void>;
  loadMore: () => Promise<void>;
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
  loadingMore: false,
  hasMore: true,
  page: 0,
  pageSize: 60,
  load: async () => {
    set({ loading: true });
    try {
      const { items, count } = await queryClient.fetchQuery({
        queryKey: ['workouts', 0, get().pageSize],
        queryFn: () => workoutRepository.getWorkoutsPage(0, get().pageSize),
      });
      set({
        workouts: items,
        loading: false,
        page: 0,
        hasMore: items.length < count,
      });
    } catch {
      set({ loading: false });
    }
  },
  loadMore: async () => {
    const { loadingMore, hasMore, page, pageSize, workouts } = get();
    if (loadingMore || !hasMore) return;
    set({ loadingMore: true });
    try {
      const nextPage = page + 1;
      const { items, count } = await queryClient.fetchQuery({
        queryKey: ['workouts', nextPage, pageSize],
        queryFn: () => workoutRepository.getWorkoutsPage(nextPage, pageSize),
      });
      const nextWorkouts = [...workouts, ...items];
      set({
        workouts: nextWorkouts,
        loadingMore: false,
        page: nextPage,
        hasMore: nextWorkouts.length < count,
      });
    } catch {
      set({ loadingMore: false });
    }
  },
  add: async (w: any) => {
    try {
      const saved = await workoutRepository.addWorkout(w);
      set({ workouts: [...get().workouts, saved] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      trackEvent('workout_add');
    } catch {
      await enqueueOfflineOperation({ type: 'workout:add', payload: w });
      const local = { ...w, id: `local-${Date.now()}` };
      set({ workouts: [...get().workouts, local] });
      trackEvent('workout_add_offline');
    }
  },
  remove: async (id: string) => {
    try {
      await workoutRepository.deleteWorkout(id);
      trackEvent('workout_delete');
    } catch {
      await enqueueOfflineOperation({ type: 'workout:delete', payload: { id } });
      trackEvent('workout_delete_offline');
    }
    set({ workouts: get().workouts.filter((w:any) => w.id !== id) });
  },
  loadPlannedToday: async () => {
    try {
      const planned = await queryClient.fetchQuery({
        queryKey: ['plannedWorkoutToday'],
        queryFn: () => workoutRepository.getPlannedWorkoutForToday(),
      });
      set({ plannedToday: planned });
    } catch { /* ignore planned error */ }
  },
  loadPlannedTodayList: async () => {
    try {
      const list = await queryClient.fetchQuery({
        queryKey: ['plannedWorkoutsToday'],
        queryFn: () => workoutRepository.getPlannedWorkoutsForToday(),
      });
      set({ plannedTodayList: list });
    } catch { /* ignore list error */ }
  },
});

export const useWorkoutStore = create<WorkoutState>(creator);
