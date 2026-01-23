import { z } from "zod";
import { workoutService, WorkoutInsert } from "../services/workoutService";
import { workoutRecordSchema, workoutPlanSchema } from "../validators/supabaseSchemas";
import type { WorkoutRecord } from "../types/supabase";

const workoutArraySchema = z.array(workoutRecordSchema);
const workoutPlanArraySchema = z.array(workoutPlanSchema);

export const workoutRepository = {
  getWorkoutsPage: async (page = 0, pageSize = 60): Promise<{ items: WorkoutRecord[]; count: number }> => {
    const data = await workoutService.loadWorkoutsPage(page, pageSize);
    const validated = workoutArraySchema.parse(
      data.items.map((w: any) => ({
        id: w.id,
        exercise: w.exerciseName ?? w.exercise,
        workout_date: w.date ?? w.workout_date,
        sets: w.sets,
        reps: w.reps,
        weight: w.weight,
        notes: w.notes,
        created_at: w.createdAt ?? w.created_at,
      })),
    );
    const items = validated.map((w) => ({
      id: String(w.id),
      exerciseName: w.exercise,
      date: w.workout_date,
      sets: w.sets,
      reps: w.reps,
      weight: w.weight,
      notes: w.notes,
      createdAt: w.created_at,
    }));
    return { items, count: data.count };
  },
  addWorkout: async (payload: WorkoutInsert): Promise<WorkoutRecord> => {
    const data = await workoutService.addWorkout(payload);
    return {
      id: data.id,
      exerciseName: data.exerciseName,
      date: data.date,
      sets: data.sets,
      reps: data.reps,
      weight: data.weight,
      notes: data.notes,
      createdAt: data.createdAt,
    };
  },
  deleteWorkout: async (id: string) => workoutService.deleteWorkout(id),
  getPlannedWorkoutForToday: async () => workoutService.getPlannedWorkoutForToday(),
  getPlannedWorkoutsForToday: async () => workoutService.getPlannedWorkoutsForToday(),
  addPlan: async (plan: { weekday: number; exercise: string; sets: number; reps: number; notes?: string }) =>
    workoutPlanSchema.parse(await workoutService.addPlan(plan)),
  updatePlan: async (id: string, patch: { exercise?: string; sets?: number; reps?: number; notes?: string; weekday?: number }) =>
    workoutPlanSchema.parse(await workoutService.updatePlan(id, patch)),
  deletePlan: async (id: string) => workoutService.deletePlan(id),
  getAllPlans: async () => workoutPlanArraySchema.parse(await workoutService.getAllPlans()),
};

export default workoutRepository;
