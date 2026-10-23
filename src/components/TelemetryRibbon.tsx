import React, { useEffect, useState } from "react";
import { DisasterScenario } from "../data/graphData";
import { TemporalSlider } from "./TemporalSlider";
import { Radio, Database, Activity, RefreshCw } from "lucide-react";

interface TelemetryRibbonProps {
  scenarios: DisasterScenario[];
  activeScenario: DisasterScenario;
  onSelectScenario: (scenario: DisasterScenario) => void;
  nodeCount: number;
  relCount: number;
  timelineStep: number;
  onTimelineStepChange: (step: number) => void;
}

export const TelemetryRibbon: React.FC<TelemetryRibbonProps> = ({
  scenarios,
  activeScenario,
  onSelectScenario,
  nodeCount,
  relCount,
  timelineStep,
  onTimelineStepChange,
}) => {
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace("GMT", "UTC"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 flex flex-col">
      {/* Top Row: Mission Status, Scenario Selector & Graph Edge Stats */}
      <div className="px-6 py-2 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-300">
        {/* Left: Active Scenario & Mission Time */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 uppercase tracking-wider text-[11px]">DISASTER SCENARIO:</span>
            <select
              value={activeScenario.id}
              onChange={(e) => {
                const selected = scenarios.find((s) => s.id === e.target.value);
                if (selected) onSelectScenario(selected);
              }}
              className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-cyan-400 font-sans text-xs focus:outline-none focus:border-cyan-500 font-medium"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.type})
                </option>
              ))}
            </select>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-slate-400">
            <span className="text-slate-600">|</span>
            <Activity className="w-3.5 h-3.5 text-rose-400" />
            <span>STATUS:</span>
            <span className="text-rose-400 font-semibold uppercase">✖ Critical Propagation</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-slate-400">
            <span className="text-slate-600">|</span>
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>SPACE ASSETS:</span>
            <span className="text-cyan-300">{activeScenario.satelliteCovered}</span>
          </div>
        </div>

        {/* Right: Graph Metrics & UTC Clock */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-950/60 px-2.5 py-1 rounded border border-slate-800">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">ACTIVE GRAPH:</span>
            <span className="text-white font-bold tabular-nums">{nodeCount}</span>
            <span className="text-slate-500 text-[10px]">NODES</span>
            <span className="text-slate-700">/</span>
            <span className="text-white font-bold tabular-nums">{relCount}</span>
            <span className="text-slate-500 text-[10px]">EDGES</span>
          </div>

          <div className="text-slate-400 tabular-nums font-semibold hidden md:block">
            {utcTime || "UTC 00:00:00"}
          </div>
        </div>
      </div>

      {/* Bottom Row: Temporal Slider Component */}
      <TemporalSlider
        currentStep={timelineStep}
        onStepChange={onTimelineStepChange}
      />
    </div>
  );
};
