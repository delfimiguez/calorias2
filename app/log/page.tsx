"use client";

import { useState } from "react";
import { format, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Utensils, Dumbbell, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/lib/store";
import {
  getEffectiveDayType, getCalorieTarget, getTotalMealCalories,
  getTotalProtein, getDeficitVsBurn, getDailyBurn, getEffectiveBMR,
  getExerciseBurn, getExtraBurn,
} from "@/lib/calculations";
import { MealDialog } from "@/components/dialogs/MealDialog";
import { TrainingDialog } from "@/components/dialogs/TrainingDialog";
import { MetricsDialog } from "@/components/dialogs/MetricsDialog";
import { ExtraBurnDialog } from "@/components/dialogs/ExtraBurnDialog";
import type { DayType } from "@/lib/types";

const DAY_TYPE_LABELS: Record<string, string> = {
  hybrid: "Hybrid",
  pilates: "Pilates",
  run: "Run Z2",
  rest: "Rest Day",
};

export default function LogPage() {
  const { profile, logs, deleteMeal, deleteTraining, setDayTypeOverride } = useAppStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mealOpen, setMealOpen] = useState(false);
  const [trainingOpen, setTrainingOpen] = useState(false);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [burnOpen, setBurnOpen] = useState(false);

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const log = logs[dateStr];
  const dayType = getEffectiveDayType(profile, log, selectedDate);
  const targetIntake = getCalorieTarget(profile, dayType);
  const eaten = getTotalMealCalories(log);
  const protein = getTotalProtein(log);
  const bmr = getEffectiveBMR(profile);
  const exerciseBurn = getExerciseBurn(log);
  const extraBurn = getExtraBurn(log);
  const totalBurn = getDailyBurn(profile, log);
  const deficit = getDeficitVsBurn(profile, log);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
      {/* Header with date nav */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Log</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedDate(d => subDays(d, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[130px] text-center">
            {format(selectedDate, "EEE, MMM d")}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedDate(d => addDays(d, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedDate(new Date())}>Today</Button>
        </div>
      </div>

      {/* Day summary bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {/* Row 1: day type + intake */}
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Day type</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{DAY_TYPE_LABELS[dayType]}</Badge>
                <Select
                  value={log?.dayTypeOverride ?? "auto"}
                  onValueChange={(v) => setDayTypeOverride(dateStr, v === "auto" ? undefined : v as DayType)}
                >
                  <SelectTrigger className="h-7 text-xs w-28">
                    <SelectValue placeholder="Override" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="pilates">Pilates</SelectItem>
                    <SelectItem value="run">Run Z2</SelectItem>
                    <SelectItem value="rest">Rest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <StatItem label="Target intake" value={`${targetIntake} kcal`} />
            <StatItem label="Eaten" value={`${eaten} kcal`} />
            <StatItem label="Protein" value={`${protein.toFixed(0)}g / ${profile.proteinTarget}g`} />
          </div>

          {/* Row 2: burn breakdown */}
          <div className="pt-2 border-t flex flex-wrap gap-4 items-center">
            <StatItem label="Basal (BMR)" value={`${bmr} kcal`} />
            <StatItem label="Exercise burn" value={`${exerciseBurn} kcal`} color={exerciseBurn > 0 ? "text-emerald-600" : undefined} />
            <StatItem label="Extra burn" value={`${extraBurn} kcal`} color={extraBurn > 0 ? "text-emerald-600" : undefined} />
            <StatItem label="Total burn" value={`${totalBurn} kcal`} />
            <StatItem
              label="Deficit vs burn"
              value={`${deficit > 0 ? "−" : "+"}${Math.abs(deficit)} kcal`}
              color={deficit > 0 ? "text-emerald-600" : "text-destructive"}
            />
            <Button size="sm" variant="outline" className="h-7 ml-auto" onClick={() => setBurnOpen(true)}>
              <Flame className="h-3.5 w-3.5 mr-1" /> Extra burn
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Meals */}
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="text-base">Meals</CardTitle>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setMealOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add
          </Button>
        </CardHeader>
        <CardContent>
          {!log?.meals?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Utensils className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No meals logged</p>
            </div>
          ) : (
            <div className="divide-y">
              {log.meals.map(meal => (
                <div key={meal.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">{meal.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {meal.time}
                      {meal.protein !== undefined && ` · ${meal.protein.toFixed(0)}g P`}
                      {meal.carbs !== undefined && ` · ${meal.carbs.toFixed(0)}g C`}
                      {meal.fat !== undefined && ` · ${meal.fat.toFixed(0)}g F`}
                      {` · ${meal.calories} kcal`}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <span className="text-muted-foreground">⋯</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteMeal(dateStr, meal.id)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training */}
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="text-base">Training</CardTitle>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setTrainingOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add
          </Button>
        </CardHeader>
        <CardContent>
          {!log?.trainings?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No training logged</p>
            </div>
          ) : (
            <div className="divide-y">
              {log.trainings.map(t => (
                <div key={t.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium capitalize">{t.type === "run" ? "Run Z2" : t.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.durationMin} min
                      {t.distanceKm && ` · ${t.distanceKm} km`}
                      {t.rpe && ` · RPE ${t.rpe}`}
                      {t.caloriesBurned ? ` · 🔥 ${t.caloriesBurned} kcal burned` : ""}
                      {t.notes && ` · ${t.notes}`}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <span className="text-muted-foreground">⋯</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteTraining(dateStr, t.id)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metrics */}
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="text-base">Metrics</CardTitle>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setMetricsOpen(true)}>
            {log?.metrics && Object.keys(log.metrics).length > 0 ? "Edit" : <><Plus className="h-3.5 w-3.5 mr-1" /> Add</>}
          </Button>
        </CardHeader>
        <CardContent>
          {!log?.metrics || Object.keys(log.metrics).filter(k => k !== "extraBurn").length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No metrics logged</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {log.metrics.weightKg && <MetricChip label="Weight" value={`${log.metrics.weightKg} kg`} />}
              {log.metrics.steps && <MetricChip label="Steps" value={log.metrics.steps.toLocaleString()} />}
              {log.metrics.waterLiters && <MetricChip label="Water" value={`${log.metrics.waterLiters} L`} />}
              {log.metrics.sleepHours && <MetricChip label="Sleep" value={`${log.metrics.sleepHours} hrs`} />}
            </div>
          )}
        </CardContent>
      </Card>

      <MealDialog open={mealOpen} onOpenChange={setMealOpen} date={selectedDate} />
      <TrainingDialog open={trainingOpen} onOpenChange={setTrainingOpen} date={selectedDate} />
      <MetricsDialog open={metricsOpen} onOpenChange={setMetricsOpen} date={selectedDate} />
      <ExtraBurnDialog open={burnOpen} onOpenChange={setBurnOpen} date={selectedDate} />
    </div>
  );
}

function StatItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${color ?? ""}`}>{value}</p>
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}
