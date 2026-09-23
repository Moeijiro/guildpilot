import { PilotShell } from "@/components/pilot-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <PilotShell>{children}</PilotShell>;
}
