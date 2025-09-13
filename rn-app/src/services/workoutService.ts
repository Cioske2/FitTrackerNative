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
  }
};

export default workoutService;