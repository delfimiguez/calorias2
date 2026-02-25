import type { FoodItem, MealTemplate, UserProfile } from "./types";

export const BREAKFAST_TEMPLATE_ID = "breakfast-default";

export const DEFAULT_FOOD_LIBRARY: FoodItem[] = [
  { id: "food-chia", name: "Chia Seeds", servingGrams: 16, calories: 78, protein: 2.6, carbs: 5.4, fat: 4.9 },
  { id: "food-whey", name: "Whey Protein (1 scoop)", servingGrams: 30, calories: 120, protein: 24, carbs: 3, fat: 1.5 },
  { id: "food-skim-milk", name: "Skim Milk", servingGrams: 60, calories: 21, protein: 2.1, carbs: 2.9, fat: 0.1 },
  { id: "food-banana", name: "Banana", servingGrams: 30, calories: 27, protein: 0.4, carbs: 6.9, fat: 0.1 },
  { id: "food-blueberries", name: "Blueberries", servingGrams: 20, calories: 11, protein: 0.2, carbs: 2.8, fat: 0.1 },
  { id: "food-apple", name: "Apple", servingGrams: 40, calories: 21, protein: 0.1, carbs: 5.5, fat: 0.1 },
  { id: "food-granola", name: "Granola", servingGrams: 15, calories: 67, protein: 1.5, carbs: 10.5, fat: 2.3 },
  { id: "food-chicken-breast", name: "Chicken Breast (cooked)", servingGrams: 100, calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: "food-salmon", name: "Salmon (grilled)", servingGrams: 100, calories: 208, protein: 20, carbs: 0, fat: 13 },
  { id: "food-eggs", name: "Eggs (large)", servingGrams: 50, calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8 },
  { id: "food-greek-yogurt", name: "Greek Yogurt (0% fat)", servingGrams: 170, calories: 100, protein: 17, carbs: 6, fat: 0.7 },
  { id: "food-oats", name: "Rolled Oats (dry)", servingGrams: 40, calories: 150, protein: 5, carbs: 27, fat: 2.5 },
  { id: "food-rice", name: "White Rice (cooked)", servingGrams: 100, calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { id: "food-sweet-potato", name: "Sweet Potato (cooked)", servingGrams: 100, calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  { id: "food-broccoli", name: "Broccoli (steamed)", servingGrams: 100, calories: 35, protein: 2.4, carbs: 7, fat: 0.4 },
  { id: "food-olive-oil", name: "Olive Oil", servingGrams: 14, calories: 119, protein: 0, carbs: 0, fat: 14 },
  { id: "food-cottage-cheese", name: "Cottage Cheese (low fat)", servingGrams: 100, calories: 98, protein: 11.1, carbs: 3.4, fat: 4.3 },
  { id: "food-tuna", name: "Tuna (canned in water)", servingGrams: 85, calories: 100, protein: 22, carbs: 0, fat: 0.5 },
  { id: "food-almonds", name: "Almonds", servingGrams: 28, calories: 164, protein: 6, carbs: 6, fat: 14 },
  { id: "food-protein-bar", name: "Protein Bar (generic)", servingGrams: 60, calories: 200, protein: 20, carbs: 22, fat: 7 },
];

export const BREAKFAST_TEMPLATE: MealTemplate = {
  id: BREAKFAST_TEMPLATE_ID,
  name: "Fixed Breakfast",
  items: [
    { foodItemId: "food-chia", servingMultiplier: 1 },
    { foodItemId: "food-whey", servingMultiplier: 1 },
    { foodItemId: "food-skim-milk", servingMultiplier: 1 },
    { foodItemId: "food-banana", servingMultiplier: 1 },
    { foodItemId: "food-blueberries", servingMultiplier: 1 },
    { foodItemId: "food-apple", servingMultiplier: 1 },
    { foodItemId: "food-granola", servingMultiplier: 1 },
  ],
  totalCalories: 345,
  totalProtein: 30.9,
  totalCarbs: 37,
  totalFat: 9.1,
};

export const DEFAULT_PROFILE: UserProfile = {
  name: "Delfi",
  age: 28,
  heightCm: 169,
  weightKg: 60.0,
  planStartDate: "2026-02-25",
  goalDate: "2026-04-13",
  goalLoseKg: 2.0,
  proteinTarget: 120,
  calorieTargets: {
    hybrid: 1900,
    pilates: 1800,
    run: 1800,
    rest: 1700,
  },
  weeklySchedule: {
    mon: "hybrid",
    tue: "pilates",
    wed: "hybrid",
    thu: "rest",
    fri: "hybrid",
    sat: "rest",
    sun: "rest",
  },
  useFixedBreakfast: true,
  countExerciseCalories: false,
  // bmrOverride intentionally omitted → computed from Mifflin-St Jeor
};
