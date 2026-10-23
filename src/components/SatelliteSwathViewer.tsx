import React, { useState } from "react";
import { DisasterScenario } from "../data/graphData";
import {
  Satellite,
  Layers,
  Crosshair,
  Maximize,
  Sliders,
  Calendar,
  Compass,
  Radio,
  Eye,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface SatelliteSwathViewerProps {
  scenario: DisasterScenario;
}

export const SatelliteSwathViewer: React.FC<SatelliteSwathViewerProps> = ({ scenario }) => {
  const [activeLayer, setActiveLayer] = useState<"sar" | "optical" | "thermal">("sar");
  const [showInfraOverlay, setShowInfraOverlay] = useState(true);
  const [showHazardBoundary, setShowHazardBoundary] = useState(true);
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number; lat: string; lon: string } | null>(null);

  // Switch image based on scenario or active layer
  const imageSource =
    scenario.type === "Wildfire"
      ? "/src/assets/images/orbitgraph_wildfire_thermal_1792728326398.jpg"
      : activeLayer === "sar"
      ? "/src/assets/images/orbitgraph_sar_flood_radar_1792728326921.jpg"
      : "/src/assets/images/orbitgraph_satellite_earth_1792728324999.jpg";

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;

    // Simulate geographical bounding box coordinates
    const baseLat = scenario.type === "Flood" ? 16.75 : 39.7;
    const baseLon = scenario.type === "Flood" ? 96.2 : -121.6;

    const lat = (baseLat + (0.5 - yPct) * 0.4).toFixed(4);
    const lon = (baseLon + (xPct - 0.5) * 0.4).toFixed(4);

    setCursorCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      lat: `${lat}° ${Number(lat) >= 0 ? "N" : "S"}`,
      lon: `${lon}° ${Number(lon) >= 0 ? "E" : "W"}`,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Control & Telemetry Panel (1 col) */}
      <div className="lg:col-span-1 space-y-4">
        {/* Sensor Calibration Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Satellite className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white font-sans">
              Space Asset Calibration
            </h3>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">ACTIVE PAYLOAD:</span>
              <span className="text-cyan-300 font-semibold">{scenario.satelliteCovered}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">NADIR COORDS:</span>
              <span className="text-white tabular-nums">{scenario.coordinates}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">GROUND RES (GSD):</span>
              <span className="text-white tabular-nums">10.0 m / pixel</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">REVISIT CADENCE:</span>
              <span className="text-emerald-400 tabular-nums">12.4 Hours</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">AI CONFIDENCE:</span>
              <span className="text-cyan-400 font-bold tabular-nums">{scenario.stats.satelliteConfidence}</span>
            </div>
          </div>
        </div>

        {/* Remote Sensing Layer Filter Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Observation Channels
            </h4>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => setActiveLayer("sar")}
              className={`w-full text-left px-3 py-2 rounded text-xs font-medium transition-colors flex items-center justify-between ${
                activeLayer === "sar"
                  ? "bg-cyan-500/10 border border-cyan-500/40 text-cyan-300"
                  : "bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>SAR Interferometric Coherence</span>
              <Radio className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setActiveLayer("optical")}
              className={`w-full text-left px-3 py-2 rounded text-xs font-medium transition-colors flex items-center justify-between ${
                activeLayer === "optical"
                  ? "bg-cyan-500/10 border border-cyan-500/40 text-cyan-300"
                  : "bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>LEO Orbital RGB-NIR Swath</span>
              <Eye className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setActiveLayer("thermal")}
              className={`w-full text-left px-3 py-2 rounded text-xs font-medium transition-colors flex items-center justify-between ${
                activeLayer === "thermal"
                  ? "bg-cyan-500/10 border border-cyan-500/40 text-cyan-300"
                  : "bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>TIRS Thermal Radiance (VIIRS)</span>
              <AlertCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* GIS Toggle Checkboxes */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showInfraOverlay}
                onChange={(e) => setShowInfraOverlay(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0"
              />
              <span>Overlay Infrastructure Vector Nodes</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showHazardBoundary}
                onChange={(e) => setShowHazardBoundary(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-rose-500 focus:ring-0 focus:ring-offset-0"
              />
              <span>Overlay Hazard Impact Isolines</span>
            </label>
          </div>
        </div>

        {/* Hazard Summary KPI */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-xs space-y-2">
          <div className="text-slate-400 uppercase text-[10px] tracking-wider">OBSERVED EXTENT:</div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {scenario.stats.totalAreaSqKm} <span className="text-xs font-normal text-slate-400">km²</span>
          </div>
          <div className="text-slate-400 uppercase text-[10px] tracking-wider pt-1">POPULATION AT RISK:</div>
          <div className="text-xl font-bold text-rose-400 tabular-nums">
            {scenario.stats.popAtRisk.toLocaleString()} <span className="text-xs font-normal text-slate-400">citizens</span>
          </div>
        </div>
      </div>

      {/* Main Satellite Imagery & GIS Crosshair Stage (3 cols) */}
      <div className="lg:col-span-3">
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCursorCoords(null)}
          className="relative w-full h-[620px] bg-slate-950 rounded-lg border border-slate-800 overflow-hidden cursor-crosshair group shadow-xl"
        >
          {/* Real Generated Satellite Image */}
          <img
            src={imageSource}
            alt={scenario.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-opacity duration-300"
          />

          {/* HUD Top Corner: Acquisition Telemetry */}
          <div className="absolute top-4 left-4 z-10 bg-slate-950/80 backdrop-blur border border-slate-800/90 rounded px-3 py-1.5 font-mono text-xs text-cyan-400 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="font-semibold">{scenario.satelliteCovered}</span>
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">CALIBRATED SURFACE PROJECTION</span>
          </div>

          {/* HUD Top Right: Coordinate Readout */}
          <div className="absolute top-4 right-4 z-10 bg-slate-950/80 backdrop-blur border border-slate-800/90 rounded px-3 py-1.5 font-mono text-xs text-slate-300 flex items-center gap-2">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {cursorCoords ? `${cursorCoords.lat}, ${cursorCoords.lon}` : scenario.coordinates}
            </span>
          </div>

          {/* Simulated Vector Infrastructure Markers (When checkbox enabled) */}
          {showInfraOverlay && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Marker 1: Substation Beta */}
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 bg-slate-950/90 border border-amber-500/60 rounded px-2 py-1 shadow-lg"
                style={{ top: "45%", left: "54%" }}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-[10px] font-mono font-semibold text-amber-300 whitespace-nowrap">
                  Substation Beta (Imminent Breach)
                </span>
              </div>

              {/* Marker 2: Trauma Center */}
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 bg-slate-950/90 border border-cyan-500/60 rounded px-2 py-1 shadow-lg"
                style={{ top: "32%", left: "68%" }}
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-[10px] font-mono font-semibold text-cyan-300 whitespace-nowrap">
                  St. Jude Trauma Hospital
                </span>
              </div>

              {/* Marker 3: North Causeway Bridge */}
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 bg-slate-950/90 border border-rose-500/60 rounded px-2 py-1 shadow-lg"
                style={{ top: "62%", left: "42%" }}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-[10px] font-mono font-semibold text-rose-300 whitespace-nowrap">
                  North Causeway Lifeline
                </span>
              </div>
            </div>
          )}

          {/* Hazard Boundary Shading (When checkbox enabled) */}
          {showHazardBoundary && (
            <div className="absolute inset-0 pointer-events-none border-4 border-rose-500/30 rounded-lg animate-pulse" />
          )}

          {/* Bottom HUD: Compass & Grid Scale */}
          <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between text-xs font-mono text-slate-400 bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded border border-slate-800">
            <div className="flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>BEARING: 000° TRUE NORTH</span>
              <span className="text-slate-600">|</span>
              <span>SCALE: 1:50,000 (1cm = 500m)</span>
            </div>
            <div className="text-cyan-400 font-semibold">
              KNOWLEDGE GRAPH NODE SYNC: ACTIVE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
