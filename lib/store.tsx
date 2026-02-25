"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { AppData, DayLog, FoodItem, MealEntry, MealTemplate, TrainingEntry, UserProfile } from "@/lib/types";
import {
  getProfile, saveProfile,
  getDayLog, getAllLogs, saveDayLog,
  getFoodLibrary, saveFoodItem, deleteFoodItem,
  getMealTemplates, saveMealTemplate, deleteMealTemplate,
  exportData, importData, resetAllData, seedIfEmpty,
} from "@/lib/storage";
import { DEFAULT_PROFILE, DEFAULT_FOOD_LIBRARY, BREAKFAST_TEMPLATE } from "@/lib/defaults";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";

interface AppStore {
  profile: UserProfile;
  logs: Record<string, DayLog>;
  foodLibrary: FoodItem[];
  mealTemplates: MealTemplate[];
  loading: boolean;
  updateProfile: (p: Partial<UserProfile>) => Promise<void>;
  getLog: (date: string) => DayLog | undefined;
  addMeal: (date: string, meal: Omit<MealEntry, "id">) => Promise<void>;
  updateMeal: (date: string, meal: MealEntry) => Promise<void>;
  deleteMeal: (date: string, mealId: string) => Promise<void>;
  addTraining: (date: string, training: Omit<TrainingEntry, "id">) => Promise<void>;
  updateTraining: (date: string, training: TrainingEntry) => Promise<void>;
  deleteTraining: (date: string, trainingId: string) => Promise<void>;
  updateMetrics: (date: string, metrics: Partial<DayLog["metrics"]>) => Promise<void>;
  updateDayNote: (date: string, note: string) => Promise<void>;
  setDayTypeOverride: (date: string, type: DayLog["dayTypeOverride"]) => Promise<void>;
  addFoodItem: (item: Omit<FoodItem, "id">) => Promise<void>;
  updateFoodItem: (item: FoodItem) => Promise<void>;
  removeFoodItem: (id: string) => Promise<void>;
  addMealTemplate: (template: Omit<MealTemplate, "id">) => Promise<void>;
  removeMealTemplate: (id: string) => Promise<void>;
  exportJSON: () => Promise<void>;
  exportCSV: () => Promise<void>;
  importJSON: (data: AppData, mode: "merge" | "overwrite") => Promise<void>;
  resetData: () => Promise<void>;
  reload: () => Promise<void>;
}

