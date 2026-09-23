import Link from "next/link";
import { Compass, Users, ShieldCheck, ArrowRight, Sparkles, CheckCircle2, Lock, Sliders, Bell } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="space-y-24 py-6">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-3xl mx-auto pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#5865F2]/40 bg-[#5865F2]/10 text-[#5865F2] text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Discord Journey Automation • Zero Fragile Workflows</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Turn new Discord joins into <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5865F2] via-indigo-400 to-cyan-400">
            active community members.
          </span>
        </h1>

        <p className="text-base text-zinc-300 max-w-2xl mx-auto leading-relaxed">
          Guide newcomers through personalized onboarding flows, collect preferences with native Discord components, assign verified roles, and unlock channels seamlessly.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold flex items-center justify-center gap-2 transition glow-discord"
          >
            Open Admin Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/flow-builder"
            className="w-full sm:w-auto px-6 py-3 rounded-lg border border-[#313338] bg-[#2B2D31] hover:bg-[#35373C] text-zinc-200 font-medium transition"
          >
            Live Flow Builder & Preview
          </Link>
        </div>
      </section>

      {/* Step Types Showcase */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">Deterministic Onboarding Steps</h2>
          <p className="text-xs text-zinc-400">Compact, battle-tested component primitives without fragile visual node trees.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl border border-[#313338] bg-[#2B2D31]/50 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#5865F2]/20 border border-[#5865F2]/30 flex items-center justify-center text-[#5865F2]">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-white text-sm">Dynamic Welcome Messages</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Personalize embeds with variable interpolation: <code>&#123;&#123;username&#125;&#125;</code>, <code>&#123;&#123;server_name&#125;&#125;</code>, and <code>&#123;&#123;member_count&#125;&#125;</code>.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-[#313338] bg-[#2B2D31]/50 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-white text-sm">Automated Role Mapping</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Map dropdown selections directly to Discord roles with automated permission verification and hierarchy safety checks.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-[#313338] bg-[#2B2D31]/50 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-white text-sm">Gentle Inactivity Reminders</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Non-intrusive reminder queue triggers DM follow-ups after 30m or 6h, capped at 2 reminders to respect members.
            </p>
          </div>
        </div>
      </section>

      {/* State Machine Highlight */}
      <section className="p-8 rounded-2xl border border-[#313338] bg-[#2B2D31]/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 text-xs text-[#5865F2] font-mono">
            <Lock className="w-4 h-4" />
            <span>Stateful Persistence Engine</span>
          </div>
          <h2 className="text-xl font-bold text-white">Survives Bot Restarts Seamlessly</h2>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Every step progression and preference selection is stored synchronously in your database. If the bot restarts or encounters connectivity interruptions, members resume exactly where they left off.
          </p>
        </div>
        <Link
          href="/flow-builder"
          className="px-6 py-3 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold transition shrink-0 shadow"
        >
          Explore Flow Builder
        </Link>
      </section>
    </div>
  );
}
