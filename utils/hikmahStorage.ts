import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "./constants";

const ROOT = "deen:hikmah:v1:";
const key = (k: string) => `${ROOT}${k}`;
const now = () => Date.now();

export interface ProgressData {
  completedLessonIds: string[];
  ts: number;
}

export interface LastReadData {
  treeId: string | number;
  lessonId: string | number;
  ts: number;
}

export async function getProgress(treeId: string | number): Promise<ProgressData> {
  try {
    const raw = await AsyncStorage.getItem(key(`progress:${treeId}`));
    if (!raw) return { completedLessonIds: [], ts: 0 };
    const parsed = JSON.parse(raw);
    if (!parsed?.completedLessonIds) return { completedLessonIds: [], ts: 0 };
    return parsed;
  } catch {
    return { completedLessonIds: [], ts: 0 };
  }
}

export async function setProgress(
  treeId: string | number,
  completedLessonIds: string[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      key(`progress:${treeId}`),
      JSON.stringify({
        completedLessonIds: Array.from(new Set(completedLessonIds)),
        ts: now(),
      })
    );
  } catch (e) {
    console.error("Failed to save progress", e);
  }
}

export async function getLastRead(): Promise<LastReadData | null> {
  try {
    const raw = await AsyncStorage.getItem(key("lastread"));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setLastRead(
  treeId: string | number,
  lessonId: string | number
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      key("lastread"),
      JSON.stringify({ treeId, lessonId, ts: now() })
    );
  } catch (e) {
    console.error("Failed to save last read", e);
  }
}

