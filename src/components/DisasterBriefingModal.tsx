import React, { useState, useEffect } from "react";
import { DisasterScenario } from "../data/graphData";
import {
  ShieldAlert,
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Copy,
  Download,
  Clock
} from "lucide-react";

interface DisasterBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: DisasterScenario;
}

interface SitrepData {
  summary: string;
  criticalRisks: string[];
  immediateActions: string[];
  satelliteTaskingRecommendation: string;
}

export const DisasterBriefingModal: React.FC<DisasterBriefingModalProps> = ({
  isOpen,
  onClose,
  scenario,
}) => {
  const [loading, setLoading] = useState(false);
  const [sitrep, setSitrep] = useState<SitrepData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const generateSitrep = async () => {
      setLoading(true);
      try {
        const resp = await fetch("/api/ai/disaster-briefing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scenarioName: scenario.name,
            activeHazards: scenario.nodes.filter((n) => n.label === "HazardEvent"),
            affectedInfrastructure: scenario.nodes.filter((n) => n.label === "Infrastructure"),
            graphMetrics: scenario.stats,
          }),
        });

        const data = await resp.json();
        setSitrep(data);
      } catch (err) {
        console.error("Sitrep generation error:", err);
      } finally {
        setLoading(false);
      }
    };

    generateSitrep();
  }, [isOpen, scenario]);

  if (!isOpen) return null;

  const handleCopyReport = () => {
    if (!sitrep) return;
    const text = `ORBITGRAPH AI — DISASTER INTELLIGENCE BRIEFING (SITREP)
Scenario: ${scenario.name}
Coordinates: ${scenario.coordinates}
Satellite Sensors: ${scenario.satelliteCovered}

EXECUTIVE SUMMARY:
${sitrep.summary}

CRITICAL CASCADE RISKS:
${sitrep.criticalRisks.map((r, i) => `${i + 1}. ${r}`).join("\n")}

IMMEDIATE TACTICAL ACTIONS:
${sitrep.immediateActions.map((a, i) => `[ ] ${a}`).join("\n")}

SATELLITE TASKING RECOMMENDATION:
${sitrep.satelliteTaskingRecommendation}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden font-sans text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                AI Crisis Intelligence Sitrep (UN-SPIDER Standard)
              </span>
              <h3 className="text-sm font-bold text-white leading-tight">
                {scenario.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <div className="text-sm font-semibold text-white">
                Synthesizing Space Telemetry & Graph Cascade Paths...
              </div>
              <p className="text-slate-400 max-w-md mx-auto text-xs">
                Querying Neo4j dependency trees with Gemini 3.8 Flash to evaluate infrastructure failure probability.
              </p>
            </div>
          ) : sitrep ? (
            <>
              {/* Executive Summary */}
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
                  01. EXECUTIVE SITUATION SUMMARY
                </span>
                <p className="mt-1.5 text-slate-200 text-xs leading-relaxed bg-slate-950/60 border border-slate-800/80 p-3.5 rounded">
                  {sitrep.summary}
                </p>
              </div>

              {/* Critical Cascade Risks */}
              <div>
                <span className="text-[10px] font-mono uppercase text-rose-400 font-semibold tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>02. GRAPH-DERIVED CASCADE VULNERABILITIES</span>
                </span>
                <div className="mt-1.5 space-y-1.5">
                  {sitrep.criticalRisks.map((risk, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-950/70 border border-rose-950/60 rounded text-slate-300 flex items-start gap-2.5"
                    >
                      <span className="w-4 h-4 rounded bg-rose-500/20 text-rose-400 font-mono text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{risk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Immediate Tactical Actions */}
              <div>
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>03. PRIORITY EMERGENCY ACTIONS</span>
                </span>
                <div className="mt-1.5 space-y-1.5">
                  {sitrep.immediateActions.map((action, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-950/70 border border-emerald-950/60 rounded text-slate-200 flex items-start gap-2.5"
                    >
                      <div className="w-4 h-4 rounded border border-emerald-500/50 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">
                        ✓
                      </div>
                      <span className="leading-snug">{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Satellite Tasking Recommendation */}
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/60 rounded space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[11px] font-semibold">
                  <Radio className="w-3.5 h-3.5" />
                  <span>04. SPACE ASSET TASKING ADVISORY</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {sitrep.satelliteTaskingRecommendation}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-400">
              Failed to load sitrep briefing. Please retry.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Classification: UN-SPIDER Rapid Action</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              disabled={!sitrep}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded transition-colors flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? "Copied SITREP" : "Copy Full SITREP"}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
