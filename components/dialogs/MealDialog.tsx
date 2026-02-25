"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAppStore } from "@/lib/store";
import { format } from "date-fns";

const quickSchema = z.object({
  name: z.string().min(1, "Name required"),
  calories: z.coerce.number().min(0),
  time: z.string().default("12:00"),
});

const macroSchema = z.object({
  name: z.string().min(1, "Name required"),
  protein: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  fat: z.coerce.number().min(0),
  time: z.string().default("12:00"),
});

interface MealDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  date: Date;
}

export function MealDialog({ open, onOpenChange, date }: MealDialogProps) {
  const { addMeal, mealTemplates } = useAppStore();
  const [tab, setTab] = useState<"quick" | "macros" | "template">("quick");
  const dateStr = format(date, "yyyy-MM-dd");

  const quickForm = useForm<z.infer<typeof quickSchema>>({
    resolver: zodResolver(quickSchema),
    defaultValues: { name: "", calories: 0, time: format(new Date(), "HH:mm") },
  });

  const macroForm = useForm<z.infer<typeof macroSchema>>({
    resolver: zodResolver(macroSchema),
    defaultValues: { name: "", protein: 0, carbs: 0, fat: 0, time: format(new Date(), "HH:mm") },
  });

  const p = macroForm.watch("protein") || 0;
  const c = macroForm.watch("carbs") || 0;
  const f = macroForm.watch("fat") || 0;
  const autoCal = Math.round(p * 4 + c * 4 + f * 9);

  const onQuickSubmit = async (data: z.infer<typeof quickSchema>) => {
    await addMeal(dateStr, { name: data.name, calories: data.calories, time: data.time });
    quickForm.reset();
    onOpenChange(false);
  };

  const onMacroSubmit = async (data: z.infer<typeof macroSchema>) => {
    await addMeal(dateStr, {
      name: data.name,
      calories: autoCal,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
      time: data.time,
    });
    macroForm.reset();
    onOpenChange(false);
  };

  const addTemplate = async (templateId: string) => {
    const tmpl = mealTemplates.find(t => t.id === templateId);
    if (!tmpl) return;
    await addMeal(dateStr, {
      name: tmpl.name,
      calories: tmpl.totalCalories,
      protein: tmpl.totalProtein,
      carbs: tmpl.totalCarbs,
      fat: tmpl.totalFat,
      time: format(new Date(), "HH:mm"),
      templateId,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Meal</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="w-full">
            <TabsTrigger value="quick" className="flex-1">Quick</TabsTrigger>
            <TabsTrigger value="macros" className="flex-1">Macros</TabsTrigger>
            <TabsTrigger value="template" className="flex-1">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="quick">
            <form onSubmit={quickForm.handleSubmit(onQuickSubmit)} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input placeholder="e.g. Chicken and rice" {...quickForm.register("name")} />
                {quickForm.formState.errors.name && (
                  <p className="text-xs text-destructive">{quickForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Calories</Label>
                  <Input type="number" placeholder="0" {...quickForm.register("calories")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Time</Label>
                  <Input type="time" {...quickForm.register("time")} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit">Add</Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="macros">
            <form onSubmit={macroForm.handleSubmit(onMacroSubmit)} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input placeholder="e.g. Salmon bowl" {...macroForm.register("name")} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["protein", "carbs", "fat"] as const).map(macro => (
                  <div key={macro} className="space-y-1.5">
                    <Label className="capitalize">{macro} (g)</Label>
                    <Input type="number" step="0.1" placeholder="0" {...macroForm.register(macro)} />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                <span className="text-sm text-muted-foreground">Calculated calories</span>
                <span className="text-sm font-semibold">{autoCal} kcal</span>
              </div>
              <div className="space-y-1.5">
                <Label>Time</Label>
                <Input type="time" {...macroForm.register("time")} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit">Add</Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="template">
            <div className="space-y-2 pt-2">
              {mealTemplates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No templates saved yet.</p>
              ) : (
                mealTemplates.map(t => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-md border p-3 hover:bg-accent cursor-pointer"
                    onClick={() => addTemplate(t.id)}
                  >
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.totalCalories} kcal · {t.totalProtein}g protein</p>
                    </div>
                    <Button size="sm" variant="secondary">Add</Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
