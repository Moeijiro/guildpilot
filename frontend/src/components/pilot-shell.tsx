"use client";

import { LayoutDashboard, Route, Users } from "lucide-react";
import { Logo } from "@/components/brand";
import { AppShell, ShellAccount, type NavItem } from "@/components/kit/shell";
import { DEMO_GUILD_NAME } from "@/lib/api";

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/flow-builder", label: "Onboarding flow", icon: Route },
  { href: "/members", label: "Members", icon: Users },
];

export function PilotShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell brand={<Logo />} items={NAV}
      footer={<ShellAccount name="Server admin" detail={DEMO_GUILD_NAME} note="Demo server — members are generated; no Discord account is connected." />}>
      {children}
    </AppShell>
  );
}
