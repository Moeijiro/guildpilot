"use client";

import { useEffect, useState } from "react";
import { Users, RotateCcw } from "lucide-react";
import { api, MemberProgress } from "@/lib/api";

export default function MembersPage() {
  const [members, setMembers] = useState<MemberProgress[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, [statusFilter]);

  async function loadMembers() {
    setLoading(true);
    try {
      const data = await api.getMembers("demo-guild-777", statusFilter === "all" ? undefined : statusFilter);
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(userId: string) {
    if (!confirm("Are you sure you want to reset this member's onboarding journey?")) return;
    try {
      await api.resetMember("demo-guild-777", userId);
      await loadMembers();
    } catch (err) {
      alert("Failed to reset member.");
    }
  }

  return (
    <div className="space-y-8 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232428] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#5865F2]" />
            Member Onboarding Tracker
          </h1>
          <p className="text-xs text-zinc-400">
            Inspect individual member step progression, assigned roles, and reset state.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#2B2D31] border border-[#313338] rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-[#5865F2]"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="in_progress">In Progress</option>
          <option value="not_started">Not Started</option>
        </select>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-zinc-400 font-mono">Loading member records...</div>
      ) : members.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[#313338] rounded-xl text-xs text-zinc-500 font-mono">
          No members found matching filter.
        </div>
      ) : (
        <div className="border border-[#313338] rounded-xl bg-[#2B2D31]/40 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1E1F22] border-b border-[#313338] text-zinc-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4">Current Step</th>
                <th className="py-3 px-4">Assigned Roles</th>
                <th className="py-3 px-4">Joined At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#313338]/60">
              {members.map((m) => (
                <tr key={m.user_id} className="hover:bg-[#2B2D31]/80 transition">
                  <td className="py-3 px-4 flex items-center gap-2.5">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt="" className="w-7 h-7 rounded-full bg-[#1E1F22]" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#5865F2]/20 text-[#5865F2] font-bold flex items-center justify-center text-xs">
                        {m.username?.slice(0, 1) || "U"}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white">{m.username || m.user_id}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">ID: {m.user_id}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-[#1E1F22] rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            m.status === "completed" ? "bg-emerald-500" : "bg-[#5865F2]"
                          }`}
                          style={{ width: `${m.progress_percentage}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400">{m.progress_percentage}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-300">
                    Step {m.current_step_index} / {m.total_steps}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {m.assigned_roles.length > 0 ? (
                        m.assigned_roles.map((r) => (
                          <span
                            key={r}
                            className="px-2 py-0.5 rounded bg-[#1E1F22] border border-[#313338] text-[10px] text-zinc-300 font-mono"
                          >
                            {r.replace("role-", "")}
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-500 text-[11px]">None</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-zinc-400 font-mono">
                    {m.joined_at ? m.joined_at.substring(0, 10) : "Recent"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleReset(m.user_id)}
                      className="px-2.5 py-1 rounded bg-[#1E1F22] hover:bg-[#313338] border border-[#313338] text-[11px] text-zinc-300 flex items-center gap-1 ml-auto transition"
                      title="Reset Journey to Step 1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
