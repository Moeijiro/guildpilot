const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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
  step_type: string;
  title: str;
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
  selected_data: Record<string, any>;
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

export const api = {
  async getOverview(guildId: string = "demo-guild-777"): Promise<OverviewMetrics> {
    const res = await fetch(`${API_URL}/guilds/${guildId}/overview`);
    if (!res.ok) throw new Error("Failed to load guild overview.");
    return res.json();
  },

  async getFlow(guildId: string = "demo-guild-777"): Promise<OnboardingFlow> {
    const res = await fetch(`${API_URL}/guilds/${guildId}/flow`);
    if (!res.ok) throw new Error("Failed to load onboarding flow.");
    return res.json();
  },

  async addStep(guildId: string, step: Partial<OnboardingStep>): Promise<OnboardingStep> {
    const res = await fetch(`${API_URL}/guilds/${guildId}/flow/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(step),
    });
    if (!res.ok) throw new Error("Failed to add step.");
    return res.json();
  },

  async updateStep(guildId: string, stepId: number, step: Partial<OnboardingStep>): Promise<OnboardingStep> {
    const res = await fetch(`${API_URL}/guilds/${guildId}/flow/steps/${stepId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(step),
    });
    if (!res.ok) throw new Error("Failed to update step.");
    return res.json();
  },

  async deleteStep(guildId: string, stepId: number): Promise<void> {
    const res = await fetch(`${API_URL}/guilds/${guildId}/flow/steps/${stepId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete step.");
  },

  async reorderSteps(guildId: string, stepIdsOrder: number[]): Promise<void> {
    const res = await fetch(`${API_URL}/guilds/${guildId}/flow/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step_ids_order: stepIdsOrder }),
    });
    if (!res.ok) throw new Error("Failed to reorder steps.");
  },

  async getMembers(guildId: string = "demo-guild-777", status?: string): Promise<MemberProgress[]> {
    const url = status
      ? `${API_URL}/guilds/${guildId}/members?status=${status}`
      : `${API_URL}/guilds/${guildId}/members`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load members.");
    return res.json();
  },

  async resetMember(guildId: string, userId: string): Promise<void> {
    const res = await fetch(`${API_URL}/guilds/${guildId}/members/${userId}/reset`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to reset member journey.");
  },

  async advanceMember(guildId: string, userId: string, stepId: number, selection: any): Promise<any> {
    const res = await fetch(`${API_URL}/guilds/${guildId}/members/${userId}/advance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step_id: stepId, user_selection: selection }),
    });
    if (!res.ok) throw new Error("Failed to advance step.");
    return res.json();
  },

  async getLogs(guildId: string = "demo-guild-777"): Promise<OnboardingLog[]> {
    const res = await fetch(`${API_URL}/guilds/${guildId}/logs`);
    if (!res.ok) throw new Error("Failed to load logs.");
    return res.json();
  },

  async seedDemo(): Promise<void> {
    const res = await fetch(`${API_URL}/demo/seed`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to seed demo data.");
  },
};
