"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import { format } from "date-fns";

const schema = z.object({
  extraBurn: z.coerce.number().min(0).max(5000),
});

interface ExtraBurnDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  date: Date;
}

export function ExtraBurnDialog({ open, onOpenChange, date }: ExtraBurnDialogProps) {
  const { updateExtraBurn, getLog } = useAppStore();
  const existing = getLog(format(date, "yyyy-MM-dd"))?.metrics?.extraBurn;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { extraBurn: existing ?? 0 },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    await updateExtraBurn(format(date, "yyyy-MM-dd"), data.extraBurn > 0 ? data.extraBurn : undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Extra Burn Today</DialogTitle>
          <DialogDescription>
            Enter total calories burned from your watch or any activity not logged as a training session.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Extra calories burned (kcal)</Label>
            <Input
              type="number"
              placeholder="e.g. 350"
              autoFocus
              {...form.register("extraBurn")}
            />
            <p className="text-xs text-muted-foreground">
              This is added on top of your BMR and any logged training burns.
            </p>
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
