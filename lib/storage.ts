import type { AppData, DayLog, FoodItem, MealTemplate, UserProfile } from "./types";
import { DEFAULT_FOOD_LIBRARY, DEFAULT_PROFILE, BREAKFAST_TEMPLATE } from "./defaults";

const DB_NAME = "cut-tracker-db";
const DB_VERSION = 1;
const STORE_PROFILE = "profile";
const STORE_LOGS = "logs";
const STORE_FOODS = "foods";
const STORE_TEMPLATES = "templates";

// localStorage fallback keys
const LS_PROFILE = "ct_profile";
const LS_LOGS = "ct_logs";
const LS_FOODS = "ct_foods";
const LS_TEMPLATES = "ct_templates";

let dbInstance: IDBDatabase | null = null;
let useIDB = true;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PROFILE)) db.createObjectStore(STORE_PROFILE);
      if (!db.objectStoreNames.contains(STORE_LOGS)) db.createObjectStore(STORE_LOGS, { keyPath: "date" });
      if (!db.objectStoreNames.contains(STORE_FOODS)) db.createObjectStore(STORE_FOODS, { keyPath: "id" });
      if (!db.objectStoreNames.contains(STORE_TEMPLATES)) db.createObjectStore(STORE_TEMPLATES, { keyPath: "id" });
    };
    req.onsuccess = (e) => {
      dbInstance = (e.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(store: string, key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

async function idbGetAll<T>(store: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(store: string, value: unknown, key?: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = key !== undefined ? tx.objectStore(store).put(value, key) : tx.objectStore(store).put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(store: string, key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Local storage helpers
function lsGet<T>(key: string): T | undefined {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : undefined;
  } catch { return undefined; }
}

function lsSet(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function lsDel(key: string) {
  try { localStorage.removeItem(key); } catch {}
}

// Profile
export async function getProfile(): Promise<UserProfile> {
  try {
    if (useIDB) {
      const p = await idbGet<UserProfile>(STORE_PROFILE, "profile");
      if (p) return p;
    }
  } catch { useIDB = false; }
  return lsGet<UserProfile>(LS_PROFILE) ?? { ...DEFAULT_PROFILE };
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  try {
    if (useIDB) { await idbPut(STORE_PROFILE, profile, "profile"); return; }
  } catch { useIDB = false; }
  lsSet(LS_PROFILE, profile);
}

// Day logs
export async function getDayLog(date: string): Promise<DayLog | undefined> {
  try {
    if (useIDB) return await idbGet<DayLog>(STORE_LOGS, date);
  } catch { useIDB = false; }
  const all = lsGet<Record<string, DayLog>>(LS_LOGS) ?? {};
  return all[date];
}

export async function getAllLogs(): Promise<DayLog[]> {
  try {
    if (useIDB) return await idbGetAll<DayLog>(STORE_LOGS);
  } catch { useIDB = false; }
  const all = lsGet<Record<string, DayLog>>(LS_LOGS) ?? {};
  return Object.values(all);
}

export async function saveDayLog(log: DayLog): Promise<void> {
  try {
    if (useIDB) { await idbPut(STORE_LOGS, log); return; }
  } catch { useIDB = false; }
  const all = lsGet<Record<string, DayLog>>(LS_LOGS) ?? {};
  all[log.date] = log;
  lsSet(LS_LOGS, all);
}

export async function deleteDayLog(date: string): Promise<void> {
  try {
    if (useIDB) { await idbDelete(STORE_LOGS, date); return; }
  } catch { useIDB = false; }
  const all = lsGet<Record<string, DayLog>>(LS_LOGS) ?? {};
  delete all[date];
  lsSet(LS_LOGS, all);
}

// Food library
export async function getFoodLibrary(): Promise<FoodItem[]> {
  try {
    if (useIDB) {
      const items = await idbGetAll<FoodItem>(STORE_FOODS);
      if (items.length > 0) return items;
    }
  } catch { useIDB = false; }
  const ls = lsGet<FoodItem[]>(LS_FOODS);
  return ls ?? [...DEFAULT_FOOD_LIBRARY];
}

export async function saveFoodItem(item: FoodItem): Promise<void> {
  try {
    if (useIDB) { await idbPut(STORE_FOODS, item); return; }
  } catch { useIDB = false; }
  const all = lsGet<FoodItem[]>(LS_FOODS) ?? [...DEFAULT_FOOD_LIBRARY];
  const idx = all.findIndex(f => f.id === item.id);
  if (idx >= 0) all[idx] = item; else all.push(item);
  lsSet(LS_FOODS, all);
}

export async function deleteFoodItem(id: string): Promise<void> {
  try {
    if (useIDB) { await idbDelete(STORE_FOODS, id); return; }
  } catch { useIDB = false; }
  const all = lsGet<FoodItem[]>(LS_FOODS) ?? [];
  lsSet(LS_FOODS, all.filter(f => f.id !== id));
}

// Meal templates
export async function getMealTemplates(): Promise<MealTemplate[]> {
  try {
    if (useIDB) {
      const items = await idbGetAll<MealTemplate>(STORE_TEMPLATES);
      if (items.length > 0) return items;
    }
  } catch { useIDB = false; }
  const ls = lsGet<MealTemplate[]>(LS_TEMPLATES);
  return ls ?? [{ ...BREAKFAST_TEMPLATE }];
}

export async function saveMealTemplate(template: MealTemplate): Promise<void> {
  try {
    if (useIDB) { await idbPut(STORE_TEMPLATES, template); return; }
  } catch { useIDB = false; }
  const all = lsGet<MealTemplate[]>(LS_TEMPLATES) ?? [];
  const idx = all.findIndex(t => t.id === template.id);
  if (idx >= 0) all[idx] = template; else all.push(template);
  lsSet(LS_TEMPLATES, all);
}

export async function deleteMealTemplate(id: string): Promise<void> {
  try {
    if (useIDB) { await idbDelete(STORE_TEMPLATES, id); return; }
  } catch { useIDB = false; }
  const all = lsGet<MealTemplate[]>(LS_TEMPLATES) ?? [];
  lsSet(LS_TEMPLATES, all.filter(t => t.id !== id));
}

// Export / Import
export async function exportData(): Promise<AppData> {
  const [profile, logs, foodLibrary, mealTemplates] = await Promise.all([
    getProfile(),
    getAllLogs(),
    getFoodLibrary(),
    getMealTemplates(),
  ]);
  const logsRecord: Record<string, DayLog> = {};
  logs.forEach(l => { logsRecord[l.date] = l; });
  return { profile, logs: logsRecord, foodLibrary, mealTemplates };
}

export async function importData(data: AppData, mode: "merge" | "overwrite" = "overwrite"): Promise<void> {
  await saveProfile(data.profile);
  if (mode === "overwrite") {
    // clear existing logs
    const existing = await getAllLogs();
    for (const l of existing) await deleteDayLog(l.date);
  }
  for (const log of Object.values(data.logs)) await saveDayLog(log);
  for (const food of data.foodLibrary) await saveFoodItem(food);
  for (const tmpl of data.mealTemplates) await saveMealTemplate(tmpl);
}

export async function resetAllData(): Promise<void> {
  try {
    if (useIDB) {
      const db = await openDB();
      const stores = [STORE_PROFILE, STORE_LOGS, STORE_FOODS, STORE_TEMPLATES];
      for (const store of stores) {
        await new Promise<void>((res, rej) => {
          const tx = db.transaction(store, "readwrite");
          const req = tx.objectStore(store).clear();
          req.onsuccess = () => res();
          req.onerror = () => rej();
        });
      }
      return;
    }
  } catch { useIDB = false; }
  lsDel(LS_PROFILE); lsDel(LS_LOGS); lsDel(LS_FOODS); lsDel(LS_TEMPLATES);
}

// Seed defaults if empty
export async function seedIfEmpty(): Promise<void> {
  try {
    const profile = await getProfile();
    // Already exists if name is set
    if (!profile || !profile.name) {
      await saveProfile({ ...DEFAULT_PROFILE });
    }
    const foods = await getFoodLibrary();
    if (foods.length === 0) {
      for (const f of DEFAULT_FOOD_LIBRARY) await saveFoodItem(f);
    }
    const templates = await getMealTemplates();
    if (templates.length === 0) {
      await saveMealTemplate({ ...BREAKFAST_TEMPLATE });
    }
  } catch (e) {
    console.error("Seed error", e);
  }
}
