"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, CheckCircle2, Clock, AlertTriangle, ArrowRight, 
  RotateCcw, Sliders, Sparkles, Compass 
} from "lucide-react";
import { api, OverviewMetrics } from "@/lib/api";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOverview();
  }, []);

  async function loadOverview() {
    setLoading(true);
    try {
      const data = await api.getOverview();
      setMetrics(data);
    } catch (err: any) {
      setError("Failed to connect to backend API.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSeedDemo() {
    setSeeding(true);
    try {
      await api.seedDemo();
      await loadOverview();
    } catch (err) {
      setError("Failed to seed demo data.");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232428] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Compass className="w-6 h-6 text-[#5865F2]" />
            Community Onboarding Overview
          </h1>
          <p className="text-xs text-zinc-400">
            Real-time telemetry for <strong className="text-white">Developer Nexus</strong> onboarding flows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedDemo}
            disabled={seeding}
            className="px-3 py-1.5 rounded-lg border border-[#313338] bg-[#2B2D31] hover:bg-[#35373C] text-xs text-zinc-300 flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#5865F2]" />
            {seeding ? "Seeding..." : "Load Demo Data"}
          </button>
          <Link
            href="/flow-builder"
            className="px-4 py-1.5 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-xs flex items-center gap-1.5 transition glow-discord"
          >
            <Sliders className="w-3.5 h-3.5" />
            Manage Flow
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#5865F2] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-400 font-mono">Loading telemetry metrics...</p>
        </div>
      ) : (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-[#313338] bg-[#2B2D31]/50 space-y-1">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">New Members</span>
              <p className="text-2xl font-bold text-white">{metrics?.new_members_count || 0}</p>
            </div>
            <div className="p-4 rounded-xl border border-[#313338] bg-[#2B2D31]/50 space-y-1">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Completion Rate</span>
              <p className="text-2xl font-bold text-emerald-400">
                {metrics?.completion_rate_percentage || 0}%
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#313338] bg-[#2B2D31]/50 space-y-1">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Incomplete Journeys</span>
              <p className="text-2xl font-bold text-amber-400">{metrics?.incomplete_count || 0}</p>
            </div>
            <div className="p-4 rounded-xl border border-[#313338] bg-[#2B2D31]/50 space-y-1">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Avg Completion Time</span>
              <p className="text-2xl font-bold text-zinc-200">
                {metrics?.average_completion_minutes || 0}m
              </p>
            </div>
          </div>

          {/* Recent Members Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#5865F2]" />
                Recent Member Journeys
              </h3>
              <Link href="/members" className="text-xs text-[#5865F2] hover:underline flex items-center gap-1">
                View all members <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="border border-[#313338] rounded-xl bg-[#2B2D31]/40 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1E1F22] border-b border-[#313338] text-zinc-400 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Joined At</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Completed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#313338]/60">
                  {metrics?.recent_members?.map((m) => (
                    <tr key={m.user_id} className="hover:bg-[#2B2D31]/80 transition">
                      <td className="py-3 px-4 font-semibold text-white">{m.username}</td>
                      <td className="py-3 px-4 text-zinc-400 font-mono">
                        {m.joined_at ? m.joined_at.substring(0, 16).replace("T", " ") : "Recent"}
                      </td>
                      <td className="py-3 px-4">
                        {m.status === "completed" ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px]">
                            Completed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px]">
                            In Progress
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 font-mono">
                        {m.completed_at ? m.completed_at.substring(0, 16).replace("T", " ") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
