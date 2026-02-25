"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const schema = z.object({
  type: z.enum(["hybrid", "pilates", "run", "walk", "other"]),
  durationMin: z.coerce.number().min(1),
  distanceKm: z.coerce.number().optional(),
  rpe: z.coerce.number().min(1).max(10).optional(),
  notes: z.string().optional(),
});

const TYPES = [
  { value: "hybrid", label: "Hybrid" },
  { value: "pilates", label: "Pilates" },
  { value: "run", label: "Run Z2" },
  { value: "walk", label: "Walk" },
  { value: "other", label: "Other" },
];

interface TrainingDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  date: Date;
}

export function TrainingDialog({ open, onOpenChange, date }: TrainingDialogProps) {
  const { addTraining } = useAppStore();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { type: "hybrid", durationMin: 45 },
  });

  const selectedType = form.watch("type");

  const onSubmit = async (data: z.infer<typeof schema>) => {
    await addTraining(format(date, "yyyy-MM-dd"), {
      type: data.type,
      durationMin: data.durationMin,
      distanceKm: data.distanceKm,
      rpe: data.rpe,
      notes: data.notes,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Training</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => form.setValue("type", t.value as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                    selectedType === t.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-accent"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Duration (min)</Label>
              <Input type="number" {...form.register("durationMin")} />
              {form.formState.errors.durationMin && (
                <p className="text-xs text-destructive">{form.formState.errors.durationMin.message}</p>
              )}
            </div>
            {(selectedType === "run" || selectedType === "walk") && (
              <div className="space-y-1.5">
                <Label>Distance (km)</Label>
                <Input type="number" step="0.1" placeholder="optional" {...form.register("distanceKm")} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>RPE (1–10)</Label>
              <Input type="number" min="1" max="10" placeholder="optional" {...form.register("rpe")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea placeholder="optional notes..." {...form.register("notes")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Log</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
