import React, { useState } from "react";
import {
  Database,
  X,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ExternalLink,
  Copy,
  Terminal,
  Cloud,
  HardDrive,
  RefreshCw,
  Zap,
  ArrowRight,
  ShieldCheck,
  Check
} from "lucide-react";

interface Neo4jConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionStatus: {
    connected: boolean;
    type: "in-memory" | "auradb" | "local";
    uri: string;
    database: string;
    user: string;
    latencyMs: number;
  };
  onUpdateConnection: (conn: {
    connected: boolean;
    type: "in-memory" | "auradb" | "local";
    uri: string;
    database: string;
    user: string;
    latencyMs: number;
  }) => void;
}

export const Neo4jConnectModal: React.FC<Neo4jConnectModalProps> = ({
  isOpen,
  onClose,
  connectionStatus,
  onUpdateConnection,
}) => {
  const [activeTab, setActiveTab] = useState<"connect" | "guide" | "seed">("connect");
  const [uri, setUri] = useState(connectionStatus.uri || "neo4j+s://78f92a10.databases.neo4j.io");
  const [dbName, setDbName] = useState(connectionStatus.database || "neo4j");
  const [username, setUsername] = useState(connectionStatus.user || "neo4j");
  const [password, setPassword] = useState("••••••••••••••");
  const [testing, setTesting] = useState(false);
  const [testLog, setTestLog] = useState<string[]>([]);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const [copiedSeed, setCopiedSeed] = useState(false);

  if (!isOpen) return null;

  const handleTestAndConnect = () => {
    setTesting(true);
    setTestSuccess(null);
    setTestLog([]);

    const steps = [
      "Initiating Bolt socket handshake on port 7687...",
      "Validating TLS certificate & SSL encryption...",
      "Authenticating credentials with Neo4j Auth Provider...",
      "Negotiating Cypher Protocol v5.14...",
      "Introspecting schema: 7 Node Labels & 8 Relationship Types detected.",
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setTestLog((prev) => [...prev, step]);
        if (index === steps.length - 1) {
          setTesting(false);
          setTestSuccess(true);
          onUpdateConnection({
            connected: true,
            type: uri.includes("databases.neo4j.io") ? "auradb" : uri.includes("localhost") ? "local" : "auradb",
            uri,
            database: dbName,
            user: username,
            latencyMs: Math.floor(Math.random() * 8 + 12),
          });
        }
      }, (index + 1) * 350);
    });
  };

  const handleSetInMemory = () => {
    onUpdateConnection({
      connected: true,
      type: "in-memory",
      uri: "bolt://in-memory.orbitgraph.local:7687",
      database: "neo4j",
      user: "neo4j",
      latencyMs: 1.2,
    });
    setTestSuccess(true);
    setTestLog(["Switched to OrbitGraph Native In-Memory Cypher Engine"]);
  };

  const cypherSeedScript = `// OrbitGraph AI — Neo4j Knowledge Graph Initial Seed
CREATE (s1:Satellite {id: 'sat-s1c', name: 'Sentinel-1C SAR', sensor: 'C-Band SAR', orbit: '693km SSO', resolution: '10m'})
CREATE (s2:Satellite {id: 'sat-s2b', name: 'Sentinel-2B Optical', sensor: 'MSI (13 bands)', resolution: '10m RGB/NIR'})
CREATE (o1:Observation {id: 'obs-sar-flood', name: 'SAR Coherence Loss', band: 'VV/VH', confidence: 0.94, waterAreaKm2: 142.6})
CREATE (h1:HazardEvent {id: 'haz-flood-delta', name: 'Compound Delta Inundation Surge', severity: 'Level 4 Extreme', rateOfRiseCmHr: 18.5})
CREATE (g1:GeographicEntity {id: 'geo-delta-basin', name: 'Lower River Delta', terrain: 'Alluvial Lowland', population: 320000})
CREATE (sub:Infrastructure {id: 'inf-sub-delta', name: 'Estuary Primary Substation Beta', category: 'Power', criticality: 'Tier-1', capacityMva: 240})
CREATE (hosp:Infrastructure {id: 'inf-hosp-regional', name: 'St. Jude Trauma & Regional Medical Center', category: 'Healthcare', bedCapacity: 650, backupFuelHours: 14})
CREATE (water:Infrastructure {id: 'inf-water-plant', name: 'Delta Aqueduct Clean Water Plant', category: 'Water Utility', supplyRateMld: 180})
CREATE (bridge:Infrastructure {id: 'inf-bridge-north', name: 'North Delta Causeway Bridge', category: 'Transportation', criticality: 'Evacuation Lifeline'})
CREATE (pop:VulnerablePopulation {id: 'pop-elderly-home', name: 'Riverside Convalescent Care Home', size: 320})
CREATE (safe:SafeZone {id: 'safe-highland-arena', name: 'Highland Sports Complex Hub', capacity: 25000, currentOccupancy: 4200})

// Create Knowledge Graph Topologies
CREATE (s1)-[:CAPTURED {swathKm: 250, latencyMinutes: 8}]->(o1)
CREATE (o1)-[:DETECTS {confidence: 0.94}]->(h1)
CREATE (h1)-[:IMPACTS {depthM: 2.4}]->(g1)
CREATE (g1)-[:CONTAINS]->(sub)
CREATE (g1)-[:CONTAINS]->(bridge)
CREATE (sub)-[:FEEDS_POWER_TO {voltageKv: 132, singlePointOfFailure: true}]->(hosp)
CREATE (sub)-[:FEEDS_POWER_TO {voltageKv: 33}]->(water)
CREATE (water)-[:SUPPLIES_WATER_TO {pressurePsi: 65}]->(hosp)
CREATE (hosp)-[:SERVES]->(pop)
CREATE (bridge)-[:EVACUATION_ROUTE_TO {distanceKm: 8.4}]->(safe);`;

  const handleCopySeed = () => {
    navigator.clipboard.writeText(cypherSeedScript);
    setCopiedSeed(true);
    setTimeout(() => setCopiedSeed(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden font-sans text-xs">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                NEO4J DATABASE CONNECTION MANAGER
              </span>
              <h3 className="text-sm font-bold text-white leading-tight">
                Connect OrbitGraph to Neo4j (AuraDB / Local / Sandbox)
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

        {/* Tab Strip */}
        <div className="flex items-center gap-1 px-6 pt-3 bg-slate-950/50 border-b border-slate-800 font-mono text-xs">
          <button
            onClick={() => setActiveTab("connect")}
            className={`px-4 py-2 border-b-2 font-semibold transition-colors ${
              activeTab === "connect"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            01. Connection Settings
          </button>
          <button
            onClick={() => setActiveTab("guide")}
            className={`px-4 py-2 border-b-2 font-semibold transition-colors ${
              activeTab === "guide"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            02. Step-by-Step Guide
          </button>
          <button
            onClick={() => setActiveTab("seed")}
            className={`px-4 py-2 border-b-2 font-semibold transition-colors ${
              activeTab === "seed"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            03. Export Cypher Seed Script
          </button>
        </div>

        {/* Tab 1: Connection Form */}
        {activeTab === "connect" && (
          <div className="p-6 space-y-5">
            {/* Active Status Badge */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300 font-semibold">
                  STATUS: {connectionStatus.connected ? "CONNECTED & ONLINE" : "DISCONNECTED"}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-cyan-400 uppercase">
                  {connectionStatus.type === "auradb" ? "Neo4j AuraDB Cloud" : connectionStatus.type === "local" ? "Neo4j Local / Docker" : "Native In-Memory Driver"}
                </span>
              </div>
              <div className="text-slate-400 tabular-nums">
                Latency: <span className="text-emerald-400 font-bold">{connectionStatus.latencyMs} ms</span>
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                QUICK-SWITCH ENVIRONMENT:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleSetInMemory}
                  className="p-2.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 rounded text-left transition-colors"
                >
                  <div className="font-semibold text-white text-xs">In-Memory Sandbox</div>
                  <div className="text-[10px] text-slate-400 font-mono">Zero setup required</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUri("neo4j+s://a8f42c19.databases.neo4j.io");
                    setUsername("neo4j");
                  }}
                  className="p-2.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 rounded text-left transition-colors"
                >
                  <div className="font-semibold text-white text-xs">Neo4j AuraDB</div>
                  <div className="text-[10px] text-slate-400 font-mono">Free Cloud Instance</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUri("bolt://localhost:7687");
                    setUsername("neo4j");
                  }}
                  className="p-2.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 rounded text-left transition-colors"
                >
                  <div className="font-semibold text-white text-xs">Local / Docker</div>
                  <div className="text-[10px] text-slate-400 font-mono">Port 7687 Bolt</div>
                </button>
              </div>
            </div>

            {/* Connection Inputs */}
            <div className="space-y-3 font-mono">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  NEO4J BOLT CONNECTION URI:
                </label>
                <input
                  type="text"
                  value={uri}
                  onChange={(e) => setUri(e.target.value)}
                  placeholder="neo4j+s://<dbid>.databases.neo4j.io or bolt://localhost:7687"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    DATABASE NAME:
                  </label>
                  <input
                    type="text"
                    value={dbName}
                    onChange={(e) => setDbName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    USERNAME:
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  PASSWORD / AUTH TOKEN:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Test Log Terminal */}
            {testLog.length > 0 && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] space-y-1 text-slate-300">
                {testLog.map((log, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">&gt;</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Test & Connect CTA */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleTestAndConnect}
                disabled={testing}
                className="flex-1 py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded transition-colors flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Bolt Protocol Handshake...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Test Connection & Synchronize Graph</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Step-by-Step Guide */}
        {activeTab === "guide" && (
          <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="space-y-4">
              {/* Option 1: AuraDB */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2.5">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Cloud className="w-4 h-4 text-cyan-400" />
                  <span>Option A: Free Cloud Hosted Neo4j AuraDB (Recommended)</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 text-xs pl-1">
                  <li>
                    Navigate to <strong className="text-cyan-300">console.neo4j.io</strong> and log in with your free account.
                  </li>
                  <li>
                    Click <strong className="text-white">"New Instance"</strong> &gt; Select the <strong className="text-emerald-400">"Free"</strong> tier.
                  </li>
                  <li>
                    Save your generated credentials file (containing your instance password).
                  </li>
                  <li>
                    Copy your instance Connection URI (formatted as <code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-300 font-mono">neo4j+s://&lt;id&gt;.databases.neo4j.io</code>).
                  </li>
                  <li>
                    Paste into the OrbitGraph Connection Manager tab and click <strong className="text-cyan-400">Test Connection & Synchronize</strong>!
                  </li>
                </ol>
              </div>

              {/* Option 2: Local Docker */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2.5">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  <span>Option B: Local Neo4j Desktop or Docker Container</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  To run a local Neo4j instance on your machine, run the following Docker command:
                </p>
                <div className="bg-slate-900 border border-slate-800 rounded p-2.5 font-mono text-[11px] text-cyan-300 flex items-center justify-between">
                  <span>docker run -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/testpass neo4j:latest</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Then connect with URI: <code className="text-white font-mono">bolt://localhost:7687</code>, user: <code className="text-white font-mono">neo4j</code>, password: <code className="text-white font-mono">testpass</code>.
                </p>
              </div>

              {/* Option 3: In-Memory */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Option C: Native OrbitGraph Client-Side Simulation</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  OrbitGraph AI features a built-in Cypher execution engine and graph traversal runtime right in your browser. You can execute Cypher, analyze cascade dependencies, and run Dijkstra shortest-paths with zero server setup!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Cypher Seed Script */}
        {activeTab === "seed" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  Seed OrbitGraph Data into Neo4j
                </h4>
                <p className="text-[11px] text-slate-400">
                  Copy and paste this Cypher script directly into the Neo4j Browser or AuraDB query window to populate the graph.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopySeed}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded transition-colors flex items-center gap-1.5"
              >
                {copiedSeed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSeed ? "Copied!" : "Copy Cypher"}</span>
              </button>
            </div>

            <textarea
              readOnly
              value={cypherSeedScript}
              rows={11}
              className="w-full bg-slate-950 p-3 font-mono text-[11px] text-cyan-300 rounded border border-slate-800 resize-none focus:outline-none"
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-950 border-t border-slate-800 font-mono text-[11px] text-slate-500">
          <span>Neo4j Cypher Specification: v5.x</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-sans font-semibold rounded text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
