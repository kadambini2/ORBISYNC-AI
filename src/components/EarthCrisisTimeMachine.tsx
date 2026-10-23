import React, { useState, useRef } from "react";
import { DisasterScenario } from "../data/graphData";
import {
  Clock,
  Layers,
  Sliders,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Droplets,
  TreePine,
  Activity,
  Maximize2,
  Calendar,
  Satellite,
  Compass
} from "lucide-react";

interface EarthCrisisTimeMachineProps {
  scenario: DisasterScenario;
}

export const EarthCrisisTimeMachine: React.FC<EarthCrisisTimeMachineProps> = ({ scenario }) => {
  // Slider position from 0 to 100%
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Time Phase Selector
  const [activePhase, setActivePhase] = useState<"pre" | "peak" | "post">("peak");

  // Satellite Images
  const preImage =
    scenario.type === "Wildfire"
      ? "/src/assets/images/orbitgraph_satellite_earth_1792728324999.jpg"
      : "/src/assets/images/orbisync_pre_disaster_baseline_1792729628486.jpg";

  const crisisImage =
    scenario.type === "Wildfire"
      ? "/src/assets/images/orbitgraph_wildfire_thermal_1792728326398.jpg"
      : "/src/assets/images/orbitgraph_sar_flood_radar_1792728326921.jpg";

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updateSlider(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateSlider(e.clientX);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const updateSlider = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Explainer */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider">
              <Clock className="w-4 h-4" />
              <span>Earth Crisis Time Machine · Multi-Temporal Earth Observation</span>
            </div>
            <h3 className="text-base font-bold text-white font-sans">
              Historical Satellite Delta Analysis (Before vs. During Disaster)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
              Drag the interactive split slider left and right to inspect the exact environmental transformations between pre-disaster true-color optical observations and acute SAR radar coherence loss.
            </p>
          </div>

          {/* Phase Filter Controls */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800 font-mono text-xs">
            <button
              onClick={() => {
                setActivePhase("pre");
                setSliderPos(90);
              }}
              className={`px-3 py-1.5 rounded font-semibold transition-colors ${
                activePhase === "pre"
                  ? "bg-slate-800 text-emerald-400 border border-emerald-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Pre-Disaster Baseline
            </button>
            <button
              onClick={() => {
                setActivePhase("peak");
                setSliderPos(50);
              }}
              className={`px-3 py-1.5 rounded font-semibold transition-colors ${
                activePhase === "peak"
                  ? "bg-slate-800 text-rose-400 border border-rose-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Acute Crisis Peak
            </button>
            <button
              onClick={() => {
                setActivePhase("post");
                setSliderPos(15);
              }}
              className={`px-3 py-1.5 rounded font-semibold transition-colors ${
                activePhase === "post"
                  ? "bg-slate-800 text-amber-400 border border-amber-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Post-Crisis Recovery
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Environmental Delta Telemetry (1 col) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4 font-mono text-xs">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h4 className="font-semibold text-white uppercase tracking-wider text-[11px]">
                Space Telemetry Deltas
              </h4>
            </div>

            {/* Metric 1: Water Inundation Extent */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                <span className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-400" />
                  <span>WATER SURFACE EXTENT</span>
                </span>
                <span className="text-rose-400 font-bold">+1,150%</span>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-slate-400 line-through tabular-nums">12.4 km²</span>
                <span className="text-xl font-bold text-white tabular-nums">155.0 km²</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Verified via Sentinel-1 SAR interferometric coherence depletion.
              </p>
            </div>

            {/* Metric 2: Vegetation Canopy Loss */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                <span className="flex items-center gap-1.5">
                  <TreePine className="w-3.5 h-3.5 text-emerald-400" />
                  <span>VEGETATION INDEX (NDVI)</span>
                </span>
                <span className="text-amber-400 font-bold">-71.6%</span>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-slate-400 line-through tabular-nums">0.74 (Healthy)</span>
                <span className="text-xl font-bold text-amber-300 tabular-nums">0.21 (Submerged)</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Calculated from Sentinel-2 MSI B08 (NIR) & B04 (Red) reflectance.
              </p>
            </div>

            {/* Metric 3: Soil Saturation */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                <span>SOIL SATURATION INDEX</span>
                <span className="text-rose-400 font-bold">+60.2%</span>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-slate-400 line-through tabular-nums">38.0%</span>
                <span className="text-xl font-bold text-rose-400 tabular-nums">98.2% Sat</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Alluvial delta terrain completely saturated, preventing drainage.
              </p>
            </div>

            {/* Metric 4: Infrastructure Impact Count */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                <span>CRITICAL ASSETS INUNDATED</span>
                <span className="text-rose-400 font-bold">5 Facilities</span>
              </div>
              <div className="text-base font-bold text-white tabular-nums pt-1">
                1 Substation · 1 Hospital · 1 Bridge
              </div>
            </div>
          </div>

          {/* Neo4j Correlation Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-xs space-y-2">
            <span className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">
              KNOWLEDGE GRAPH GROUNDING
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              In ORBISYNC, these spatial deltas are mapped as dynamic properties on <code className="text-cyan-300">:Observation</code> nodes, creating historical time-series edges to ground-truth infrastructure.
            </p>
          </div>
        </div>

        {/* Right Stage: Interactive Split Comparison Slider (3 cols) */}
        <div className="lg:col-span-3">
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative w-full h-[620px] bg-slate-950 rounded-lg border border-slate-800 overflow-hidden select-none cursor-ew-resize group shadow-2xl"
          >
            {/* Background Image: Acute Crisis Image */}
            <img
              src={crisisImage}
              alt="Acute Crisis Satellite Radar"
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />

            {/* Foreground Clipped Image: Pre-Disaster Baseline */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={preImage}
                alt="Pre-Disaster Satellite Baseline"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ width: containerRef.current?.clientWidth || "100%", maxWidth: "none" }}
                draggable={false}
              />

              {/* Left Overlay Label */}
              <div className="absolute top-4 left-4 z-10 bg-slate-950/85 backdrop-blur border border-emerald-500/60 rounded px-3 py-1.5 font-mono text-xs text-emerald-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-semibold">BEFORE: Historical Baseline (Sentinel-2 MSI)</span>
              </div>
            </div>

            {/* Right Overlay Label */}
            <div className="absolute top-4 right-4 z-10 bg-slate-950/85 backdrop-blur border border-rose-500/60 rounded px-3 py-1.5 font-mono text-xs text-rose-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              <span className="font-semibold">DURING: Acute Crisis (Sentinel-1 SAR Radar)</span>
            </div>

            {/* Vertical Divider Line with Grab Handle */}
            <div
              className="absolute top-0 bottom-0 z-20 w-1 bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-950 border-2 border-cyan-400 text-cyan-400 flex items-center justify-center shadow-xl cursor-ew-resize">
                <Sliders className="w-4 h-4" />
              </div>
            </div>

            {/* Bottom HUD Bar */}
            <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between text-xs font-mono text-slate-300 bg-slate-950/85 backdrop-blur px-4 py-2 rounded border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-cyan-400 font-semibold">INTERACTIVE SPLIT:</span>
                <span>Drag divider horizontally to inspect historical change</span>
              </div>
              <div className="tabular-nums font-bold text-cyan-300">
                Split: {Math.round(sliderPos)}% Before / {Math.round(100 - sliderPos)}% During
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
