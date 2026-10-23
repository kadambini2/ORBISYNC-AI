import React, { useEffect, useState } from "react";
import { TIMELINE_STEPS, TimelineStep } from "../data/graphData";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Clock,
  Radio,
  Layers,
  ChevronRight
} from "lucide-react";

interface TemporalSliderProps {
  currentStep: number;
  onStepChange: (step: number) => void;
}

export const TemporalSlider: React.FC<TemporalSliderProps> = ({
  currentStep,
  onStepChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play timer loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      onStepChange(currentStep >= TIMELINE_STEPS.length - 1 ? 0 : currentStep + 1);
    }, 2800);
    return () => clearInterval(interval);
  }, [isPlaying, currentStep, onStepChange]);

  const activeStepData: TimelineStep =
    TIMELINE_STEPS[currentStep] || TIMELINE_STEPS[TIMELINE_STEPS.length - 1];

  return (
    <div className="w-full bg-slate-950/90 border-t border-slate-800/80 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
      {/* Left: Playback Controls & Timestamp Readout */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded p-1">
          <button
            onClick={() => onStepChange(Math.max(0, currentStep - 1))}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors"
            title="Previous Overpass"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-2 py-1 rounded font-sans font-semibold text-[11px] flex items-center gap-1.5 transition-colors ${
              isPlaying
                ? "bg-amber-500 text-slate-950"
                : "bg-cyan-500 hover:bg-cyan-400 text-slate-950"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Simulate Progression</span>
              </>
            )}
          </button>

          <button
            onClick={() =>
              onStepChange(Math.min(TIMELINE_STEPS.length - 1, currentStep + 1))
            }
            className="p-1 text-slate-400 hover:text-white rounded transition-colors"
            title="Next Overpass"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Current Time Step Badge */}
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-white font-bold tracking-tight">
            {activeStepData.label} ({activeStepData.utcTime})
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-cyan-300 font-sans text-[11px] hidden sm:inline max-w-sm truncate">
            {activeStepData.eventDescription}
          </span>
        </div>
      </div>

      {/* Center & Right: Timeline Slider & Step Markers */}
      <div className="flex items-center gap-4 flex-1 max-w-xl justify-end">
        <div className="flex-1 hidden md:block">
          <div className="relative flex items-center">
            {/* Range Track */}
            <input
              type="range"
              min={0}
              max={TIMELINE_STEPS.length - 1}
              step={1}
              value={currentStep}
              onChange={(e) => onStepChange(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
            />
          </div>

          {/* Step Ticks */}
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 select-none">
            {TIMELINE_STEPS.map((s) => (
              <button
                key={s.step}
                onClick={() => onStepChange(s.step)}
                className={`transition-colors hover:text-slate-300 ${
                  currentStep === s.step
                    ? "text-cyan-400 font-bold"
                    : currentStep > s.step
                    ? "text-slate-400"
                    : "text-slate-600"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Satellite Action */}
        <div className="text-[11px] text-slate-400 hidden lg:flex items-center gap-1.5 bg-slate-900/60 px-2.5 py-1 rounded border border-slate-800 shrink-0">
          <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span className="text-slate-300 truncate max-w-[200px]">
            {activeStepData.satelliteAction}
          </span>
        </div>
      </div>
    </div>
  );
};
