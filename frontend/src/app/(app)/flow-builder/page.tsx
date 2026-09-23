"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Pencil, Plus, Route, Trash2 } from "lucide-react";
import { DiscordPreview } from "@/components/discord-preview";
import { Empty, ErrorState, PageLoading, PageTitle, Panel, Tag } from "@/components/kit/ui";
import { StepEditor } from "@/components/step-editor";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/use-api";
import { api, DEMO_GUILD_NAME, type OnboardingStep } from "@/lib/api";
import { STEP_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function FlowBuilderPage() {
  const flow = useApi(() => api.getFlow(), "flow");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editing, setEditing] = useState<OnboardingStep | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (flow.error) return <ErrorState message={flow.error} onRetry={flow.reload} />;
  if (!flow.data) return <PageLoading />;
  const steps = flow.data.steps;
  const selected = steps.find((s) => s.id === selectedId) ?? steps[0] ?? null;

  async function act(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      flow.reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function move(index: number, by: -1 | 1) {
    const ids = steps.map((s) => s.id);
    [ids[index], ids[index + by]] = [ids[index + by], ids[index]];
    act(() => api.reorderSteps(ids), "Order saved");
  }

  return (
    <>
      <PageTitle title="Onboarding flow" description={flow.data.title ? `${flow.data.title} — ${steps.length} step${steps.length === 1 ? "" : "s"}, shown to every new member in order.` : "The steps every new member goes through, in order."}
        actions={<Button onClick={() => { setEditing(null); setEditorOpen(true); }}><Plus />Add step</Button>} />

      {steps.length === 0 ? (
        <div className="rounded-xl border bg-card"><Empty icon={Route} title="No steps yet" description="Add a welcome message, then choices that assign roles — or load the demo from the Overview page." /></div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <Panel title="Steps" description="Select a step to preview it." bodyClassName="p-0">
            <ol className="divide-y">
              {steps.map((s, i) => (
                <li key={s.id} className={cn("flex items-center gap-3 px-4 py-3", selected?.id === s.id && "bg-accent")}>
                  <button type="button" onClick={() => setSelectedId(s.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold", selected?.id === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{i + 1}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{s.title.replaceAll("{{server_name}}", DEMO_GUILD_NAME)}</span>
                      <span className="mt-0.5 flex flex-wrap gap-1.5"><Tag>{STEP_LABEL[s.step_type] ?? s.step_type}</Tag>{s.options.some((o) => o.role_id) ? <Tag>assigns roles</Tag> : null}</span>
                    </span>
                  </button>
                  <div className="flex shrink-0">
                    <Button variant="ghost" size="icon-sm" aria-label="Move up" disabled={busy || i === 0} onClick={() => move(i, -1)}><ArrowUp /></Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Move down" disabled={busy || i === steps.length - 1} onClick={() => move(i, 1)}><ArrowDown /></Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Edit step" onClick={() => { setEditing(s); setEditorOpen(true); }}><Pencil /></Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Delete step" disabled={busy} onClick={() => { if (confirm(`Delete “${s.title}”?`)) act(() => api.deleteStep(s.id), "Step deleted"); }}><Trash2 /></Button>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
          <Panel title="Discord preview" description="What a new member sees for this step." bodyClassName="p-4">
            <DiscordPreview step={selected} total={steps.length} serverName={DEMO_GUILD_NAME} />
          </Panel>
        </div>
      )}

      <StepEditor step={editing} open={editorOpen} onOpenChange={setEditorOpen} onSaved={flow.reload} />
    </>
  );
}
