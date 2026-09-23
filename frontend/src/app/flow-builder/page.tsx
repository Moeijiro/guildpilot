"use client";

import { useEffect, useState } from "react";
import { 
  Sliders, Plus, ArrowUp, ArrowDown, Trash2, Eye, 
  Sparkles, Check, ChevronRight, Layers, HelpCircle
} from "lucide-react";
import { api, OnboardingFlow, OnboardingStep } from "@/lib/api";
import DiscordPreview from "@/components/DiscordPreview";

export default function FlowBuilderPage() {
  const [flow, setFlow] = useState<OnboardingFlow | null>(null);
  const [selectedStep, setSelectedStep] = useState<OnboardingStep | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("button_choice");

  useEffect(() => {
    loadFlow();
  }, []);

  async function loadFlow() {
    setLoading(true);
    try {
      const data = await api.getFlow();
      setFlow(data);
      if (data.steps.length > 0) {
        setSelectedStep(data.steps[0]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load flow.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteStep(stepId: number) {
    if (!confirm("Are you sure you want to delete this step?")) return;
    try {
      await api.deleteStep("demo-guild-777", stepId);
      await loadFlow();
    } catch (err) {
      alert("Failed to delete step.");
    }
  }

  async function handleMove(index: number, direction: "up" | "down") {
    if (!flow) return;
    const steps = [...flow.steps];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= steps.length) return;

    // Swap
    const temp = steps[index];
    steps[index] = steps[targetIdx];
    steps[targetIdx] = temp;

    const newOrderIds = steps.map((s) => s.id);
    try {
      await api.reorderSteps("demo-guild-777", newOrderIds);
      await loadFlow();
    } catch (err) {
      alert("Failed to reorder steps.");
    }
  }

  async function handleAddStep(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    try {
      await api.addStep("demo-guild-777", {
        title: newTitle.trim(),
        description: newDesc.trim(),
        step_type: newType,
        options: newType === "button_choice" ? [
          { key: "opt_1", label: "Option A", emoji: "🔹" },
          { key: "opt_2", label: "Option B", emoji: "🔸" }
        ] : []
      });
      setShowAddModal(false);
      setNewTitle("");
      setNewDesc("");
      await loadFlow();
    } catch (err) {
      alert("Failed to add step.");
    }
  }

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232428] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-[#5865F2]" />
            Onboarding Flow Builder
          </h1>
          <p className="text-xs text-zinc-400">
            Configure deterministic member steps, test Discord components, and verify role allocations.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-xs flex items-center gap-1.5 transition glow-discord self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Step
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-zinc-400 font-mono">Loading flow structure...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Step List (Left Column) */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono px-1">
              <span>CONFIGURED STEPS ({flow?.steps.length || 0})</span>
              <span>CLICK TO PREVIEW</span>
            </div>

            {flow?.steps.map((step, idx) => {
              const isSelected = selectedStep?.id === step.id;
              return (
                <div
                  key={step.id}
                  onClick={() => setSelectedStep(step)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "border-[#5865F2] bg-[#2B2D31] shadow-lg"
                      : "border-[#313338] bg-[#2B2D31]/40 hover:border-[#3F4147]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-[#1E1F22] border border-[#313338] flex items-center justify-center text-xs font-bold text-[#5865F2]">
                      {idx + 1}
                    </span>
                    <div className="space-y-0.5">
                      <h4 className="font-semibold text-sm text-white">{step.title}</h4>
                      <p className="text-[11px] text-zinc-400 font-mono uppercase">
                        {step.step_type.replace("_", " ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleMove(idx, "up")}
                      disabled={idx === 0}
                      className="p-1.5 rounded hover:bg-[#35373C] text-zinc-400 hover:text-white disabled:opacity-30 transition"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(idx, "down")}
                      disabled={idx === (flow?.steps.length || 1) - 1}
                      className="p-1.5 rounded hover:bg-[#35373C] text-zinc-400 hover:text-white disabled:opacity-30 transition"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteStep(step.id)}
                      className="p-1.5 rounded hover:bg-rose-950/40 text-zinc-500 hover:text-rose-400 transition"
                      title="Delete Step"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Discord Live Preview Panel (Right Column) */}
          <div className="lg:col-span-6 space-y-3 sticky top-24">
            <div className="text-xs text-zinc-400 font-mono px-1 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#5865F2]" />
              <span>DISCORD INTERACTION PREVIEW</span>
            </div>
            <DiscordPreview step={selectedStep} />
          </div>
        </div>
      )}

      {/* Add Step Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddStep} className="bg-[#2B2D31] border border-[#313338] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add Onboarding Step</h3>
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Step Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full bg-[#1E1F22] border border-[#313338] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#5865F2]"
              >
                <option value="welcome_message">Welcome Message</option>
                <option value="button_choice">Button Choice (Single Option)</option>
                <option value="select_menu">Select Menu (Dropdown)</option>
                <option value="rules_confirm">Rules Agreement Confirmation</option>
                <option value="checklist_item">Checklist Milestone</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Step Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Choose Your Primary Tech Stack"
                required
                className="w-full bg-[#1E1F22] border border-[#313338] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#5865F2]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Step Description / Embed Text</label>
              <textarea
                rows={3}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Supports {{username}}, {{server_name}}, {{member_count}}"
                required
                className="w-full bg-[#1E1F22] border border-[#313338] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#5865F2]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg bg-[#313338] text-xs text-zinc-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold"
              >
                Create Step
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
