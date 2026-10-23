import React from "react";
import {
  Sparkles,
  Database,
  Satellite,
  Layers,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  Network,
  Cpu,
  FileCheck
} from "lucide-react";

export const HackathonInnovationDossier: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Hero Pitch Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 rounded-xl p-8 relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-400 font-mono text-xs font-semibold">
            <Award className="w-3.5 h-3.5" />
            <span>ORBISYNC · HACKATHON WINNER BLUEPRINT · SPACE TECH & DISASTER RESILIENCE</span>
          </div>

          <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-sans">
            ORBISYNC — Connect Space. Decode Earth. Protect Tomorrow.
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
            Earth observation satellites generate terabytes of daily radar, multispectral, and thermal imagery. Yet during hurricanes, wildfires, and floods, emergency planners struggle to connect space data with affected villages, roads, and hospitals. <strong className="text-white">ORBISYNC</strong> transforms fragmented space observations into an actionable, connected <strong className="text-cyan-400">Neo4j Knowledge Graph</strong>.
          </p>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none bg-gradient-to-l from-cyan-500 to-transparent" />
      </div>

      {/* 3 Pillars of Innovation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Network className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">01. Relational SQL vs. Neo4j Graph</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            In relational databases, evaluating a 4-hop cascade failure (Hazard → Region → Substation → Hospital → Vulnerable Ward) requires 4 nested recursive SQL JOINs that explode with millions of rows. In Neo4j, native index-free adjacency hops pointers in <strong className="text-slate-200">sub-millisecond O(1) time</strong>.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">02. Unifying Scattered Space Data</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            SAR radar coherence loss (Sentinel-1), thermal radiance hotspots (Landsat/VIIRS), and optical RGB water indices (Sentinel-2) are normalized into standardized <code className="text-cyan-300 font-mono">:Observation</code> nodes with explicit confidence and sensor provenance lineages.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">03. GraphRAG & AI Decision Copilot</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Natural language queries from incident commanders are translated directly to Cypher queries by Gemini 3.8 Flash, preventing LLM hallucinations by grounding answers directly in verified topological paths and real graph node properties.
          </p>
        </div>
      </div>

      {/* Graph Data Model Blueprint (LPG Architecture) */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Database className="w-4 h-4 text-cyan-400" />
          <h3 className="text-base font-bold text-white">
            Neo4j Graph Data Model Schema (Labeled Property Graph)
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          {/* Node Entities */}
          <div className="space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              PRIMARY NODE LABELS & PROPERTIES:
            </span>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                <span className="text-cyan-400 font-bold">:Satellite</span>
                <span className="text-slate-400"> (name, sensorType, orbitAltitudeKm, resolutionM, revisitHours)</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                <span className="text-sky-400 font-bold">:Observation</span>
                <span className="text-slate-400"> (band, confidence, waterExtentSqKm, thermalRadianceMw, detectionUtc)</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                <span className="text-rose-400 font-bold">:HazardEvent</span>
                <span className="text-slate-400"> (name, type, severity, rateOfRiseCmHr, etaHours, status)</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                <span className="text-emerald-400 font-bold">:GeographicEntity</span>
                <span className="text-slate-400"> (name, terrain, elevationM, coordinates, population)</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                <span className="text-amber-400 font-bold">:Infrastructure</span>
                <span className="text-slate-400"> (name, category, criticality, capacity, backupFuelHours, status)</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                <span className="text-purple-400 font-bold">:VulnerablePopulation</span>
                <span className="text-slate-400"> (name, size, mobilityNeeds, evacuationProgress)</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                <span className="text-teal-400 font-bold">:SafeZone</span>
                <span className="text-slate-400"> (name, capacity, currentOccupancy, helipad, elevationM)</span>
              </div>
            </div>
          </div>

          {/* Relationship Types */}
          <div className="space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              RELATIONSHIP TOPOLOGY (EDGES):
            </span>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded space-y-2.5 font-mono text-[11px] text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">:Satellite</span>
                <span className="text-slate-500">-[:CAPTURED]-&gt;</span>
                <span className="text-sky-400">:Observation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sky-400">:Observation</span>
                <span className="text-slate-500">-[:DETECTS]-&gt;</span>
                <span className="text-rose-400">:HazardEvent</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-rose-400">:HazardEvent</span>
                <span className="text-slate-500">-[:IMPACTS]-&gt;</span>
                <span className="text-emerald-400">:GeographicEntity</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">:GeographicEntity</span>
                <span className="text-slate-500">-[:CONTAINS]-&gt;</span>
                <span className="text-amber-400">:Infrastructure</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400">:Infrastructure</span>
                <span className="text-amber-400 font-semibold">-[:FEEDS_POWER_TO]-&gt;</span>
                <span className="text-amber-400">:Infrastructure</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400">:Infrastructure</span>
                <span className="text-blue-400 font-semibold">-[:SUPPLIES_WATER_TO]-&gt;</span>
                <span className="text-amber-400">:Infrastructure</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400">:Infrastructure</span>
                <span className="text-purple-400 font-semibold">-[:SERVES]-&gt;</span>
                <span className="text-purple-400">:VulnerablePopulation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400">:Infrastructure</span>
                <span className="text-teal-400 font-semibold">-[:EVACUATION_ROUTE_TO]-&gt;</span>
                <span className="text-teal-400">:SafeZone</span>
              </div>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded text-slate-400 text-xs leading-relaxed">
              <strong className="text-slate-200">The Power of Graph Traversal:</strong> By combining spatial relationships (<code className="text-emerald-300">:CONTAINS</code>) with utility relationships (<code className="text-amber-300">:FEEDS_POWER_TO</code>), ORBISYNC answers critical questions that are impossible to query in GIS shapefiles alone.
            </div>
          </div>
        </div>
      </div>

      {/* 8 WOW Features Showcase for Hackathon Judges */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              ORBISYNC — 8 WOW Features Built for Hackathon Excellence
            </h3>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 font-semibold bg-cyan-950/60 border border-cyan-800/80 px-2.5 py-0.5 rounded">
            JUDGES GUIDE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1">
            <div className="font-bold text-cyan-300 font-mono text-[11px]">01. Earth Crisis Time Machine</div>
            <p className="text-slate-400 text-[11px]">
              Interactive split comparison slider letting judges inspect pre-disaster baseline true-color imagery against acute SAR radar inundation swaths with live NDVI/NDWI deltas.
            </p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1">
            <div className="font-bold text-cyan-300 font-mono text-[11px]">02. Recursive Cascade Failure Simulation</div>
            <p className="text-slate-400 text-[11px]">
              Breaching a power substation triggers recursive multi-hop graph reachability, evaluating hospital ICU diesel fuel countdowns and unpowered water filtration pumps in real-time.
            </p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1">
            <div className="font-bold text-cyan-300 font-mono text-[11px]">03. High-Resolution Graph Export (PNG / JSON)</div>
            <p className="text-slate-400 text-[11px]">
              1-click export of the active filtered graph at 2x Retina DPI with tactical classification watermarks, plus raw JSON exports for offline disaster incident reporting.
            </p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1">
            <div className="font-bold text-cyan-300 font-mono text-[11px]">04. Natural Language to Cypher Copilot</div>
            <p className="text-slate-400 text-[11px]">
              Powered by Gemini 3.8 Flash, incident commanders can ask plain English questions to automatically generate, explain, and execute Cypher queries on the knowledge graph.
            </p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1">
            <div className="font-bold text-cyan-300 font-mono text-[11px]">05. PageRank Criticality Ranking</div>
            <p className="text-slate-400 text-[11px]">
              Calculates graph centrality across all municipal infrastructure to highlight the highest-risk single point of failure before floodwaters arrive.
            </p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1">
            <div className="font-bold text-cyan-300 font-mono text-[11px]">06. Multi-Satellite Sensor Provenance Lineage</div>
            <p className="text-slate-400 text-[11px]">
              Tracks exact orbital passes, interferometric SAR coherence loss, and thermal radiance thresholds across Sentinel-1, Sentinel-2, Landsat-9, and PlanetScope.
            </p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1">
            <div className="font-bold text-cyan-300 font-mono text-[11px]">07. Temporal Satellite Overpass Slider</div>
            <p className="text-slate-400 text-[11px]">
              Scrub backwards and forwards across satellite overpasses (T-18h to T-0h Live) to see graph entities and failure ripples dynamically emerge on the canvas.
            </p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1">
            <div className="font-bold text-cyan-300 font-mono text-[11px]">08. Neo4j Bolt Connection Manager & Seed Generator</div>
            <p className="text-slate-400 text-[11px]">
              Full support for connecting to Neo4j AuraDB (Cloud), local Docker containers, or the native in-memory engine, plus 1-click Cypher seed generation.
            </p>
          </div>
        </div>
      </div>

      {/* Target Beneficiaries & Impact */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-cyan-400">
          Target Global Stakeholders & Real-World Deployments
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1.5">
            <h4 className="font-bold text-white">UN-SPIDER & Sentinel Asia</h4>
            <p className="text-slate-400">
              Automates international space charter tasking by immediately calculating satellite revisit gaps over unconfirmed hazard frontiers.
            </p>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1.5">
            <h4 className="font-bold text-white">Emergency Response Agencies (FEMA)</h4>
            <p className="text-slate-400">
              Proactively relocates vulnerable dialysis patients and non-ambulatory elderly before grid failure severs life support systems.
            </p>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1.5">
            <h4 className="font-bold text-white">Municipal Utility Operators</h4>
            <p className="text-slate-400">
              Simulates load re-routing through auxiliary interties before floodwater overtops substation protection berms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
