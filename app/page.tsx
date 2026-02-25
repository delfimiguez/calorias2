"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Plus, Utensils, Dumbbell, Activity, Scale, TrendingDown, Target, Flame, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/lib/store";
import {
  getEffectiveDayType, getCalorieTarget,
  getTotalMealCalories, getTotalProtein, getTotalCarbs, getTotalFat,
  getDailyBurn, getExerciseBurn, getExtraBurn, getDeficitVsBurn,
  getEffectiveBMR, computeBMR,
  getAccumulatedDeficit, getEstimatedFatLoss, getProjection, getRolling7DayAvg,
} from "@/lib/calculations";
import { MealDialog } from "@/components/dialogs/MealDialog";
import { TrainingDialog } from "@/components/dialogs/TrainingDialog";
import { MetricsDialog } from "@/components/dialogs/MetricsDialog";
import { ExtraBurnDialog } from "@/components/dialogs/ExtraBurnDialog";
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
  const [burnOpen, setBurnOpen] = useState(false);

  // Intake target (plan adherence)
  const dayType = getEffectiveDayType(profile, log, today);
  const targetIntake = getCalorieTarget(profile, dayType);
  const eaten = getTotalMealCalories(log);
  const remainingIntake = targetIntake - eaten;

  // Burn model
  const bmr = getEffectiveBMR(profile);
  const computedBMR = computeBMR(profile);
  const exerciseBurn = getExerciseBurn(log);
  const extraBurn = getExtraBurn(log);
  const totalBurn = getDailyBurn(profile, log);
  const deficitVsBurn = getDeficitVsBurn(profile, log);

  // Macros
  const protein = getTotalProtein(log);
  const carbs = getTotalCarbs(log);
  const fat = getTotalFat(log);
  const carbTarget = Math.round((targetIntake * 0.4) / 4);
  const fatTarget = Math.round((targetIntake * 0.25) / 9);

  // Accumulated / projection
  const startDate = parseISO(profile.planStartDate);
  const accDef = getAccumulatedDeficit(profile, logs, startDate, today);
  const fatLoss = getEstimatedFatLoss(accDef);
  const projection = getProjection(profile, logs, today);
  const rolling = getRolling7DayAvg(profile, logs, today);

  const calPct = Math.min(100, Math.round((eaten / targetIntake) * 100));
  const protPct = Math.min(100, Math.round((protein / profile.proteinTarget) * 100));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground text-sm animate-pulse">Loading…</div>
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

      {/* Hero — two panels side by side */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Panel A: Target intake adherence */}
        <Card>
          <CardContent className="p-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Target intake</p>
            <p className={`text-5xl font-semibold tracking-tight mt-1 ${remainingIntake < 0 ? "text-destructive" : ""}`}>
              {remainingIntake}
            </p>
            <p className="text-sm text-muted-foreground mt-1">kcal remaining · target {targetIntake}</p>
            <Progress value={calPct} className="h-2 mt-3" />
            <p className="text-xs text-muted-foreground mt-1.5">{eaten} eaten / {targetIntake} target</p>
          </CardContent>
        </Card>

        {/* Panel B: Burn model */}
        <Card>
          <CardContent className="p-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Deficit vs burn</p>
            <p className={`text-5xl font-semibold tracking-tight mt-1 ${deficitVsBurn < 0 ? "text-destructive" : "text-emerald-600"}`}>
              {deficitVsBurn > 0 ? `−${deficitVsBurn}` : `+${Math.abs(deficitVsBurn)}`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">kcal {deficitVsBurn >= 0 ? "deficit" : "surplus"}</p>
            <Separator className="my-3" />
            <div className="grid grid-cols-3 gap-2 text-center">
              <BurnBreakdownItem label="Basal (BMR)" value={bmr} />
              <BurnBreakdownItem label="Exercise" value={exerciseBurn} highlight={exerciseBurn > 0} />
              <BurnBreakdownItem label="Extra" value={extraBurn} highlight={extraBurn > 0} />
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Total burn: <span className="font-semibold text-foreground">{totalBurn} kcal</span>
            </p>
          </CardContent>
        </Card>
      </div>

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
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: "Meal", icon: Utensils, action: () => setMealOpen(true) },
          { label: "Training", icon: Dumbbell, action: () => setTrainingOpen(true) },
          { label: "+ Burn", icon: Flame, action: () => setBurnOpen(true) },
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
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteMeal(todayStr, meal.id)}>Delete</DropdownMenuItem>
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
                        {t.durationMin} min
                        {t.distanceKm ? ` · ${t.distanceKm} km` : ""}
                        {t.rpe ? ` · RPE ${t.rpe}` : ""}
                        {t.caloriesBurned ? ` · 🔥 ${t.caloriesBurned} kcal` : ""}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 ml-2 flex-shrink-0">
                          <span className="text-muted-foreground text-lg leading-none">⋯</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteTraining(todayStr, t.id)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
                {extraBurn > 0 && (
                  <div className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">Extra burn (watch/other)</p>
                      <p className="text-xs text-muted-foreground">🔥 {extraBurn} kcal</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setBurnOpen(true)}>Edit</Button>
                  </div>
                )}
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
          value={`${Math.round(accDef).toLocaleString()} kcal`}
          sub={`Est. fat loss: ${fatLoss.toFixed(2)} kg (estimate)`}
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
          icon={Zap}
          label="7-day avg deficit"
          value={`${rolling.avgDeficit} kcal/day`}
          sub={`Avg intake: ${rolling.avgCalories} · Avg burn: ${rolling.avgBurn}`}
          color="text-blue-600"
        />
      </div>

      {/* Metrics strip */}
      {log?.metrics && (Object.keys(log.metrics).filter(k => k !== "extraBurn")).length > 0 && (
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
      <ExtraBurnDialog open={burnOpen} onOpenChange={setBurnOpen} date={today} />
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function BurnBreakdownItem({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${highlight ? "text-emerald-600" : ""}`}>{value}</p>
    </div>
  );
}

function MacroBar({ label, value, target, unit, color }: {
  label: string; value: number; target: number; unit: string; color: string;
}) {
  const pct = Math.min(100, Math.round((value / Math.max(target, 1)) * 100));
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
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
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
