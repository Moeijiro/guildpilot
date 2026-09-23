"use client";

import Link from "next/link";
import { Compass, Users, GitFork, LayoutDashboard, Sliders, Shield } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="border-b border-[#232428] bg-[#1E1F22]/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center group-hover:border-[#5865F2] transition">
            <Compass className="w-4 h-4 text-[#5865F2]" />
          </div>
          <span className="font-bold tracking-tight text-white flex items-center gap-1.5">
            GuildPilot
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#5865F2] font-mono">
              Onboarding
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-4 text-xs font-medium">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#5865F2] hover:bg-[#4752C4] text-white transition font-semibold"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <Link
            href="/flow-builder"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-zinc-300 hover:text-white transition"
          >
            <Sliders className="w-3.5 h-3.5" />
            Flow Builder
          </Link>
          <Link
            href="/members"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-zinc-300 hover:text-white transition"
          >
            <Users className="w-3.5 h-3.5" />
            Members
          </Link>
        </div>
      </div>
    </nav>
  );
}
