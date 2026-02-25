import type { DayLog, DayType, UserProfile } from "./types";
import { format, parseISO, differenceInDays, isWithinInterval, addDays } from "date-fns";

export function getScheduledDayType(profile: UserProfile, date: Date): DayType {
  const dayMap: Record<number, keyof UserProfile["weeklySchedule"]> = {
    0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat",
  };
  const key = dayMap[date.getDay()];
  return profile.weeklySchedule[key];
}

export function getEffectiveDayType(profile: UserProfile, log: DayLog | undefined, date: Date): DayType {
  if (log?.dayTypeOverride) return log.dayTypeOverride;
  if (log?.trainings && log.trainings.length > 0) {
    const types = log.trainings.map(t => t.type);
    if (types.includes("hybrid")) return "hybrid";
    if (types.includes("pilates") || types.includes("run")) return types.includes("pilates") ? "pilates" : "run";
  }
  return getScheduledDayType(profile, date);
}

export function getCalorieTarget(profile: UserProfile, dayType: DayType): number {
  return profile.calorieTargets[dayType] ?? profile.calorieTargets.rest;
}

export function getTotalMealCalories(log: DayLog | undefined): number {
  if (!log) return 0;
  return log.meals.reduce((sum, m) => sum + m.calories, 0);
}

export function getTotalProtein(log: DayLog | undefined): number {
  if (!log) return 0;
  return log.meals.reduce((sum, m) => sum + (m.protein ?? 0), 0);
}

export function getTotalCarbs(log: DayLog | undefined): number {
  if (!log) return 0;
  return log.meals.reduce((sum, m) => sum + (m.carbs ?? 0), 0);
}

export function getTotalFat(log: DayLog | undefined): number {
  if (!log) return 0;
  return log.meals.reduce((sum, m) => sum + (m.fat ?? 0), 0);
}

export function getDailyDeficit(
  profile: UserProfile,
  log: DayLog | undefined,
  date: Date
): number {
  const target = getCalorieTarget(profile, getEffectiveDayType(profile, log, date));
  const eaten = getTotalMealCalories(log);
  return target - eaten; // positive = under target (deficit)
}

export function getAccumulatedDeficit(
  profile: UserProfile,
  logs: Record<string, DayLog>,
  fromDate: Date,
  toDate: Date
): number {
  let total = 0;
  let current = new Date(fromDate);
  while (current <= toDate) {
    const dateStr = format(current, "yyyy-MM-dd");
    const log = logs[dateStr];
    const eaten = getTotalMealCalories(log);
    if (eaten > 0) {
      total += getDailyDeficit(profile, log, current);
    }
    current = addDays(current, 1);
  }
  return total;
}

export function getEstimatedFatLoss(accumulatedDeficitKcal: number): number {
  return accumulatedDeficitKcal / 7700;
}

export function getRolling7DayAvg(
  profile: UserProfile,
  logs: Record<string, DayLog>,
  toDate: Date
): { avgCalories: number; avgProtein: number; avgDeficit: number; daysLogged: number } {
  let totalCal = 0, totalProt = 0, totalDef = 0, days = 0;
  for (let i = 6; i >= 0; i--) {
    const d = addDays(toDate, -i);
    const dateStr = format(d, "yyyy-MM-dd");
    const log = logs[dateStr];
    if (log && getTotalMealCalories(log) > 0) {
      totalCal += getTotalMealCalories(log);
      totalProt += getTotalProtein(log);
      totalDef += getDailyDeficit(profile, log, d);
      days++;
    }
  }
  if (days === 0) return { avgCalories: 0, avgProtein: 0, avgDeficit: 0, daysLogged: 0 };
  return {
    avgCalories: Math.round(totalCal / days),
    avgProtein: Math.round(totalProt / days),
    avgDeficit: Math.round(totalDef / days),
    daysLogged: days,
  };
}

export function getProjection(
  profile: UserProfile,
  logs: Record<string, DayLog>,
  today: Date
): {
  daysRemaining: number;
  accumulatedDeficit: number;
  estimatedFatLoss: number;
  projectedTotalLoss: number;
  onTrack: boolean;
} {
  const goalDate = parseISO(profile.goalDate);
  const startDate = parseISO(profile.planStartDate);
  const daysRemaining = Math.max(0, differenceInDays(goalDate, today));
  const accumulatedDeficit = getAccumulatedDeficit(profile, logs, startDate, today);
  const estimatedFatLoss = getEstimatedFatLoss(accumulatedDeficit);

  const { avgDeficit } = getRolling7DayAvg(profile, logs, today);
  const projectedAdditional = (avgDeficit > 0 ? avgDeficit : 200) * daysRemaining;
  const projectedTotalLoss = getEstimatedFatLoss(accumulatedDeficit + projectedAdditional);

  return {
    daysRemaining,
    accumulatedDeficit,
    estimatedFatLoss,
    projectedTotalLoss,
    onTrack: projectedTotalLoss >= profile.goalLoseKg * 0.8,
  };
}

export function get14DayCaloriesAndTarget(
  profile: UserProfile,
  logs: Record<string, DayLog>,
  today: Date
): Array<{ date: string; calories: number; target: number }> {
  const result = [];
  for (let i = 13; i >= 0; i--) {
    const d = addDays(today, -i);
    const dateStr = format(d, "yyyy-MM-dd");
    const log = logs[dateStr];
    const dayType = getEffectiveDayType(profile, log, d);
    result.push({
      date: format(d, "MMM d"),
      calories: getTotalMealCalories(log),
      target: getCalorieTarget(profile, dayType),
    });
  }
  return result;
}

export function getWeightTrend(
  logs: Record<string, DayLog>,
  today: Date,
  days = 30
): Array<{ date: string; weight: number | null }> {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    const dateStr = format(d, "yyyy-MM-dd");
    const log = logs[dateStr];
    result.push({
      date: format(d, "MMM d"),
      weight: log?.metrics?.weightKg ?? null,
    });
  }
  return result;
}
