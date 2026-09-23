import { Check, ChevronDown, Compass, Sparkles } from "lucide-react";
import type { OnboardingStep } from "@/lib/api";
import { interpolate } from "@/lib/format";

/**
 * What a new member sees in Discord for one step. It deliberately uses
 * Discord's own dark palette — it's a picture of Discord, not of GuildPilot.
 */
export function DiscordPreview({ step, total, serverName, username = "new_member" }: { step: OnboardingStep | null; total: number; serverName: string; username?: string }) {
  if (!step) {
    return <div className="rounded-xl bg-[#313338] p-8 text-center text-sm text-[#b5bac1]">Select a step to preview it.</div>;
  }
  const vars = { username, server: serverName, count: "1,248" };
  const choice = step.step_type === "button_choice" || step.step_type === "role_selection";

  return (
    <div className="rounded-xl bg-[#313338] p-4 text-[#dbdee1] sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#5865F2] text-white"><Compass className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-semibold text-white">GuildPilot</span>
            <span className="rounded bg-[#5865F2] px-1 text-[10px] font-semibold text-white">APP</span>
            <span className="text-[11px] text-[#949ba4]">Today at 12:45</span>
          </div>
          <p className="text-[11px] text-[#949ba4]">Only you can see this message</p>

          <div className="mt-2 rounded border-l-4 border-[#5865F2] bg-[#2b2d31] p-3.5">
            <p className="text-[11px] font-medium text-[#b5bac1]">Step {step.step_order} of {total}</p>
            <p className="mt-1 font-semibold text-white">{interpolate(step.title, vars)}</p>
            <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-[#dbdee1]">{interpolate(step.description, vars)}</p>
          </div>

          <div className="mt-2.5">
            {choice ? (
              <div className="flex flex-wrap gap-2">
                {step.options.map((o) => (
                  <span key={o.key} className="inline-flex items-center gap-1.5 rounded bg-[#4e5058] px-3.5 py-1.5 text-sm font-medium text-white">{o.emoji ? <span aria-hidden>{o.emoji}</span> : null}{o.label}</span>
                ))}
              </div>
            ) : step.step_type === "select_menu" ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between rounded bg-[#1e1f22] px-3 py-2 text-sm text-[#949ba4]">Choose your interests…<ChevronDown className="size-4" /></div>
                <div className="rounded bg-[#2b2d31] py-1">
                  {step.options.map((o) => (
                    <div key={o.key} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                      {o.emoji ? <span aria-hidden>{o.emoji}</span> : null}
                      <span className="min-w-0"><span className="block text-white">{o.label}</span>{o.description ? <span className="block text-xs text-[#949ba4]">{o.description}</span> : null}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : step.step_type === "rules_confirm" ? (
              <span className="inline-flex items-center gap-1.5 rounded bg-[#248046] px-3.5 py-1.5 text-sm font-medium text-white"><Check className="size-4" />{step.options[0]?.label ?? "I accept the rules"}</span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded bg-[#5865F2] px-3.5 py-1.5 text-sm font-medium text-white">
                {step.step_type === "welcome_message" ? <Sparkles className="size-4" /> : <Check className="size-4" />}
                {step.options[0]?.label ?? (step.step_type === "welcome_message" ? "Begin" : "Done")}
              </span>
            )}
          </div>
          {step.options.some((o) => o.role_name) ? (
            <p className="mt-3 text-[11px] text-[#949ba4]">Grants: {step.options.filter((o) => o.role_name).map((o) => `${o.label} → @${o.role_name}`).join(" · ")}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
