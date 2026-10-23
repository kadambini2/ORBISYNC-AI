import React, { useState } from "react";
import { GraphNode, GraphRelationship } from "../data/graphData";
import { CypherEngine, CascadeSimulationResult } from "../services/cypherEngine";
import {
  AlertTriangle,
  Play,
  ZapOff,
  Flame,
  Droplets,
  Activity,
  ArrowRight,
  ShieldAlert,
  Clock,
  RotateCcw
} from "lucide-react";

interface CascadeSimulatorProps {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  onHighlightSubgraph?: (nodeIds: string[], relIds: string[]) => void;
  onNavigateToGraph?: () => void;
}

export const CascadeSimulator: React.FC<CascadeSimulatorProps> = ({
  nodes,
  relationships,
  onHighlightSubgraph,
  onNavigateToGraph,
}) => {
  const cypherEngine = new CypherEngine(nodes, relationships);

  // Available trigger nodes (power substations, bridges, treatment plants)
  const infrastructureNodes = nodes.filter((n) => n.label === "Infrastructure");

  const [selectedTriggerId, setSelectedTriggerId] = useState<string>(
    infrastructureNodes[0]?.id || ""
  );

  const [simulationResult, setSimulationResult] = useState<CascadeSimulationResult | null>(
    () => (infrastructureNodes[0] ? cypherEngine.simulateCascade(infrastructureNodes[0].id) : null)
  );

  const handleRunSimulation = (idToRun?: string) => {
    const id = idToRun || selectedTriggerId;
    const result = cypherEngine.simulateCascade(id);
    setSimulationResult(result);

    if (onHighlightSubgraph) {
      const nodeIds = [result.triggerNodeId, ...result.cascadedNodes.map((c) => c.node.id)];
      const relIds = result.severedRelationships.map((r) => r.id);
      onHighlightSubgraph(nodeIds, relIds);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Explainer */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-2">
          <ZapOff className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white font-sans">
            Neo4j Cascade Failure & Ripple Vulnerability Engine
          </h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          Disaster impacts do not occur in silos. When floodwater reaches a power substation or wildfire flames arc across high-voltage lines, downstream dependencies collapse recursively. Graph traversal traces this multi-hop failure chain in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Failure Injection Controls */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
            <h4 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
              Trigger Primary Node Failure
            </h4>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1.5">
                SELECT CRITICAL INFRASTRUCTURE ASSET:
              </label>
              <select
                value={selectedTriggerId}
                onChange={(e) => {
                  setSelectedTriggerId(e.target.value);
                  handleRunSimulation(e.target.value);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-amber-300 font-medium focus:outline-none focus:border-amber-500"
              >
                {infrastructureNodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.properties.category || "Utility"})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <button
                onClick={() => handleRunSimulation()}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate Cascading Failure Chain</span>
              </button>
            </div>

            {simulationResult && onNavigateToGraph && (
              <button
                onClick={onNavigateToGraph}
                className="w-full py-2 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-cyan-400 font-medium text-xs rounded transition-colors flex items-center justify-center gap-2"
              >
                <span>Inspect Cascade on Knowledge Graph Canvas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Impact Scorecard */}
          {simulationResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3 font-mono text-xs">
              <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">
                CASCADE IMPACT TELEMETRY
              </span>

              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">TOTAL FACILITIES SEVERED:</span>
                <span className="text-rose-400 font-bold tabular-nums">
                  {simulationResult.cascadedNodes.length + 1}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">CITIZENS IN IMMEDIATE JEOPARDY:</span>
                <span className="text-amber-400 font-bold tabular-nums">
                  {simulationResult.estimatedCitizensImpoverished.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">SEVERED DEPENDENCY EDGES:</span>
                <span className="text-white font-bold tabular-nums">
                  {simulationResult.severedRelationships.length}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-400">CASCADE TRAVERSAL DEPTH:</span>
                <span className="text-cyan-400 font-bold tabular-nums">
                  {Math.max(...simulationResult.cascadedNodes.map((c) => c.depth), 1)} Hops
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Cascaded Dependency Chain Visualization */}
        <div className="lg:col-span-2 space-y-4">
          {simulationResult ? (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-rose-400 tracking-wider font-semibold">
                    GROUND ZERO FAILURE
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {simulationResult.triggerNodeName}
                  </h3>
                </div>
                <div className="px-2.5 py-1 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-mono rounded">
                  OFFLINE / SEVERED
                </div>
              </div>

              {/* Propagation Sequence */}
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  RECURSIVE DOWNSTREAM IMPACTS (MULTI-HOP GRAPH REACHABILITY)
                </span>

                {simulationResult.cascadedNodes.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4">
                    No downstream dependent infrastructure nodes detected for this component.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {simulationResult.cascadedNodes.map((item, idx) => (
                      <div
                        key={item.node.id}
                        className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] flex items-center justify-center font-bold">
                              +{item.depth}
                            </span>
                            <span className="font-semibold text-white">
                              {item.node.name}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-amber-400 font-medium">
                            {item.criticality}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                          <Activity className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>Cause: {item.failureReason}</span>
                        </div>

                        {item.node.properties.backupFuelHours && (
                          <div className="flex items-center gap-2 text-cyan-400 text-[11px] font-mono">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Emergency Backup Generators Exhaustion:{" "}
                              <strong className="text-white">
                                {item.node.properties.backupFuelHours} Hours Remaining
                              </strong>
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center text-slate-500 text-xs">
              Select an infrastructure component to simulate multi-tier graph cascade failures.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
