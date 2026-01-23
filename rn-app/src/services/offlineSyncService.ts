import { enqueueOperation, drainQueue, OfflineOperation } from "../utils/offlineQueue";
import diaryRepository from "../repositories/diaryRepository";
import workoutRepository from "../repositories/workoutRepository";
import { logError } from "../utils/logger";
import { trackEvent } from "./analyticsService";

export async function syncOfflineQueue() {
  await drainQueue(async (op) => {
    switch (op.type) {
      case "diary:add":
        await diaryRepository.addEntry(op.payload);
        trackEvent("offline_sync_diary_add");
        return;
      case "diary:update":
        await diaryRepository.updateEntry(op.payload.id, op.payload.patch);
        trackEvent("offline_sync_diary_update");
        return;
      case "diary:delete":
        await diaryRepository.deleteEntry(op.payload.id);
        trackEvent("offline_sync_diary_delete");
        return;
      case "diary:composite-add":
        await diaryRepository.addCompositeMeal(op.payload);
        trackEvent("offline_sync_composite_add");
        return;
      case "workout:add":
        await workoutRepository.addWorkout(op.payload);
        trackEvent("offline_sync_workout_add");
        return;
      case "workout:delete":
        await workoutRepository.deleteWorkout(op.payload.id);
        trackEvent("offline_sync_workout_delete");
        return;
      case "workoutplan:add":
        await workoutRepository.addPlan(op.payload);
        trackEvent("offline_sync_workoutplan_add");
        return;
      case "workoutplan:update":
        await workoutRepository.updatePlan(op.payload.id, op.payload.patch);
        trackEvent("offline_sync_workoutplan_update");
        return;
      case "workoutplan:delete":
        await workoutRepository.deletePlan(op.payload.id);
        trackEvent("offline_sync_workoutplan_delete");
        return;
      default:
        return;
    }
  });
}

export async function enqueueOfflineOperation(op: OfflineOperation) {
  try {
    await enqueueOperation(op);
  } catch (error) {
    logError(error, "Failed to enqueue offline operation", { type: op.type });
  }
}
