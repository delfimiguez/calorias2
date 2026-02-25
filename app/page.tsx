"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Plus, Utensils, Dumbbell, Activity, Scale, CheckCircle2, Circle, TrendingDown, Target, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/lib/store";
import {
  getEffectiveDayType, getCalorieTarget, getTotalMealCalories, getTotalProtein,
  getTotalCarbs, getTotalFat, getDailyDeficit, getAccumulatedDeficit,
  getEstimatedFatLoss, getProjection, getRolling7DayAvg,
} from "@/lib/calculations";
import { MealDialog } from "@/components/dialogs/MealDialog";
import { TrainingDialog } from "@/components/dialogs/TrainingDialog";
import { MetricsDialog } from "@/components/dialogs/MetricsDialog";
import { parseISO } from "date-fns";

const DAY_TYPE_LABELS: Record<string, string> = {
  hybrid: "Hybrid",
  pilates: "Pilates",
  run: "Run Z2",
  rest: "Rest",
};

const TRAINING_TYPE_LABELS: Record<string, string> = {
  hybrid: "Hybrid (La Huella)",
  pilates: "Pilates",
  run: "Run Z2",
  walk: "Walk",
  other: "Other",
};

export default function TodayPage() {
  const { profile, logs, deleteMeal, deleteTraining, loading } = useAppStore();
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const log = logs[todayStr];

  const [mealOpen, setMealOpen] = useState(false);
  const [trainingOpen, setTrainingOpen] = useState(false);
  const [metricsOpen, setMetricsOpen] = useState(false);

  const dayType = getEffectiveDayType(profile, log, today);
  const target = getCalorieTarget(profile, dayType);
  const eaten = getTotalMealCalories(log);
  const remaining = target - eaten;
  const protein = getTotalProtein(log);
  const carbs = getTotalCarbs(log);
  const fat = getTotalFat(log);

  const startDate = parseISO(profile.planStartDate);
  const accDef = getAccumulatedDeficit(profile, logs, startDate, today);
  const fatLoss = getEstimatedFatLoss(accDef);
  const projection = getProjection(profile, logs, today);
  const rolling = getRolling7DayAvg(profile, logs, today);

  const calPct = Math.min(100, Math.round((eaten / target) * 100));
  const protPct = Math.min(100, Math.round((protein / profile.proteinTarget) * 100));
  const carbTarget = Math.round((target * 0.4) / 4);
  const fatTarget = Math.round((target * 0.25) / 9);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Good {getGreeting()}, {profile.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(today, "EEEE, MMMM d")} ·{" "}
            <Badge variant="secondary" className="text-xs">{DAY_TYPE_LABELS[dayType]}</Badge>
          </p>
        </div>
      </div>

      {/* Hero - Calories Remaining */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Calories remaining</p>
              <p className={`text-5xl font-semibold tracking-tight mt-1 ${remaining < 0 ? "text-destructive" : ""}`}>
                {remaining}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{eaten} eaten / {target} target</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Today's deficit</p>
              <p className={`text-2xl font-semibold ${remaining > 0 ? "text-emerald-600" : "text-destructive"}`}>
                {remaining > 0 ? `−${remaining}` : `+${Math.abs(remaining)}`}
              </p>
            </div>
          </div>
          <Progress value={calPct} className="h-2.5" />
          <p className="text-xs text-muted-foreground mt-2">{calPct}% of daily target</p>
        </CardContent>
      </Card>

      {/* Macro bars */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Macros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <MacroBar label="Protein" value={protein} target={profile.proteinTarget} unit="g" color="bg-blue-500" />
          <MacroBar label="Carbs" value={carbs} target={carbTarget} unit="g" color="bg-amber-500" />
          <MacroBar label="Fat" value={fat} target={fatTarget} unit="g" color="bg-rose-400" />
        </CardContent>
      </Card>

      {/* Quick Add */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Meal", icon: Utensils, action: () => setMealOpen(true) },
          { label: "Training", icon: Dumbbell, action: () => setTrainingOpen(true) },
          { label: "Metrics", icon: Scale, action: () => setMetricsOpen(true) },
          { label: "Steps", icon: Activity, action: () => setMetricsOpen(true) },
        ].map(({ label, icon: Icon, action }) => (
          <Button key={label} variant="outline" size="sm" className="flex flex-col h-16 gap-1" onClick={action}>
            <Icon className="h-4 w-4" />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Meals today */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-base">Meals today</CardTitle>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setMealOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </CardHeader>
          <CardContent>
            {!log?.meals?.length ? (
              <EmptyState icon={Utensils} label="No meals logged yet" />
            ) : (
              <div className="space-y-1">
                {log.meals.map(meal => (
                  <div key={meal.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{meal.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {meal.time} · {meal.protein ? `${meal.protein.toFixed(0)}g P · ` : ""}{meal.calories} kcal
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 ml-2 flex-shrink-0">
                          <span className="text-muted-foreground text-lg leading-none">⋯</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteMeal(todayStr, meal.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Training today */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-base">Training today</CardTitle>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setTrainingOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </CardHeader>
          <CardContent>
            {!log?.trainings?.length ? (
              <EmptyState icon={Dumbbell} label="No training logged yet" />
            ) : (
              <div className="space-y-1">
                {log.trainings.map(t => (
                  <div key={t.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{TRAINING_TYPE_LABELS[t.type]}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.durationMin} min{t.distanceKm ? ` · ${t.distanceKm} km` : ""}{t.rpe ? ` · RPE ${t.rpe}` : ""}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 ml-2 flex-shrink-0">
                          <span className="text-muted-foreground text-lg leading-none">⋯</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteTraining(todayStr, t.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Deficit cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={TrendingDown}
          label="Accumulated deficit"
          value={`${Math.round(accDef)} kcal`}
          sub={`Est. fat loss: ${fatLoss.toFixed(2)} kg`}
          color="text-emerald-600"
        />
        <StatCard
          icon={Target}
          label="Projected by goal date"
          value={`${projection.projectedTotalLoss.toFixed(2)} kg`}
          sub={`Goal: ${profile.goalLoseKg} kg · ${projection.daysRemaining}d remaining`}
          color={projection.onTrack ? "text-emerald-600" : "text-amber-600"}
        />
        <StatCard
          icon={Flame}
          label="7-day avg deficit"
          value={`${rolling.avgDeficit} kcal/day`}
          sub={`Avg calories: ${rolling.avgCalories} kcal`}
          color="text-blue-600"
        />
      </div>

      {/* Metrics */}
      {log?.metrics && Object.keys(log.metrics).length > 0 && (
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-base">Today's metrics</CardTitle>
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setMetricsOpen(true)}>Edit</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {log.metrics.weightKg && <MetricChip label="Weight" value={`${log.metrics.weightKg} kg`} />}
              {log.metrics.steps && <MetricChip label="Steps" value={log.metrics.steps.toLocaleString()} />}
              {log.metrics.waterLiters && <MetricChip label="Water" value={`${log.metrics.waterLiters} L`} />}
              {log.metrics.sleepHours && <MetricChip label="Sleep" value={`${log.metrics.sleepHours} hrs`} />}
            </div>
          </CardContent>
        </Card>
      )}

      <MealDialog open={mealOpen} onOpenChange={setMealOpen} date={today} />
      <TrainingDialog open={trainingOpen} onOpenChange={setTrainingOpen} date={today} />
      <MetricsDialog open={metricsOpen} onOpenChange={setMetricsOpen} date={today} />
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function MacroBar({ label, value, target, unit, color }: {
  label: string; value: number; target: number; unit: string; color: string;
}) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  const remaining = Math.max(0, target - value);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{value.toFixed(0)}{unit}</span>
          <span className="text-xs text-muted-foreground">/ {target}{unit}</span>
          <span className="text-xs text-muted-foreground">({remaining}{unit} left)</span>
        </div>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
      <Icon className="h-8 w-8 mb-2 opacity-30" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string; sub: string; color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`h-4 w-4 ${color ?? "text-muted-foreground"}`} />
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
        </div>
        <p className={`text-2xl font-semibold tracking-tight ${color ?? ""}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
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
