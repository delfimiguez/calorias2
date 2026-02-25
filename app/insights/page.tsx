"use client";

import { useMemo } from "react";
import { format, addDays, parseISO } from "date-fns";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import {
  getEffectiveDayType, getCalorieTarget, getTotalMealCalories,
  getTotalProtein, getAccumulatedDeficit, getEstimatedFatLoss,
  getProjection, getRolling7DayAvg,
} from "@/lib/calculations";

export default function InsightsPage() {
  const { profile, logs } = useAppStore();
  const today = new Date();
  const startDate = parseISO(profile.planStartDate);

  const calData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = addDays(today, -(29 - i));
      const dateStr = format(d, "yyyy-MM-dd");
      const log = logs[dateStr];
      const dayType = getEffectiveDayType(profile, log, d);
      return {
        date: format(d, "MMM d"),
        calories: getTotalMealCalories(log),
        target: getCalorieTarget(profile, dayType),
      };
    });
  }, [profile, logs]);

  const proteinData = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = addDays(today, -(13 - i));
      const dateStr = format(d, "yyyy-MM-dd");
      const log = logs[dateStr];
      return {
        date: format(d, "MMM d"),
        protein: getTotalProtein(log),
        target: profile.proteinTarget,
      };
    });
  }, [profile, logs]);

  const weightData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = addDays(today, -(29 - i));
      const dateStr = format(d, "yyyy-MM-dd");
      const log = logs[dateStr];
      const w = log?.metrics?.weightKg;
      return { date: format(d, "MMM d"), weight: w ?? null };
    }).filter(d => d.weight !== null);
  }, [logs]);

  const deficitData = useMemo(() => {
    let acc = 0;
    return Array.from({ length: 30 }, (_, i) => {
      const d = addDays(startDate, i);
      if (d > today) return null;
      const dateStr = format(d, "yyyy-MM-dd");
      const log = logs[dateStr];
      const eaten = getTotalMealCalories(log);
      if (eaten > 0) {
        const dayType = getEffectiveDayType(profile, log, d);
        const target = getCalorieTarget(profile, dayType);
        acc += target - eaten;
      }
      return { date: format(d, "MMM d"), deficit: acc };
    }).filter(Boolean) as { date: string; deficit: number }[];
  }, [profile, logs, startDate]);

  const rolling = getRolling7DayAvg(profile, logs, today);
  const projection = getProjection(profile, logs, today);
  const totalAcc = getAccumulatedDeficit(profile, logs, startDate, today);

  // Weekly summary
  const weekCals = calData.slice(-7);
  const avgCals = Math.round(weekCals.reduce((s, d) => s + d.calories, 0) / weekCals.filter(d => d.calories > 0).length || 0);
  const weekProts = proteinData.slice(-7);
  const avgProt = Math.round(weekProts.reduce((s, d) => s + d.protein, 0) / weekProts.filter(d => d.protein > 0).length || 0);

  const trainingSessions = useMemo(() => {
    let sessions = 0;
    let runMins = 0;
    for (let i = 6; i >= 0; i--) {
      const d = addDays(today, -i);
      const log = logs[format(d, "yyyy-MM-dd")];
      if (log?.trainings) {
        sessions += log.trainings.length;
        runMins += log.trainings.filter(t => t.type === "run").reduce((s, t) => s + t.durationMin, 0);
      }
    }
    return { sessions, runMins };
  }, [logs]);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Insights</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your progress over time</p>
      </div>

      {/* Weekly summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Avg calories" value={`${avgCals || "—"}`} sub="this week" />
        <SummaryCard label="Avg protein" value={`${avgProt || "—"}g`} sub="this week" />
        <SummaryCard label="Sessions" value={`${trainingSessions.sessions}`} sub="last 7 days" />
        <SummaryCard label="Run minutes" value={`${trainingSessions.runMins}`} sub="last 7 days" />
      </div>

      {/* Deficit summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-xs text-muted-foreground">Total accumulated deficit</p>
                <p className="text-2xl font-semibold mt-0.5">{Math.round(totalAcc).toLocaleString()} kcal</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estimated fat loss</p>
                <p className="text-2xl font-semibold mt-0.5 text-emerald-600">{getEstimatedFatLoss(totalAcc).toFixed(2)} kg</p>
                <p className="text-xs text-muted-foreground">estimate only</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Projected by goal date</p>
                <p className={`text-2xl font-semibold mt-0.5 ${projection.onTrack ? "text-emerald-600" : "text-amber-600"}`}>
                  {projection.projectedTotalLoss.toFixed(2)} kg
                </p>
                <p className="text-xs text-muted-foreground">goal: {profile.goalLoseKg} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">7-day rolling avg</p>
            <div className="mt-2 space-y-1.5">
              <MiniStat label="Calories" value={`${rolling.avgCalories} kcal`} />
              <MiniStat label="Protein" value={`${rolling.avgProtein}g`} />
              <MiniStat label="Deficit" value={`${rolling.avgDeficit} kcal`} />
              <MiniStat label="Days logged" value={`${rolling.daysLogged}/7`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calories chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Calories vs Target (30 days)</CardTitle>
          <CardDescription>Daily intake compared to target</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={calData} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="calories" name="Eaten" fill="hsl(var(--primary))" opacity={0.8} radius={[2, 2, 0, 0]} />
              <Bar dataKey="target" name="Target" fill="hsl(var(--muted-foreground))" opacity={0.3} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Protein trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Protein Trend (14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={proteinData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={2} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: 12 }} />
              <ReferenceLine y={profile.proteinTarget} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: "target", fontSize: 10 }} />
              <Line type="monotone" dataKey="protein" stroke="#3b82f6" strokeWidth={2} dot={false} name="Protein (g)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Deficit accumulation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accumulated Deficit</CardTitle>
          <CardDescription>Running total since {format(startDate, "MMM d")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={deficitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: 12 }} />
              <Area type="monotone" dataKey="deficit" stroke="#10b981" fill="#10b98120" strokeWidth={2} name="Deficit (kcal)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weight trend */}
      {weightData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weight Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: 12 }} />
                <Line type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Weight (kg)" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Adjustment suggestion */}
      {rolling.daysLogged >= 5 && rolling.avgDeficit < 100 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-amber-800">💡 Adjustment suggestion</p>
            <p className="text-xs text-amber-700 mt-1">
              Your 7-day average deficit is below 100 kcal. Consider reducing your daily target by 100 kcal across day types to increase fat loss pace.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold mt-0.5">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}
