"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { SelectField } from "@/components/kit/select-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, type OnboardingStep, type StepOption, type StepType } from "@/lib/api";
import { STEP_TYPES } from "@/lib/format";

const slug = (text: string) => text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

type Row = { emoji: string; label: string; role: string };

function toRows(options: StepOption[]): Row[] {
  return options.map((o) => ({ emoji: o.emoji ?? "", label: o.label, role: o.role_name ?? "" }));
}

function toOptions(rows: Row[], previous: StepOption[]): StepOption[] {
  return rows.filter((r) => r.label.trim()).map((r, i) => {
    const keep = previous[i];
    const key = keep && keep.label === r.label ? keep.key : slug(r.label) || `option-${i + 1}`;
    return {
      key, label: r.label.trim(), emoji: r.emoji.trim() || undefined, description: keep?.description,
      role_name: r.role.trim() || undefined, role_id: r.role.trim() ? keep?.role_name === r.role.trim() && keep.role_id ? keep.role_id : `role-${slug(r.role)}` : undefined,
    };
  });
}

/** Add a step, or edit one. Options become buttons / menu entries; a role name makes the option grant that role. */
export function StepEditor({ step, open, onOpenChange, onSaved }: { step: OnboardingStep | null; open: boolean; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {open ? <EditorBody key={step?.id ?? "new"} step={step} onClose={() => onOpenChange(false)} onSaved={onSaved} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function EditorBody({ step, onClose, onSaved }: { step: OnboardingStep | null; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<StepType>(step?.step_type ?? "button_choice");
  const [title, setTitle] = useState(step?.title ?? "");
  const [description, setDescription] = useState(step?.description ?? "");
  const [rows, setRows] = useState<Row[]>(step ? toRows(step.options) : [{ emoji: "", label: "", role: "" }]);
  const [saving, setSaving] = useState(false);
  const setRow = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const options = toOptions(rows, step?.options ?? []);
    setSaving(true);
    try {
      if (step) await api.updateStep(step.id, { title, description, options });
      else await api.addStep({ step_type: type, title, description, options });
      toast.success(step ? "Step saved" : "Step added to the end of the flow");
      onSaved();
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{step ? "Edit step" : "Add a step"}</DialogTitle>
        <DialogDescription>Use {"{{username}}"}, {"{{server_name}}"} and {"{{member_count}}"} in the text.</DialogDescription>
      </DialogHeader>
      <form onSubmit={save} className="space-y-4">
        {!step ? (
          <div className="space-y-1.5">
            <Label htmlFor="s-type">Type</Label>
            <SelectField id="s-type" label="Type" value={type} onChange={(v) => setType(v as StepType)} options={STEP_TYPES.map((t) => ({ value: t.value, label: t.label }))} />
            <p className="text-xs text-muted-foreground">{STEP_TYPES.find((t) => t.value === type)?.hint}</p>
          </div>
        ) : null}
        <div className="space-y-1.5"><Label htmlFor="s-title">Title</Label><Input id="s-title" required minLength={2} maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="s-desc">Message</Label><Textarea id="s-desc" required minLength={2} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div className="space-y-2">
          <div className="flex items-center justify-between"><Label>Options</Label><span className="text-xs text-muted-foreground">Role is optional</span></div>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[3.5rem_minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
              <Input aria-label="Emoji" value={r.emoji} onChange={(e) => setRow(i, { emoji: e.target.value })} placeholder="🙂" maxLength={4} className="text-center" />
              <Input aria-label="Label" value={r.label} onChange={(e) => setRow(i, { label: e.target.value })} placeholder="Button label" maxLength={80} />
              <Input aria-label="Role" value={r.role} onChange={(e) => setRow(i, { role: e.target.value })} placeholder="Grants role…" maxLength={60} />
              <Button type="button" variant="ghost" size="icon" aria-label="Remove option" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}><Trash2 /></Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setRows((rs) => [...rs, { emoji: "", label: "", role: "" }])}><Plus />Add option</Button>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : step ? "Save step" : "Add step"}</Button>
        </DialogFooter>
      </form>
    </>
  );
}
