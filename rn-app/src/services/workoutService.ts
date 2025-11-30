import { supabase } from './supabaseClient';

export interface WorkoutInsert {
  exerciseName: string;
  date: string; // YYYY-MM-DD
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
}

export const workoutService = {
  loadWorkouts: async () => {
    const { data, error } = await supabase.from('workouts').select('*').order('workout_date', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((w: any) => ({
      id: w.id,
      exerciseName: w.exercise,
      date: w.workout_date,
      sets: w.sets,
      reps: w.reps,
      weight: w.weight,
      notes: w.notes,
      createdAt: w.created_at,
    }));
  },
  addWorkout: async (w: WorkoutInsert) => {
    const { data, error } = await supabase.from('workouts').insert([
      {
        exercise: w.exerciseName,
        workout_date: w.date,
        sets: w.sets,
        reps: w.reps,
        weight: w.weight || 0,
        notes: w.notes || '',
        user_id: (await supabase.auth.getUser()).data.user?.id
      }
    ]).select().single();
    if (error) throw new Error(error.message);
    return {
      id: data.id,
      exerciseName: data.exercise,
      date: data.workout_date,
      sets: data.sets,
      reps: data.reps,
      weight: data.weight,
      notes: data.notes,
      createdAt: data.created_at,
    };
  },
  deleteWorkout: async (id: string) => {
    const { error } = await supabase.from('workouts').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },
  getWorkoutsByExercise: async (exercise: string) => {
    const { data, error } = await supabase.from('workouts').select('*').ilike('exercise', exercise);
    if (error) throw new Error(error.message);
    return data || [];
  },
  // Fetches the planned workout for today (first row) using only weekday INT
  getPlannedWorkoutForToday: async () => {
    const today = new Date();
    const weekday = today.getDay();
    const { data, error } = await supabase.from('workout_plans').select('*').eq('weekday', weekday).limit(1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return null;
    const w = data[0];
    return {
      id: w.id,
      exerciseName: w.exercise,
      planned: true,
      sets: w.sets,
      reps: w.reps,
      notes: w.notes || '',
      weekday,
    };
  },
  // Returns all planned rows for today's weekday (weekday INT only)
  getPlannedWorkoutsForToday: async () => {
    const today = new Date();
    const weekday = today.getDay();
    const { data, error } = await supabase.from('workout_plans').select('*').eq('weekday', weekday);
    if (error) throw new Error(error.message);
    return (data || []).map((w: any) => ({
      id: w.id,
      exerciseName: w.exercise,
      planned: true,
      sets: w.sets,
      reps: w.reps,
      notes: w.notes || '',
      weekday,
    }));
  },
  // CRUD for workout_plans (scheda settimanale)
  addPlan: async (plan: { weekday: number; exercise: string; sets: number; reps: number; notes?: string }) => {
    const user = (await supabase.auth.getUser()).data.user;
    const planWithUser = { ...plan, user_id: user?.id };
    const { data, error } = await supabase.from('workout_plans').insert([planWithUser]).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  updatePlan: async (id: string, patch: { exercise?: string; sets?: number; reps?: number; notes?: string; weekday?: number }) => {
    const { data, error } = await supabase.from('workout_plans').update(patch).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },
  deletePlan: async (id: string) => {
    const { error } = await supabase.from('workout_plans').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },
  getAllPlans: async () => {
    const { data, error } = await supabase.from('workout_plans').select('*').order('weekday', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },
};

export default workoutService;