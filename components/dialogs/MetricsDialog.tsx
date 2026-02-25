"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import { format } from "date-fns";

const schema = z.object({
  weightKg: z.coerce.number().optional(),
  steps: z.coerce.number().optional(),
  waterLiters: z.coerce.number().optional(),
  sleepHours: z.coerce.number().optional(),
});

interface MetricsDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  date: Date;
}

export function MetricsDialog({ open, onOpenChange, date }: MetricsDialogProps) {
  const { updateMetrics, getLog } = useAppStore();
  const existing = getLog(format(date, "yyyy-MM-dd"))?.metrics ?? {};

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      weightKg: existing.weightKg,
      steps: existing.steps,
      waterLiters: existing.waterLiters,
      sleepHours: existing.sleepHours,
    },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    const metrics: Record<string, number> = {};
    if (data.weightKg) metrics.weightKg = data.weightKg;
    if (data.steps) metrics.steps = data.steps;
    if (data.waterLiters) metrics.waterLiters = data.waterLiters;
    if (data.sleepHours) metrics.sleepHours = data.sleepHours;
    await updateMetrics(format(date, "yyyy-MM-dd"), metrics);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Log Metrics</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Weight (kg)</Label>
              <Input type="number" step="0.1" placeholder="e.g. 60.0" {...form.register("weightKg")} />
            </div>
            <div className="space-y-1.5">
              <Label>Steps</Label>
              <Input type="number" placeholder="e.g. 8000" {...form.register("steps")} />
            </div>
            <div className="space-y-1.5">
              <Label>Water (L)</Label>
              <Input type="number" step="0.1" placeholder="e.g. 2.0" {...form.register("waterLiters")} />
            </div>
            <div className="space-y-1.5">
              <Label>Sleep (hrs)</Label>
              <Input type="number" step="0.5" placeholder="e.g. 7.5" {...form.register("sleepHours")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
