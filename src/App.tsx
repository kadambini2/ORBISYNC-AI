/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { DISASTER_SCENARIOS, DisasterScenario, GraphNode, PRESET_CYPHER_QUERIES } from "./data/graphData";
import { CypherEngine, CypherQueryResult } from "./services/cypherEngine";
import { TopNav } from "./components/TopNav";
import { TelemetryRibbon } from "./components/TelemetryRibbon";
import { GraphCanvas } from "./components/GraphCanvas";
import { SatelliteSwathViewer } from "./components/SatelliteSwathViewer";
import { CypherStudio } from "./components/CypherStudio";
import { CascadeSimulator } from "./components/CascadeSimulator";
import { DisasterBriefingModal } from "./components/DisasterBriefingModal";
import { RiskReportModal } from "./components/RiskReportModal";
import { HackathonInnovationDossier } from "./components/HackathonInnovationDossier";
import { EarthCrisisTimeMachine } from "./components/EarthCrisisTimeMachine";
import { LoginPage, UserProfile, DEMO_PROFILES } from "./components/LoginPage";
import { Neo4jConnectModal } from "./components/Neo4jConnectModal";
import {
  Satellite,
  Database,
  Layers,
  Zap,
  Activity,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  Play,
  FileText
} from "lucide-react";

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(DEMO_PROFILES[0]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Scenario & UI State
  const [activeScenario, setActiveScenario] = useState<DisasterScenario>(DISASTER_SCENARIOS[0]);
  const [activeTab, setActiveTab] = useState<string>("graph");
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);
  const [highlightedRelIds, setHighlightedRelIds] = useState<string[]>([]);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [isRiskReportOpen, setIsRiskReportOpen] = useState(false);

  // Temporal Slider Step (0 = Baseline T-18h to 4 = Peak Cascade T-0h)
  const [timelineStep, setTimelineStep] = useState<number>(4);

  // Neo4j Connection State
  const [isNeo4jModalOpen, setIsNeo4jModalOpen] = useState(false);
  const [neo4jStatus, setNeo4jStatus] = useState<{
    connected: boolean;
    type: "in-memory" | "auradb" | "local";
    uri: string;
    database: string;
    user: string;
    latencyMs: number;
  }>({
    connected: true,
    type: "in-memory",
    uri: "bolt://in-memory.orbitgraph.local:7687",
    database: "neo4j",
    user: "neo4j",
    latencyMs: 1.4,
  });

  // Initialize Cypher engine with current scenario
  const cypherEngine = useMemo(() => {
    return new CypherEngine(activeScenario.nodes, activeScenario.relationships);
  }, [activeScenario]);

  // Initial query execution
  const [lastQueryResult, setLastQueryResult] = useState<CypherQueryResult | null>(() => {
    const engine = new CypherEngine(DISASTER_SCENARIOS[0].nodes, DISASTER_SCENARIOS[0].relationships);
    return engine.executeCypher(PRESET_CYPHER_QUERIES[0].cypher);
  });

  // Calculate infrastructure centrality bottlenecks
  const centralityRankings = useMemo(() => {
    return cypherEngine.calculateCentrality().slice(0, 4);
  }, [cypherEngine]);

  const handleRunQuery = (query: string): CypherQueryResult => {
    const res = cypherEngine.executeCypher(query);
    setLastQueryResult(res);
    setHighlightedNodeIds(res.matchedNodeIds);
    setHighlightedRelIds(res.matchedRelIds);
    return res;
  };

  const handleScenarioChange = (scenario: DisasterScenario) => {
    setActiveScenario(scenario);
    setSelectedNode(null);
    setHighlightedNodeIds([]);
    setHighlightedRelIds([]);
    const engine = new CypherEngine(scenario.nodes, scenario.relationships);
    const initialRes = engine.executeCypher(PRESET_CYPHER_QUERIES[0].cypher);
    setLastQueryResult(initialRes);
  };

  const handleHighlightSubgraph = (nodeIds: string[], relIds: string[]) => {
    setHighlightedNodeIds(nodeIds);
    setHighlightedRelIds(relIds);
  };

  // If user is not logged in, render the Login Page
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={(profile) => {
          setCurrentUser(profile);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  // Count active nodes & relationships at current temporal step
  const activeTimelineNodesCount = activeScenario.nodes.filter(
    (n) => n.timeStep === undefined || n.timeStep <= timelineStep
  ).length;

  const activeTimelineRelsCount = activeScenario.relationships.filter(
    (r) => r.timeStep === undefined || r.timeStep <= timelineStep
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Contract Compliant Header */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenBriefing={() => setIsBriefingOpen(true)}
        onOpenRiskReport={() => setIsRiskReportOpen(true)}
        onOpenNeo4jModal={() => setIsNeo4jModalOpen(true)}
        neo4jStatus={neo4jStatus}
        currentUser={currentUser}
        onLogout={() => setIsAuthenticated(false)}
      />

      {/* Telemetry Ribbon with Integrated Temporal Slider */}
      <TelemetryRibbon
        scenarios={DISASTER_SCENARIOS}
        activeScenario={activeScenario}
        onSelectScenario={handleScenarioChange}
        nodeCount={activeTimelineNodesCount}
        relCount={activeTimelineRelsCount}
        timelineStep={timelineStep}
        onTimelineStepChange={setTimelineStep}
      />

      {/* Main Workspace Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* TAB 1: KNOWLEDGE GRAPH & ASYMMETRIC CONSOLE */}
        {activeTab === "graph" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Asymmetric Parameter & Criticality Column (1 col) */}
              <div className="lg:col-span-1 space-y-4">
                {/* Scenario Kicker Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-cyan-400 font-semibold tracking-wider">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Active Incident Zone</span>
                  </div>
                  <h3 className="text-sm font-bold text-white leading-snug">
                    {activeScenario.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {activeScenario.description}
                  </p>
                </div>

                {/* Neo4j PageRank Criticality Bottlenecks */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase text-amber-400 font-semibold tracking-wider">
                      Graph Centrality (PageRank)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">High Risk</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Single-point-of-failure infrastructure with maximum downstream utility dependencies:
                  </p>

                  <div className="space-y-2 font-mono text-xs">
                    {centralityRankings.map((item) => (
                      <div
                        key={item.node.id}
                        onClick={() => setSelectedNode(item.node)}
                        className={`p-2.5 rounded border cursor-pointer transition-colors ${
                          selectedNode?.id === item.node.id
                            ? "bg-slate-800 border-cyan-500 text-white"
                            : "bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between font-sans">
                          <span className="font-semibold text-xs truncate max-w-[170px]">
                            {item.node.name}
                          </span>
                          <span className="text-[11px] font-mono text-amber-400 font-bold">
                            {item.score}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 flex justify-between font-mono">
                          <span>{item.node.label}</span>
                          <span>Out-deg: {item.outDegree}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Generate Risk Report Button */}
                  <button
                    onClick={() => setIsRiskReportOpen(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-950/70 hover:bg-rose-900 border border-rose-500/60 rounded text-xs font-mono font-semibold text-rose-200 transition-colors shadow-sm cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-rose-400" />
                    <span>Generate Responder Risk Report</span>
                  </button>
                </div>

                {/* Quick Cypher Action Shortcuts */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2.5">
                  <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
                    Quick Cypher Inspections
                  </span>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => {
                        const res = handleRunQuery(PRESET_CYPHER_QUERIES[0].cypher);
                        handleHighlightSubgraph(res.matchedNodeIds, res.matchedRelIds);
                      }}
                      className="w-full text-left px-3 py-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded text-xs text-slate-300 font-medium transition-colors flex items-center justify-between"
                    >
                      <span>Highlight Power Cascade</span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    </button>

                    <button
                      onClick={() => {
                        const res = handleRunQuery(PRESET_CYPHER_QUERIES[1].cypher);
                        handleHighlightSubgraph(res.matchedNodeIds, res.matchedRelIds);
                      }}
                      className="w-full text-left px-3 py-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded text-xs text-slate-300 font-medium transition-colors flex items-center justify-between"
                    >
                      <span>Highlight Safe Evac Routes</span>
                      <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
                    </button>

                    <button
                      onClick={() => {
                        const res = handleRunQuery(PRESET_CYPHER_QUERIES[2].cypher);
                        handleHighlightSubgraph(res.matchedNodeIds, res.matchedRelIds);
                      }}
                      className="w-full text-left px-3 py-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded text-xs text-slate-300 font-medium transition-colors flex items-center justify-between"
                    >
                      <span>Verify Space Sensor Lineage</span>
                      <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Neo4j Knowledge Graph Canvas (3 cols) */}
              <div className="lg:col-span-3 space-y-4">
                <GraphCanvas
                  nodes={activeScenario.nodes}
                  relationships={activeScenario.relationships}
                  highlightedNodeIds={highlightedNodeIds}
                  highlightedRelIds={highlightedRelIds}
                  selectedNode={selectedNode}
                  onSelectNode={setSelectedNode}
                  timelineStep={timelineStep}
                  currentAuthor={currentUser?.name}
                />

                {/* Graph Canvas Footer Ribbon */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 px-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span>
                      TEMPORAL SLICE: Step {timelineStep + 1}/5 active · Drag nodes & sticky notes · Pin annotations to coordinates · Click nodes for LPG properties
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setHighlightedNodeIds([]);
                        setHighlightedRelIds([]);
                        setSelectedNode(null);
                      }}
                      className="hover:text-white transition-colors"
                    >
                      Clear Highlights
                    </button>
                    <span>·</span>
                    <button
                      onClick={() => setActiveTab("cypher")}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                    >
                      <span>Open in Cypher Studio</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EARTH CRISIS TIME MACHINE */}
        {activeTab === "timemachine" && (
          <div className="space-y-4">
            <EarthCrisisTimeMachine scenario={activeScenario} />
          </div>
        )}

        {/* TAB 3: SATELLITE SWATHS & GIS REMOTE SENSING */}
        {activeTab === "swaths" && (
          <div className="space-y-4">
            <SatelliteSwathViewer scenario={activeScenario} />
          </div>
        )}

        {/* TAB 3: CYPHER STUDIO */}
        {activeTab === "cypher" && (
          <div className="space-y-4">
            <CypherStudio
              onRunQuery={handleRunQuery}
              lastResult={lastQueryResult}
              onHighlightSubgraph={handleHighlightSubgraph}
            />
          </div>
        )}

        {/* TAB 4: CASCADE SIMULATOR */}
        {activeTab === "cascade" && (
          <div className="space-y-4">
            <CascadeSimulator
              nodes={activeScenario.nodes}
              relationships={activeScenario.relationships}
              onHighlightSubgraph={handleHighlightSubgraph}
              onNavigateToGraph={() => setActiveTab("graph")}
            />
          </div>
        )}

        {/* TAB 5: HACKATHON INNOVATION DOSSIER */}
        {activeTab === "dossier" && (
          <div className="space-y-4">
            <HackathonInnovationDossier />
          </div>
        )}
      </main>

      {/* Disaster Briefing Sitrep Modal */}
      <DisasterBriefingModal
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
        scenario={activeScenario}
      />

      {/* Emergency Responder Risk Report Modal */}
      <RiskReportModal
        isOpen={isRiskReportOpen}
        onClose={() => setIsRiskReportOpen(false)}
        scenario={activeScenario}
        centralityData={cypherEngine.calculateCentrality()}
        timelineStep={timelineStep}
        onTimelineStepChange={setTimelineStep}
        currentUser={currentUser}
      />

      {/* Neo4j Connection Manager & Interactive Guide Modal */}
      <Neo4jConnectModal
        isOpen={isNeo4jModalOpen}
        onClose={() => setIsNeo4jModalOpen(false)}
        connectionStatus={neo4jStatus}
        onUpdateConnection={setNeo4jStatus}
      />
    </div>
  );
}
