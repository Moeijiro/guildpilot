"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RotateCcw, StepForward, Users } from "lucide-react";
import { SelectField } from "@/components/kit/select-field";
import { Empty, ErrorState, PageTitle, Panel, Pill, RowsLoading, Table, Tag, Td, Th } from "@/components/kit/ui";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/use-api";
import { api, type MemberProgress, type OnboardingFlow } from "@/lib/api";
import { MEMBER_STATUS, relative } from "@/lib/format";

const FILTERS = [
  { value: "all", label: "All members" },
  { value: "in_progress", label: "Onboarding" },
  { value: "completed", label: "Completed" },
  { value: "not_started", label: "Not started" },
];

function Progress({ m }: { m: MemberProgress }) {
  const done = m.status === "completed" ? m.total_steps : Math.min(m.current_step_index, m.total_steps);
  return (
    <div className="w-40 space-y-1">
      <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${(done / Math.max(1, m.total_steps)) * 100}%`, background: m.status === "completed" ? "var(--ok)" : "var(--primary)" }} /></div>
      <p className="text-xs text-muted-foreground tabular">{done} of {m.total_steps} steps</p>
    </div>
  );
}

export default function MembersPage() {
  const [filter, setFilter] = useState("all");
  const data = useApi(() => Promise.all([api.getMembers(filter === "all" ? undefined : filter), api.getFlow()]), filter);
  const [busy, setBusy] = useState<string | null>(null);

  async function act(userId: string, action: () => Promise<unknown>, success: string) {
    setBusy(userId);
    try {
      await action();
      toast.success(success);
      data.reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  /** Answer the member's current step with its first option, as if they clicked it in Discord. */
  function simulate(m: MemberProgress, flow: OnboardingFlow) {
    const step = flow.steps[m.current_step_index];
    if (!step) return;
    const option = step.options[0]?.key ?? "accepted";
    act(m.user_id, () => api.advanceMember(m.user_id, step.id, option), `${m.username ?? m.user_id} answered “${step.options[0]?.label ?? step.title}”`);
  }

  const members = data.data?.[0];
  const flow = data.data?.[1];

  return (
    <>
      <PageTitle title="Members" description="Where each new member is in the flow, and the roles their answers gave them."
        actions={<SelectField label="Filter" value={filter} onChange={setFilter} options={FILTERS} className="w-44" />} />
      <Panel bodyClassName="p-0">
        {data.error ? <div className="p-4"><ErrorState message={data.error} onRetry={data.reload} /></div>
          : !members || !flow ? <RowsLoading rows={5} />
          : members.length === 0 ? <Empty icon={Users} title="No members here" description={filter === "all" ? "Load the demo from the Overview page." : "Nobody matches this filter."} />
          : (
            <Table>
              <thead><tr><Th>Member</Th><Th>Status</Th><Th>Progress</Th><Th>Roles granted</Th><Th>Joined</Th><Th className="text-right">Actions</Th></tr></thead>
              <tbody>
                {members.map((m) => {
                  const status = MEMBER_STATUS[m.status] ?? MEMBER_STATUS.in_progress;
                  const name = m.username ?? m.user_id;
                  return (
                    <tr key={m.id}>
                      <Td>
                        <span className="flex items-center gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{name.slice(0, 2).toUpperCase()}</span>
                          <span className="min-w-0"><span className="block truncate font-medium">{name}</span><span className="font-mono text-xs text-muted-foreground">{m.user_id}</span></span>
                        </span>
                      </Td>
                      <Td><Pill tone={status.tone}>{status.label}</Pill></Td>
                      <Td><Progress m={m} /></Td>
                      <Td><span className="flex max-w-64 flex-wrap gap-1">{m.assigned_roles.length ? m.assigned_roles.map((r) => <Tag key={r}>@{r.replace(/^role-/, "")}</Tag>) : <span className="text-xs text-muted-foreground">None yet</span>}</span></Td>
                      <Td className="text-xs whitespace-nowrap text-muted-foreground">{relative(m.joined_at)}</Td>
                      <Td className="text-right whitespace-nowrap">
                        {m.status !== "completed" && flow.steps[m.current_step_index] ? (
                          <Button variant="outline" size="sm" disabled={busy === m.user_id} onClick={() => simulate(m, flow)}><StepForward />Next step</Button>
                        ) : null}
                        <Button variant="ghost" size="sm" disabled={busy === m.user_id} onClick={() => act(m.user_id, () => api.resetMember(m.user_id), `${name} will start over`)}><RotateCcw />Reset</Button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
      </Panel>
      <p className="mt-3 text-xs text-muted-foreground">“Next step” answers the member&apos;s current step with its first option — what happens when they click it in Discord.</p>
    </>
  );
}
