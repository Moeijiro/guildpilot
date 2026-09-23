import type { Tone } from "@/components/kit/ui";
import type { MemberProgress, StepType } from "@/lib/api";

export function parseUTC(value: string): Date {
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`);
}

export function relative(value: string | null | undefined): string {
  if (!value) return "—";
  const minutes = Math.round((Date.now() - parseUTC(value).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function minutes(value: number): string {
  if (value < 60) return `${Math.round(value)} min`;
  return `${(value / 60).toFixed(1)} h`;
}

export const MEMBER_STATUS: Record<MemberProgress["status"], { label: string; tone: Tone }> = {
  not_started: { label: "Not started", tone: "muted" },
  in_progress: { label: "Onboarding", tone: "run" },
  completed: { label: "Completed", tone: "ok" },
  expired: { label: "Expired", tone: "warn" },
};

export const STEP_TYPES: { value: StepType; label: string; hint: string }[] = [
  { value: "welcome_message", label: "Welcome message", hint: "A greeting with one button to begin." },
  { value: "button_choice", label: "Button choice", hint: "Pick one of a few buttons — e.g. region." },
  { value: "select_menu", label: "Select menu", hint: "Pick several from a dropdown — e.g. interests." },
  { value: "role_selection", label: "Role selection", hint: "Buttons that each grant a role." },
  { value: "rules_confirm", label: "Rules confirmation", hint: "Accept the rules to continue." },
  { value: "checklist_item", label: "Checklist item", hint: "A final task that unlocks channels." },
];

export const STEP_LABEL = Object.fromEntries(STEP_TYPES.map((t) => [t.value, t.label])) as Record<StepType, string>;

/** {{username}}, {{server_name}} and {{member_count}}, every occurrence. */
export function interpolate(text: string, vars: { username: string; server: string; count: string }): string {
  return text.replaceAll("{{username}}", vars.username).replaceAll("{{server_name}}", vars.server).replaceAll("{{member_count}}", vars.count);
}
