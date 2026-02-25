"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/lib/store";
import type { AppData } from "@/lib/types";

const profileSchema = z.object({
  name: z.string().min(1),
  age: z.coerce.number().min(1).max(120),
  heightCm: z.coerce.number().min(100).max(250),
  weightKg: z.coerce.number().min(30).max(300),
  planStartDate: z.string(),
  goalDate: z.string(),
  goalLoseKg: z.coerce.number().min(0.1).max(50),
  proteinTarget: z.coerce.number().min(50).max(500),
  calorieHybrid: z.coerce.number().min(500).max(5000),
  caloriePilates: z.coerce.number().min(500).max(5000),
  calorieRun: z.coerce.number().min(500).max(5000),
  calorieRest: z.coerce.number().min(500).max(5000),
});

export default function SettingsPage() {
  const { profile, updateProfile, exportJSON, exportCSV, importJSON, resetData } = useAppStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);
  const [importMode, setImportMode] = useState<"merge" | "overwrite">("overwrite");

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile.name,
      age: profile.age,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      planStartDate: profile.planStartDate,
      goalDate: profile.goalDate,
      goalLoseKg: profile.goalLoseKg,
      proteinTarget: profile.proteinTarget,
      calorieHybrid: profile.calorieTargets.hybrid,
      caloriePilates: profile.calorieTargets.pilates,
      calorieRun: profile.calorieTargets.run,
      calorieRest: profile.calorieTargets.rest,
    },
  });

  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
    await updateProfile({
      name: data.name,
      age: data.age,
      heightCm: data.heightCm,
      weightKg: data.weightKg,
      planStartDate: data.planStartDate,
      goalDate: data.goalDate,
      goalLoseKg: data.goalLoseKg,
      proteinTarget: data.proteinTarget,
      calorieTargets: {
        hybrid: data.calorieHybrid,
        pilates: data.caloriePilates,
        run: data.calorieRun,
        rest: data.calorieRest,
      },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data: AppData = JSON.parse(text);
      await importJSON(data, importMode);
      alert("Import successful!");
    } catch {
      alert("Import failed: invalid JSON file");
    }
  };

  const handleReset = async () => {
    if (confirm("Are you sure? This will delete ALL data and cannot be undone.")) {
      await resetData();
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your profile and preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Your personal details and goals</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Name" error={form.formState.errors.name?.message}>
                <Input {...form.register("name")} />
              </FormField>
              <FormField label="Age">
                <Input type="number" {...form.register("age")} />
              </FormField>
              <FormField label="Height (cm)">
                <Input type="number" {...form.register("heightCm")} />
              </FormField>
              <FormField label="Current weight (kg)">
                <Input type="number" step="0.1" {...form.register("weightKg")} />
              </FormField>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Plan start date">
                <Input type="date" {...form.register("planStartDate")} />
              </FormField>
              <FormField label="Goal date">
                <Input type="date" {...form.register("goalDate")} />
              </FormField>
              <FormField label="Goal fat loss (kg)">
                <Input type="number" step="0.1" {...form.register("goalLoseKg")} />
              </FormField>
              <FormField label="Protein target (g/day)">
                <Input type="number" {...form.register("proteinTarget")} />
              </FormField>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-3">Calorie targets</p>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Hybrid day (kcal)">
                  <Input type="number" {...form.register("calorieHybrid")} />
                </FormField>
                <FormField label="Pilates day (kcal)">
                  <Input type="number" {...form.register("caloriePilates")} />
                </FormField>
                <FormField label="Run Z2 day (kcal)">
                  <Input type="number" {...form.register("calorieRun")} />
                </FormField>
                <FormField label="Rest day (kcal)">
                  <Input type="number" {...form.register("calorieRest")} />
                </FormField>
              </div>
            </div>

            <Button type="submit" className="w-full">
              {saved ? "Saved ✓" : "Save Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Use fixed breakfast template</p>
              <p className="text-xs text-muted-foreground">Auto-include breakfast macros</p>
            </div>
            <Switch
              checked={profile.useFixedBreakfast}
              onCheckedChange={(v) => updateProfile({ useFixedBreakfast: v })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Count exercise calories</p>
              <p className="text-xs text-muted-foreground">Add burned calories to daily allowance</p>
            </div>
            <Switch
              checked={profile.countExerciseCalories}
              onCheckedChange={(v) => updateProfile({ countExerciseCalories: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Weekly schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weekly Schedule</CardTitle>
          <CardDescription>Default day types for auto-detection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {(["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const).map(day => (
              <div key={day} className="text-center">
                <p className="text-xs text-muted-foreground mb-1 capitalize">{day}</p>
                <select
                  className="w-full text-xs border rounded p-1 bg-background"
                  value={profile.weeklySchedule[day]}
                  onChange={e => updateProfile({
                    weeklySchedule: { ...profile.weeklySchedule, [day]: e.target.value }
                  })}
                >
                  <option value="hybrid">H</option>
                  <option value="pilates">P</option>
                  <option value="run">R</option>
                  <option value="rest">—</option>
                </select>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">H = Hybrid, P = Pilates, R = Run Z2, — = Rest</p>
        </CardContent>
      </Card>

      {/* Export / Import */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Management</CardTitle>
          <CardDescription>Export, import, or reset your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={exportJSON}>Export JSON</Button>
            <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Label className="text-sm">Import mode:</Label>
              <div className="flex gap-2">
                {(["overwrite", "merge"] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setImportMode(m)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors capitalize ${
                      importMode === m ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
              Import JSON
            </Button>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          </div>

          <Separator />

          <Button variant="destructive" className="w-full" onClick={handleReset}>
            Reset All Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
