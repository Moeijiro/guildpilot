"use client";

import { OnboardingStep } from "@/lib/api";
import { Check, Compass, Shield, Sparkles } from "lucide-react";

interface DiscordPreviewProps {
  step: OnboardingStep | null;
  serverName?: string;
  username?: string;
}

export default function DiscordPreview({
  step,
  serverName = "Developer Nexus",
  username = "Moeijiro",
}: DiscordPreviewProps) {
  if (!step) {
    return (
      <div className="bg-[#2B2D31] border border-[#1E1F22] rounded-xl p-8 text-center text-xs text-zinc-400 font-mono">
        Select a step from the list to preview the Discord interaction.
      </div>
    );
  }

  // Interpolate variables
  const title = step.title
    .replace("{{server_name}}", serverName)
    .replace("{{username}}", username)
    .replace("{{member_count}}", "1,248");

  const description = step.description
    .replace("{{server_name}}", serverName)
    .replace("{{username}}", username)
    .replace("{{member_count}}", "1,248");

  return (
    <div className="bg-[#313338] border border-[#232428] rounded-2xl p-5 shadow-2xl space-y-4 max-w-xl mx-auto">
      {/* Bot Message Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center text-white shrink-0 shadow">
          <Compass className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-white">GuildPilot</span>
            <span className="px-1.5 py-0.5 rounded bg-[#5865F2] text-[10px] font-bold text-white uppercase tracking-wider">
              APP
            </span>
            <span className="text-[11px] text-zinc-400">Today at 12:45 PM</span>
          </div>
          <p className="text-[11px] text-zinc-400 font-mono italic">
            Only you can see this message • Dismiss message
          </p>
        </div>
      </div>

      {/* Discord Embed */}
      <div className="ml-13 pl-4 border-l-4 border-[#5865F2] bg-[#2B2D31] rounded-r-lg p-4 space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
          <Shield className="w-3.5 h-3.5 text-[#5865F2]" />
          <span>Step {step.step_order} of 5</span>
        </div>
        <h4 className="text-base font-bold text-white leading-snug">{title}</h4>
        <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">{description}</p>
      </div>

      {/* Interactive Components Section */}
      <div className="ml-13 space-y-2 pt-1">
        {step.step_type in ["button_choice", "role_selection"] && (
          <div className="flex flex-wrap gap-2">
            {step.options.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className="px-3.5 py-2 rounded bg-[#4E5058] hover:bg-[#6D6F78] text-white text-xs font-medium flex items-center gap-1.5 transition shadow"
              >
                {opt.emoji && <span>{opt.emoji}</span>}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        )}

        {step.step_type === "select_menu" && (
          <div className="w-full bg-[#1E1F22] border border-[#2B2D31] rounded px-3 py-2 text-xs text-zinc-300 flex items-center justify-between cursor-pointer">
            <span>Choose your preferences...</span>
            <span className="text-zinc-500">▼</span>
          </div>
        )}

        {step.step_type === "rules_confirm" && (
          <button
            type="button"
            className="px-4 py-2 rounded bg-[#248046] hover:bg-[#1A6334] text-white text-xs font-semibold flex items-center gap-1.5 transition shadow"
          >
            <Check className="w-4 h-4" />
            I Agree & Accept Server Rules
          </button>
        )}

        {step.step_type === "checklist_item" && (
          <div className="space-y-2">
            <button
              type="button"
              className="px-4 py-2 rounded bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold flex items-center gap-1.5 transition shadow"
            >
              <Check className="w-4 h-4" />
              Mark Item Completed
            </button>
          </div>
        )}

        {step.step_type === "welcome_message" && (
          <button
            type="button"
            className="px-4 py-2 rounded bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold flex items-center gap-1.5 transition shadow"
          >
            <Sparkles className="w-4 h-4" />
            Begin Onboarding
          </button>
        )}
      </div>
    </div>
  );
}
