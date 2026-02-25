import type { DayLog, DayType, UserProfile } from "./types";
import { format, parseISO, differenceInDays, addDays } from "date-fns";

// ─── BMR ────────────────────────────────────────────────────────────────────

/** Mifflin-St Jeor for women: 10*w + 6.25*h - 5*a - 161 */
export function computeBMR(profile: UserProfile): number {
  return Math.round(10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age - 161);
}

/** Effective BMR: user override takes precedence, else Mifflin-St Jeor */
export function getEffectiveBMR(profile: UserProfile): number {
  return profile.bmrOverride ?? computeBMR(profile);
}

// ─── Burn breakdown for a day ───────────────────────────────────────────────

export function getExerciseBurn(log: DayLog | undefined): number {
  if (!log) return 0;
  return log.trainings.reduce((sum, t) => sum + (t.caloriesBurned ?? 0), 0);
}

export function getExtraBurn(log: DayLog | undefined): number {
  return log?.metrics?.extraBurn ?? 0;
}

export function getDailyBurn(profile: UserProfile, log: DayLog | undefined): number {
  return getEffectiveBMR(profile) + getExerciseBurn(log) + getExtraBurn(log);
}

// ─── Day type ────────────────────────────────────────────────────────────────

export function getScheduledDayType(profile: UserProfile, date: Date): DayType {
  const dayMap: Record<number, keyof UserProfile["weeklySchedule"]> = {
    0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat",
  };
  return profile.weeklySchedule[dayMap[date.getDay()]];
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

// ─── Intake totals ───────────────────────────────────────────────────────────

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

// ─── Deficit (new model: burn-based) ─────────────────────────────────────────

/**
 * deficitVsBurn = dailyBurn - caloriesEaten
 * Positive = deficit (ate less than burned). Negative = surplus.
 */
export function getDeficitVsBurn(profile: UserProfile, log: DayLog | undefined): number {
  return getDailyBurn(profile, log) - getTotalMealCalories(log);
}

/**
 * Accumulated deficit over a date range.
 * Only counts days where at least one meal was logged.
 */
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
    if (getTotalMealCalories(log) > 0) {
      total += getDeficitVsBurn(profile, log);
    }
    current = addDays(current, 1);
  }
  return total;
}

export function getEstimatedFatLoss(accumulatedDeficitKcal: number): number {
  return accumulatedDeficitKcal / 7700;
}

// ─── Rolling averages ────────────────────────────────────────────────────────

export function getRolling7DayAvg(
  profile: UserProfile,
  logs: Record<string, DayLog>,
  toDate: Date
): { avgCalories: number; avgProtein: number; avgDeficit: number; avgBurn: number; daysLogged: number } {
  let totalCal = 0, totalProt = 0, totalDef = 0, totalBurn = 0, days = 0;
  for (let i = 6; i >= 0; i--) {
    const d = addDays(toDate, -i);
    const dateStr = format(d, "yyyy-MM-dd");
    const log = logs[dateStr];
    if (log && getTotalMealCalories(log) > 0) {
      totalCal += getTotalMealCalories(log);
      totalProt += getTotalProtein(log);
      totalDef += getDeficitVsBurn(profile, log);
      totalBurn += getDailyBurn(profile, log);
      days++;
    }
  }
  if (days === 0) return { avgCalories: 0, avgProtein: 0, avgDeficit: 0, avgBurn: 0, daysLogged: 0 };
  return {
    avgCalories: Math.round(totalCal / days),
    avgProtein: Math.round(totalProt / days),
    avgDeficit: Math.round(totalDef / days),
    avgBurn: Math.round(totalBurn / days),
    daysLogged: days,
  };
}

// ─── Projection ──────────────────────────────────────────────────────────────

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

// ─── Chart helpers ───────────────────────────────────────────────────────────

export function get30DayCaloriesAndTarget(
  profile: UserProfile,
  logs: Record<string, DayLog>,
  today: Date
): Array<{ date: string; calories: number; target: number; burn: number }> {
  return Array.from({ length: 30 }, (_, i) => {
    const d = addDays(today, -(29 - i));
    const dateStr = format(d, "yyyy-MM-dd");
    const log = logs[dateStr];
    const dayType = getEffectiveDayType(profile, log, d);
    return {
      date: format(d, "MMM d"),
      calories: getTotalMealCalories(log),
      target: getCalorieTarget(profile, dayType),
      burn: getDailyBurn(profile, log),
    };
  });
}

export function getWeightTrend(
  logs: Record<string, DayLog>,
  today: Date,
  days = 30
): Array<{ date: string; weight: number | null }> {
  return Array.from({ length: days }, (_, i) => {
    const d = addDays(today, -(days - 1 - i));
    const dateStr = format(d, "yyyy-MM-dd");
    const log = logs[dateStr];
    return { date: format(d, "MMM d"), weight: log?.metrics?.weightKg ?? null };
  });
}
