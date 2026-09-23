"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, Route, Sparkles, UserPlus, Users } from "lucide-react";
import { Bar, Empty, ErrorState, PageLoading, PageTitle, Panel, Pill, Stat } from "@/components/kit/ui";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/use-api";
import { api, DEMO_GUILD_NAME, type MemberProgress } from "@/lib/api";
import { MEMBER_STATUS, minutes, relative } from "@/lib/format";

const EVENT_LABEL: Record<string, string> = {
  onboarding_started: "Started onboarding",
  step_completed: "Completed a step",
  role_assigned: "Role assigned",
  onboarding_finished: "Finished onboarding",
  onboarding_reset: "Reset by an admin",
};

export default function OverviewPage() {
  const data = useApi(() => Promise.all([api.getOverview(), api.getFlow(), api.getMembers(), api.getLogs()]), "overview");
  const [seeding, setSeeding] = useState(false);

  async function seed() {
    setSeeding(true);
    try {
      await api.seedDemo();
      toast.success("Demo server loaded");
      data.reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSeeding(false);
    }
  }

  const header = <PageTitle title="Overview" description={<>How new members of <strong className="font-medium text-foreground">{DEMO_GUILD_NAME}</strong> move through onboarding.</>}
    actions={<Button variant="outline" onClick={seed} disabled={seeding}><Sparkles />{seeding ? "Loading…" : "Load demo"}</Button>} />;

  if (data.error) return <>{header}<ErrorState message={data.error} onRetry={data.reload} /></>;
  if (!data.data) return <PageLoading />;
  const [o, flow, members, logs] = data.data;

  // How many members got past each step: the onboarding funnel.
  const reached = (index: number) => members.filter((m: MemberProgress) => m.status === "completed" || m.current_step_index > index).length;

  return (
    <>
      {header}
      {members.length === 0 ? (
        <div className="rounded-xl border bg-card">
          <Empty icon={Users} title="No members have joined yet" description="Load the demo server: a five-step flow and a handful of members at different stages."
            action={<Button onClick={seed} disabled={seeding}><Sparkles />Load demo</Button>} />
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="New members" icon={UserPlus} value={o.new_members_count} />
            <Stat label="Completion rate" icon={CheckCircle2} value={`${o.completion_rate_percentage}%`} tone={o.completion_rate_percentage >= 50 ? "ok" : "warn"} />
            <Stat label="Still onboarding" icon={Users} value={o.incomplete_count} hint="Started, not finished" />
            <Stat label="Avg. time to finish" icon={Clock} value={o.average_completion_minutes ? minutes(o.average_completion_minutes) : "—"} />
          </div>
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
            <Panel title="Onboarding funnel" description="Members who completed each step of the active flow.">
              {flow.steps.length === 0 ? <Empty icon={Route} title="The flow has no steps" /> : (
                <div className="space-y-4 px-5 py-5">
                  {flow.steps.map((s, i) => <Bar key={s.id} label={`${i + 1}. ${s.title.replaceAll("{{server_name}}", DEMO_GUILD_NAME)}`} value={reached(i)} max={members.length} hint={`${reached(i)} of ${members.length}`} tone={i === flow.steps.length - 1 ? "ok" : "primary"} />)}
                </div>
              )}
            </Panel>
            <Panel title="Recent members">
              <ul className="divide-y">
                {o.recent_members.map((m) => {
                  const status = MEMBER_STATUS[m.status as MemberProgress["status"]] ?? MEMBER_STATUS.in_progress;
                  return (
                    <li key={m.user_id} className="flex items-center gap-3 px-5 py-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{m.username.slice(0, 2).toUpperCase()}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{m.username}</span><span className="text-xs text-muted-foreground">joined {relative(m.joined_at)}</span></span>
                      <Pill tone={status.tone}>{status.label}</Pill>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </div>
          <Panel title="Activity" description="What the bot did, newest first." className="mt-5">
            {logs.length === 0 ? <Empty title="No activity yet" description="Events appear here as members answer steps." /> : (
              <ol className="divide-y">
                {logs.slice(0, 12).map((l) => (
                  <li key={l.id} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:gap-4">
                    <span className="w-40 shrink-0 text-xs font-medium">{EVENT_LABEL[l.event_type] ?? l.event_type}</span>
                    <span className="min-w-0 flex-1 text-sm text-muted-foreground">{l.details}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{relative(l.timestamp)}</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </>
      )}
    </>
  );
}
