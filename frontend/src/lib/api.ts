export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");
export const DEMO_GUILD = "demo-guild-777";
export const DEMO_GUILD_NAME = "Developer Nexus";

export type StepType = "welcome_message" | "button_choice" | "select_menu" | "rules_confirm" | "role_selection" | "checklist_item";

export interface StepOption {
  key: string;
  label: string;
  description?: string;
  emoji?: string;
  role_id?: string;
  role_name?: string;
}

export interface OnboardingStep {
  id: number;
  flow_id: number;
  step_order: number;
  step_type: StepType;
  title: string;
  description: string;
  options: StepOption[];
  created_at: string;
}

export interface OnboardingFlow {
  id: number;
  guild_id: string;
  title: string;
  description?: string;
  is_active: boolean;
  steps: OnboardingStep[];
  created_at: string;
}

export interface MemberProgress {
  id: number;
  guild_id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  current_step_index: number;
  total_steps: number;
  status: "not_started" | "in_progress" | "completed" | "expired";
  selected_data: Record<string, unknown>;
  assigned_roles: string[];
  joined_at: string;
  completed_at: string | null;
  progress_percentage: number;
}

export interface OverviewMetrics {
  new_members_count: number;
  completion_rate_percentage: number;
  incomplete_count: number;
  average_completion_minutes: number;
  recent_members: Array<{
    user_id: string;
    username: string;
    status: string;
    joined_at: string;
    completed_at: string | null;
  }>;
}

export interface OnboardingLog {
  id: number;
  guild_id: string;
  user_id: string;
  event_type: string;
  details: string;
  timestamp: string;
}

export type StepInput = { step_type: StepType; title: string; description: string; options: StepOption[] };

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers: init?.body ? { "Content-Type": "application/json" } : undefined });
  } catch {
    throw new ApiError("Can't reach the GuildPilot API. Is the backend running on port 8000?", 0);
  }
  if (!res.ok) {
    let message = `Request failed (HTTP ${res.status}).`;
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") message = data.detail;
      else if (Array.isArray(data?.detail) && data.detail[0]?.msg) message = String(data.detail[0].msg);
    } catch {
      /* not JSON */
    }
    throw new ApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}

const send = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });
const g = (guild: string) => `/guilds/${guild}`;

export const api = {
  getOverview: (guild = DEMO_GUILD) => request<OverviewMetrics>(`${g(guild)}/overview`),
  getFlow: (guild = DEMO_GUILD) => request<OnboardingFlow>(`${g(guild)}/flow`),
  addStep: (step: StepInput, guild = DEMO_GUILD) => request<OnboardingStep>(`${g(guild)}/flow/steps`, send("POST", step)),
  updateStep: (id: number, step: Partial<StepInput>, guild = DEMO_GUILD) => request<OnboardingStep>(`${g(guild)}/flow/steps/${id}`, send("PUT", step)),
  deleteStep: (id: number, guild = DEMO_GUILD) => request<{ message: string }>(`${g(guild)}/flow/steps/${id}`, send("DELETE")),
  reorderSteps: (ids: number[], guild = DEMO_GUILD) => request<{ message: string }>(`${g(guild)}/flow/reorder`, send("POST", { step_ids_order: ids })),
  getMembers: (status?: string, guild = DEMO_GUILD) => request<MemberProgress[]>(`${g(guild)}/members${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  resetMember: (userId: string, guild = DEMO_GUILD) => request<{ status: string }>(`${g(guild)}/members/${userId}/reset`, send("POST")),
  advanceMember: (userId: string, stepId: number, selection: string | string[], guild = DEMO_GUILD) =>
    request<{ current_step_index: number; status: string; is_finished: boolean; assigned_roles: string[] }>(`${g(guild)}/members/${userId}/advance`, send("POST", { step_id: stepId, user_selection: selection })),
  getLogs: (guild = DEMO_GUILD) => request<OnboardingLog[]>(`${g(guild)}/logs`),
  seedDemo: () => request<{ message: string }>(`/demo/seed`, send("POST")),
};
