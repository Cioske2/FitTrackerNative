import AsyncStorage from "@react-native-async-storage/async-storage";
import { logError } from "./logger";

const QUEUE_KEY = "fittracker-offline-queue";

export type OfflineOperation =
  | { type: "diary:add"; payload: any }
  | { type: "diary:update"; payload: { id: number; patch: any } }
  | { type: "diary:delete"; payload: { id: number } }
  | { type: "diary:composite-add"; payload: any }
  | { type: "workout:add"; payload: any }
  | { type: "workout:delete"; payload: { id: string } }
  | { type: "workoutplan:add"; payload: { weekday: number; exercise: string; sets: number; reps: number; notes?: string } }
  | { type: "workoutplan:update"; payload: { id: string; patch: { exercise?: string; sets?: number; reps?: number; notes?: string; weekday?: number } } }
  | { type: "workoutplan:delete"; payload: { id: string } };

async function readQueue(): Promise<OfflineOperation[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OfflineOperation[];
  } catch (error) {
    logError(error, "Offline queue read failed");
    return [];
  }
}

async function writeQueue(queue: OfflineOperation[]) {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    logError(error, "Offline queue write failed");
  }
}

export async function enqueueOperation(op: OfflineOperation) {
  const queue = await readQueue();
  queue.push(op);
  await writeQueue(queue);
}

export async function drainQueue(
  handler: (op: OfflineOperation) => Promise<void>,
) {
  const queue = await readQueue();
  if (!queue.length) return;
  const remaining: OfflineOperation[] = [];
  for (const op of queue) {
    try {
      await handler(op);
    } catch (error) {
      logError(error, "Offline queue operation failed", { type: op.type });
      remaining.push(op);
    }
  }
  await writeQueue(remaining);
}