const Ctx = createContext<AppStore | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>({ ...DEFAULT_PROFILE });
  const [logs, setLogs] = useState<Record<string, DayLog>>({});
  const [foodLibrary, setFoodLibrary] = useState<FoodItem[]>(DEFAULT_FOOD_LIBRARY);
  const [mealTemplates, setMealTemplates] = useState<MealTemplate[]>([BREAKFAST_TEMPLATE]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      await seedIfEmpty();
      const [p, allLogs, foods, templates] = await Promise.all([
        getProfile(), getAllLogs(), getFoodLibrary(), getMealTemplates(),
      ]);
      setProfile(p);
      const logMap: Record<string, DayLog> = {};
      allLogs.forEach(l => { logMap[l.date] = l; });
      setLogs(logMap);
      setFoodLibrary(foods);
      setMealTemplates(templates);
    } catch (e) {
      console.error("Load error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const updateProfile = async (p: Partial<UserProfile>) => {
    const updated = { ...profile, ...p };
    await saveProfile(updated);
    setProfile(updated);
  };

  const ensureLog = (d: string): DayLog => {
    const existing = logs[d];
    return {
      date: d,
      meals: existing?.meals ?? [],
      trainings: existing?.trainings ?? [],
      metrics: existing?.metrics ?? {},
      dayTypeOverride: existing?.dayTypeOverride,
      notes: existing?.notes,
    };
  };

  const updateLog = async (log: DayLog) => {
    await saveDayLog(log);
    setLogs(prev => ({ ...prev, [log.date]: log }));
  };

  const getLog = (date: string) => logs[date];

  const addMeal = async (date: string, meal: Omit<MealEntry, "id">) => {
    const log = ensureLog(date);
    log.meals = [...log.meals, { ...meal, id: uuidv4() }];
    await updateLog(log);
  };

  const updateMeal = async (date: string, meal: MealEntry) => {
    const log = ensureLog(date);
    log.meals = log.meals.map(m => m.id === meal.id ? meal : m);
    await updateLog(log);
  };

  const deleteMeal = async (date: string, mealId: string) => {
    const log = ensureLog(date);
    log.meals = log.meals.filter(m => m.id !== mealId);
    await updateLog(log);
  };

  const addTraining = async (date: string, training: Omit<TrainingEntry, "id">) => {
    const log = ensureLog(date);
    log.trainings = [...log.trainings, { ...training, id: uuidv4() }];
    await updateLog(log);
  };

  const updateTraining = async (date: string, training: TrainingEntry) => {
    const log = ensureLog(date);
    log.trainings = log.trainings.map(t => t.id === training.id ? training : t);
    await updateLog(log);
  };

  const deleteTraining = async (date: string, trainingId: string) => {
    const log = ensureLog(date);
    log.trainings = log.trainings.filter(t => t.id !== trainingId);
    await updateLog(log);
  };

  const updateMetrics = async (date: string, metrics: Partial<DayLog["metrics"]>) => {
    const log = ensureLog(date);
    log.metrics = { ...log.metrics, ...metrics };
    await updateLog(log);
  };

  const updateDayNote = async (date: string, note: string) => {
    const log = ensureLog(date);
    log.notes = note;
    await updateLog(log);
  };

  const setDayTypeOverride = async (date: string, type: DayLog["dayTypeOverride"]) => {
    const log = ensureLog(date);
    log.dayTypeOverride = type;
    await updateLog(log);
  };

  const addFoodItem = async (item: Omit<FoodItem, "id">) => {
    const newItem = { ...item, id: uuidv4() };
    await saveFoodItem(newItem);
    setFoodLibrary(prev => [...prev, newItem]);
  };

  const updateFoodItem = async (item: FoodItem) => {
    await saveFoodItem(item);
    setFoodLibrary(prev => prev.map(f => f.id === item.id ? item : f));
  };

  const removeFoodItem = async (id: string) => {
    await deleteFoodItem(id);
    setFoodLibrary(prev => prev.filter(f => f.id !== id));
  };

  const addMealTemplate = async (template: Omit<MealTemplate, "id">) => {
    const newTmpl = { ...template, id: uuidv4() };
    await saveMealTemplate(newTmpl);
    setMealTemplates(prev => [...prev, newTmpl]);
  };

  const removeMealTemplate = async (id: string) => {
    await deleteMealTemplate(id);
    setMealTemplates(prev => prev.filter(t => t.id !== id));
  };

  const exportJSON = async () => {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cut-tracker-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = async () => {
    const allLogs = await getAllLogs();
    const rows = ["Date,DayType,Calories,Protein,Carbs,Fat,Steps,Water,Sleep,Weight,Deficit"];
    for (const log of allLogs.sort((a, b) => a.date.localeCompare(b.date))) {
      const cal = log.meals.reduce((s, m) => s + m.calories, 0);
      const prot = log.meals.reduce((s, m) => s + (m.protein ?? 0), 0);
      const carbs = log.meals.reduce((s, m) => s + (m.carbs ?? 0), 0);
      const fat = log.meals.reduce((s, m) => s + (m.fat ?? 0), 0);
      const p = profile;
      const targetMap: Record<string, number> = { hybrid: p.calorieTargets.hybrid, pilates: p.calorieTargets.pilates, run: p.calorieTargets.run, rest: p.calorieTargets.rest };
      const dt = log.dayTypeOverride ?? "rest";
      const deficit = (targetMap[dt] ?? p.calorieTargets.rest) - cal;
      rows.push(`${log.date},${dt},${cal},${prot.toFixed(1)},${carbs.toFixed(1)},${fat.toFixed(1)},${log.metrics.steps ?? ""},${log.metrics.waterLiters ?? ""},${log.metrics.sleepHours ?? ""},${log.metrics.weightKg ?? ""},${deficit}`);
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cut-tracker-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = async (data: AppData, mode: "merge" | "overwrite") => {
    await importData(data, mode);
    await reload();
  };

  const resetData = async () => {
    await resetAllData();
    await reload();
  };

  return (
    <Ctx.Provider value={{
      profile, logs, foodLibrary, mealTemplates, loading,
      updateProfile, getLog,
      addMeal, updateMeal, deleteMeal,
      addTraining, updateTraining, deleteTraining,
      updateMetrics, updateDayNote, setDayTypeOverride,
      addFoodItem, updateFoodItem, removeFoodItem,
      addMealTemplate, removeMealTemplate,
      exportJSON, exportCSV, importJSON, resetData, reload,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppStore must be inside AppProvider");
  return ctx;
}
