import { Compass } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-[#232428] bg-[#1E1F22] py-10 mt-20 text-xs text-zinc-500">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#5865F2]" />
          <span>GuildPilot — Discord Onboarding & Community Journey Platform.</span>
        </div>
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/Moeijiro/guildpilot"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition"
          >
            GitHub Repository
          </a>
          <span>MIT License © 2026</span>
        </div>
      </div>
    </footer>
  );
}
