export type DayType = "hybrid" | "pilates" | "run" | "rest";

export interface UserProfile {
  name: string;
  age: number;
  heightCm: number;
  weightKg: number;
  planStartDate: string;
  goalDate: string;
  goalLoseKg: number;
  proteinTarget: number;
  calorieTargets: {
    hybrid: number;
    pilates: number;
    run: number;
    rest: number;
  };
  weeklySchedule: {
    mon: DayType;
    tue: DayType;
    wed: DayType;
    thu: DayType;
    fri: DayType;
    sat: DayType;
    sun: DayType;
  };
  useFixedBreakfast: boolean;
  countExerciseCalories: boolean;
  /** BMR override in kcal/day. If undefined, computed from Mifflin-St Jeor. */
  bmrOverride?: number;
}

export interface MealEntry {
  id: string;
  time: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  templateId?: string;
}

export interface TrainingEntry {
  id: string;
  type: "hybrid" | "pilates" | "run" | "walk" | "other";
  durationMin: number;
  distanceKm?: number;
  rpe?: number;
  notes?: string;
  caloriesBurned?: number;
}

export interface DayMetrics {
  steps?: number;
  waterLiters?: number;
  sleepHours?: number;
  weightKg?: number;
  /** Extra calories burned today not from logged trainings (e.g. from watch summary) */
  extraBurn?: number;
}

export interface DayLog {
  date: string;
  dayTypeOverride?: DayType;
  meals: MealEntry[];
  trainings: TrainingEntry[];
  metrics: DayMetrics;
  notes?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  servingGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealTemplateItem {
  foodItemId: string;
  servingMultiplier: number;
  customName?: string;
}

export interface MealTemplate {
  id: string;
  name: string;
  items: MealTemplateItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface AppData {
  profile: UserProfile;
  logs: Record<string, DayLog>;
  foodLibrary: FoodItem[];
  mealTemplates: MealTemplate[];
}
