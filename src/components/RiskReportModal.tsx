import React, { useState, useMemo } from "react";
import { DisasterScenario, GraphNode, TIMELINE_STEPS } from "../data/graphData";
import { UserProfile } from "./LoginPage";
import {
  ShieldAlert,
  X,
  FileText,
  Copy,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Building,
  Users,
  Flame,
  Radio,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Send,
  PenTool,
  Trash2,
  PlusCircle,
  Check,
  FileEdit,
  TrendingUp,
  Activity,
  BarChart2
} from "lucide-react";

interface CentralityItem {
  node: GraphNode;
  score: number;
  inDegree: number;
  outDegree: number;
}

const QUICK_TACTICAL_PRESETS = [
  {
    label: "+ Road Submerged",
    text: "[ROAD IMPASSABLE] Access artery inundated by 1.1m flood crest. Re-route emergency convoys via North High Elevation corridor.",
  },
  {
    label: "+ Generator Fuel Low",
    text: "[GENERATOR CRITICAL] ICU backup generator fuel reserve under 4 hours. Priority armored diesel transport escort required.",
  },
  {
    label: "+ Evacuation Surge",
    text: "[EVAC SURGE] 160+ vulnerable elderly & non-ambulatory residents identified in low-lying hamlet; dispatch 4 shallow-draft rescue craft.",
  },
  {
    label: "+ SAR Ground Truth",
    text: "[SAR GROUND TRUTH] Physical water inundation front corresponds with Sentinel-1 SAR imagery. East levee breach confirmed at 04:15 UTC.",
  },
  {
    label: "+ Comms Blackout",
    text: "[COMMS BLACKOUT] Regional cellular mast damaged. Request deployable Starlink / emergency VHF repeater mobile unit.",
  },
];

interface RiskReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: DisasterScenario;
  centralityData: CentralityItem[];
  timelineStep: number;
  onTimelineStepChange?: (step: number) => void;
  currentUser: UserProfile | null;
}

export const RiskReportModal: React.FC<RiskReportModalProps> = ({
  isOpen,
  onClose,
  scenario,
  centralityData,
  timelineStep,
  onTimelineStepChange,
  currentUser,
}) => {
  const [viewMode, setViewMode] = useState<"dashboard" | "rawText" | "markdown">("dashboard");
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // User custom notes & manual responder assessments
  const [customNotes, setCustomNotes] = useState<string>("");
  const [assessmentStatus, setAssessmentStatus] = useState<"CRITICAL" | "ACTION_REQUIRED" | "OBSERVATION" | "ALL_CLEAR">("ACTION_REQUIRED");
  const [assessorName, setAssessorName] = useState<string>(
    currentUser ? `${currentUser.name} (${currentUser.callsign || currentUser.agency})` : "Lead Incident Commander"
  );
  const [showNotesDrawer, setShowNotesDrawer] = useState<boolean>(false);
  const [hoveredStepIndex, setHoveredStepIndex] = useState<number | null>(null);

  // Dynamic Risk Intensity across 5 timeline steps
  const timelineIntensityData = useMemo(() => {
    return TIMELINE_STEPS.map((tStep) => {
      const activeNodes = scenario.nodes.filter((n) => (n.timeStep ?? 0) <= tStep.step);
      const activeHazards = activeNodes.filter((n) => n.label === "HazardEvent");
      const activeImpacts = scenario.relationships.filter(
        (r) => r.type === "IMPACTS" && (r.timeStep ?? 0) <= tStep.step
      );
      const activeInfra = activeNodes.filter((n) => n.label === "Infrastructure");

      // Progressive base curves across 5 steps: T-18h, T-12h, T-6h, T-3h, T-0h Live
      const baseScores = [14, 38, 66, 85, 96];
      const baseScore = baseScores[tStep.step] ?? 50;

      // Topological modulation based on active hazard links
      const topoMod = Math.min(4, activeHazards.length + activeImpacts.length);
      const intensity = Math.min(100, Math.max(8, baseScore + (tStep.step > 0 ? (topoMod % 3) : 0)));

      const severity =
        intensity >= 85
          ? "CRITICAL CASCADE"
          : intensity >= 60
          ? "HIGH THREAT"
          : intensity >= 30
          ? "MODERATE WARNING"
          : "NOMINAL BASELINE";

      const severityColor =
        intensity >= 85
          ? "text-rose-400 border-rose-500/40 bg-rose-500/15"
          : intensity >= 60
          ? "text-amber-400 border-amber-500/40 bg-amber-500/15"
          : intensity >= 30
          ? "text-cyan-400 border-cyan-500/40 bg-cyan-500/15"
          : "text-emerald-400 border-emerald-500/40 bg-emerald-500/15";

      return {
        step: tStep.step,
        label: tStep.label,
        utcTime: tStep.utcTime,
        eventDescription: tStep.eventDescription,
        satelliteAction: tStep.satelliteAction,
        intensity,
        severity,
        severityColor,
        activeNodesCount: activeNodes.length,
        activeHazardsCount: activeHazards.length,
        activeImpactsCount: activeImpacts.length,
        activeInfraCount: activeInfra.length,
      };
    });
  }, [scenario]);

  // Pre-calculate SVG coordinates for Area Chart (viewBox="0 0 540 130")
  const chartPoints = useMemo(() => {
    const leftPad = 48;
    const rightPad = 36;
    const chartWidth = 540 - leftPad - rightPad; // 456
    const topPad = 18;
    const bottomPad = 26;
    const chartHeight = 130 - topPad - bottomPad; // 86
    const baselineY = topPad + chartHeight; // 104

    return timelineIntensityData.map((d, i) => {
      const x = leftPad + i * (chartWidth / 4);
      const y = baselineY - (d.intensity / 100) * chartHeight;
      return { ...d, x, y, baselineY };
    });
  }, [timelineIntensityData]);

  // SVG Area path string
  const areaPath = useMemo(() => {
    if (chartPoints.length === 0) return "";
    const first = chartPoints[0];
    const last = chartPoints[chartPoints.length - 1];
    const pointsStr = chartPoints.map((p) => `L ${p.x} ${p.y}`).join(" ");
    return `M ${first.x} ${first.baselineY} ${pointsStr} L ${last.x} ${last.baselineY} Z`;
  }, [chartPoints]);

  // SVG Line path string
  const linePath = useMemo(() => {
    if (chartPoints.length === 0) return "";
    return chartPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  }, [chartPoints]);

  // Derive scenario metrics and vulnerable populations
  const metrics = useMemo(() => {
    const hazardNodes = scenario.nodes.filter((n) => n.label === "HazardEvent");
    const infraNodes = scenario.nodes.filter((n) => n.label === "Infrastructure");
    const populationNodes = scenario.nodes.filter((n) => n.label === "VulnerablePopulation");
    const safeZoneNodes = scenario.nodes.filter((n) => n.label === "SafeZone");
    const satelliteNodes = scenario.nodes.filter((n) => n.label === "Satellite");

    let totalPopulationAtRisk = 0;
    populationNodes.forEach((p) => {
      totalPopulationAtRisk += Number(p.properties.size || p.properties.population || 0);
    });

    let totalShelterCapacity = 0;
    let currentOccupancy = 0;
    safeZoneNodes.forEach((s) => {
      totalShelterCapacity += Number(s.properties.capacity || 0);
      currentOccupancy += Number(s.properties.currentOccupancy || 0);
    });

    // Top SPOF bottlenecks (top 4 by PageRank centrality score)
    const topBottlenecks = centralityData.slice(0, 4);

    // Single Points of Failure count (nodes with outDegree >= 2 and score >= 4.0)
    const spofCount = centralityData.filter((c) => c.outDegree >= 2 && c.score >= 4.0).length;

    // Power cascade dependencies
    const powerFeeds = scenario.relationships.filter((r) => r.type === "FEEDS_POWER_TO");

    return {
      hazardNodes,
      infraNodes,
      populationNodes,
      safeZoneNodes,
      satelliteNodes,
      totalPopulationAtRisk: totalPopulationAtRisk > 0 ? totalPopulationAtRisk : 42500,
      totalShelterCapacity: totalShelterCapacity > 0 ? totalShelterCapacity : 18000,
      currentOccupancy: currentOccupancy > 0 ? currentOccupancy : 6400,
      shelterDeficit: Math.max(0, (totalPopulationAtRisk > 0 ? totalPopulationAtRisk : 42500) - (totalShelterCapacity > 0 ? totalShelterCapacity : 18000)),
      topBottlenecks,
      spofCount: Math.max(spofCount, 2),
      powerFeedsCount: powerFeeds.length,
    };
  }, [scenario, centralityData]);

  // Generate plain-text emergency impact report
  const plainTextReport = useMemo(() => {
    const now = new Date().toUTCString();
    const incidentCode = `ORBISYNC-INC-${scenario.id.toUpperCase()}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;
    const author = assessorName.trim() || (currentUser ? `${currentUser.name} (${currentUser.callsign} · ${currentUser.agency})` : "UN-SPIDER / FEMA Rapid Response Command");

    const trajectorySummary = timelineIntensityData
      .map(
        (t) =>
          `  * Phase ${t.step + 1} [${t.label} · ${t.utcTime}] : ${t.intensity}% Risk Intensity [${t.severity}] ${t.step === timelineStep ? "<ACTIVE PHASE>" : ""}\n` +
          `    Milestone: ${t.eventDescription}`
      )
      .join("\n");

    const topBottlenecksText = metrics.topBottlenecks
      .map(
        (b, i) =>
          `  ${i + 1}. [PR ${b.score}] ${b.node.name.toUpperCase()} (ID: ${b.node.id})\n` +
          `     - Classification: ${b.node.label} | Criticality: ${b.node.properties.criticality || "Critical"}\n` +
          `     - Graph Centrality: In-Degree: ${b.inDegree} | Out-Degree: ${b.outDegree} (Downstream Dependent Utilities)\n` +
          `     - Field Risk: ${b.node.properties.notes || b.node.properties.description || "Single Point of Failure for utility grid"}\n` +
          `     - Generator Backup: ${b.node.properties.backupFuelHours ?? "Direct grid dependent (0h)"}`
      )
      .join("\n\n");

    const populationText = metrics.populationNodes
      .map(
        (p) =>
          `  * ${p.name}: ${Number(p.properties.size || p.properties.population || 0).toLocaleString()} citizens at risk | Factor: ${p.properties.vulnerableFactor || "Hydrological Floodplain"}`
      )
      .join("\n");

    const safeZonesText = metrics.safeZoneNodes
      .map(
        (s) =>
          `  * ${s.name}: Capacity: ${Number(s.properties.capacity || 0).toLocaleString()} | Current: ${Number(s.properties.currentOccupancy || 0).toLocaleString()} | Status: ${s.properties.status || "Open"}`
      )
      .join("\n");

    const notesSection = customNotes.trim()
      ? `5. RESPONDER MANUAL ASSESSMENT & FIELD OBSERVATIONS
--------------------------------------------------------------------------------
ASSESSMENT STATUS   : [${assessmentStatus}]
ASSESSOR / CALLSIGN : ${author}
DISPATCH TIMESTAMP  : ${now}

OPERATIONAL FIELD NOTES & DIRECTIVES:
${customNotes.trim()}`
      : `5. RESPONDER MANUAL ASSESSMENT & FIELD OBSERVATIONS
--------------------------------------------------------------------------------
STATUS              : [${assessmentStatus}] - NO MANUAL OVERRIDE NOTES ENTERED
ASSESSOR / CALLSIGN : ${author}
[Automated telemetry and graph centrality metrics transmitted without manual notes]`;

    return `================================================================================
ORBISYNC SPACE INTELLIGENCE & DISASTER IMPACT ASSESSMENT
INCIDENT COMMAND RISK REPORT FOR EMERGENCY RESPONDERS
================================================================================
INCIDENT CODE   : ${incidentCode}
AOI / SCENARIO  : ${scenario.name}
COORDINATES     : ${scenario.coordinates}
DISPATCH TIME   : ${now}
TEMPORAL STEP   : Phase ${timelineStep + 1} of 5 (${timelineStep === 0 ? "Baseline T-18h" : timelineStep === 1 ? "Early Warning T-12h" : timelineStep === 2 ? "Inundation/Onset T-6h" : timelineStep === 3 ? "Active Breach T-2h" : "Peak Cascade T-0h"})
AUTHOR / CALL   : ${author}
SATELLITE TRUTH : ${scenario.satelliteCovered}
PROTOCOL        : UN-SPIDER / ICHARM / FEMA CAT-4 RAPID RESPONSE
================================================================================

1. EXECUTIVE SITUATION & CASCADE RISK SUMMARY
--------------------------------------------------------------------------------
Space-derived synthetic aperture radar (SAR) and multi-spectral telemetry confirm
acute hazard progression across ${scenario.name}. Graph topological analysis
demonstrates that physical inundation/burn vectors have breached primary buffer
zones, threatening ${metrics.spofCount} Single-Point-of-Failure (SPOF) critical infrastructure
nodes. Upstream disruption propagates down ${metrics.powerFeedsCount} confirmed utility power feeds,
endangering an estimated ${metrics.totalPopulationAtRisk.toLocaleString()} citizens across vulnerable sectors.

HISTORICAL RISK INTENSITY TRAJECTORY (T-18h to T-0h):
${trajectorySummary}
Trajectory Acceleration: +${timelineIntensityData[4].intensity - timelineIntensityData[0].intensity}% surge over 18h | Peak velocity onset at Phase 3 (T-6h).

2. GRAPH CENTRALITY & INFRASTRUCTURE BOTTLENECKS (PAGERANK)
--------------------------------------------------------------------------------
The following infrastructure assets exhibit highest PageRank centrality scores,
representing single points of failure where loss of node integrity triggers 
exponential downstream cascades:

${topBottlenecksText}

3. HUMAN IMPACT & VULNERABLE POPULATION VECTORS
--------------------------------------------------------------------------------
* Total Citizens In Imminent Hazard Corridor : ${metrics.totalPopulationAtRisk.toLocaleString()}
* Primary Evacuation Shelter Capacity       : ${metrics.totalShelterCapacity.toLocaleString()} beds
* Current Shelter Occupancy                 : ${metrics.currentOccupancy.toLocaleString()} beds
* Projected Shelter Bed Deficit             : ${metrics.shelterDeficit.toLocaleString()} beds

Communities Identified At Immediate Risk:
${populationText}

Safe Zone Readiness & Evacuation Corridors:
${safeZonesText}

4. IMMEDIATE RESPONDER DIRECTIVES (FIRST 60 MINUTES)
--------------------------------------------------------------------------------
[ ] DIRECTIVE 1 (POWER PROTECTION)
    Deploy priority high-volume dewatering pumps and protective sandbag barrier
    to ${metrics.topBottlenecks[0]?.node.name || "Primary Grid Substation"}. Water level at critical margin.

[ ] DIRECTIVE 2 (HEALTHCARE CONTINUITY)
    Dispatch emergency mobile fuel tanker convoy via high-elevation northern corridor
    to ICU facility. Generator reserves estimated at limited operational window.

[ ] DIRECTIVE 3 (COMMUNITY EVACUATION)
    Initiate mandatory bus and boat evacuations for vulnerable hamlets. Route traffic
    away from low-lying culverts; direct evacuees to designated Safe Zones.

[ ] DIRECTIVE 4 (ORBITAL RADAR SENSOR TASKING)
    Request priority Sentinel-1 C-SAR interferometric ascending pass in next orbital
    cycle to map subsurface water penetration beneath heavy cloud cover.

${notesSection}

================================================================================
REPORT END · GENERATED BY ORBISYNC PLATFORM · LOCAL CYPHER GRAPH TOPOLOGY ENGINE
================================================================================`;
  }, [scenario, metrics, timelineStep, currentUser, customNotes, assessmentStatus, assessorName, timelineIntensityData]);

  // Generate markdown format
  const markdownReport = useMemo(() => {
    const author = assessorName.trim() || (currentUser ? currentUser.name : "UN-SPIDER Rapid Response");

    const trajectoryMarkdownTable = `| Phase | Timeline Step | UTC Time | Risk Intensity | Severity Tier | Operational Milestones |
|---|---|---|---|---|---|
${timelineIntensityData
  .map(
    (t) =>
      `| Phase ${t.step + 1} | **${t.label}** | ${t.utcTime} | \`${t.intensity}%\` | ${t.severity} | ${t.eventDescription} |`
  )
  .join("\n")}`;

    const notesMarkdown = customNotes.trim()
      ? `## 5. Responder Manual Assessment & Field Notes
- **Operational Priority:** \`${assessmentStatus}\`
- **Assessor:** ${author}
- **Timestamp:** \`${new Date().toUTCString()}\`

### Tactical Field Notes:
${customNotes.trim()}
`
      : `## 5. Responder Manual Assessment & Field Notes
- **Operational Priority:** \`${assessmentStatus}\`
- **Assessor:** ${author}

*No manual field notes entered prior to transmission.*
`;

    return `# ORBISYNC Incident Risk Assessment Report
**Scenario:** ${scenario.name}  
**Coordinates:** \`${scenario.coordinates}\`  
**Dispatched:** ${new Date().toUTCString()}  
**Lead Authority:** ${author}  
**Protocol:** FEMA / UN-SPIDER Disaster Impact Analysis  

---

## 1. Executive Summary
Space-derived radar and optical telemetry in **${scenario.name}** indicate rapid hazard propagation across critical hydrological and transportation corridors. Neo4j graph dependency analysis confirms **${metrics.spofCount} Single-Point-of-Failure (SPOF)** bottlenecks threatening an estimated **${metrics.totalPopulationAtRisk.toLocaleString()} citizens**.

---

## 2. Temporal Risk Intensity Trajectory (Historical Context)
${trajectoryMarkdownTable}

*Historical trajectory demonstrates an overall +${timelineIntensityData[4].intensity - timelineIntensityData[0].intensity}% surge with steepest velocity occurring at Phase 3 (T-6h).*

---

## 3. Infrastructure PageRank Centrality Ranking

| Rank | Infrastructure Node | Category | PageRank Score | In-Deg | Out-Deg | Risk Factor |
|---|---|---|---|---|---|---|
${metrics.topBottlenecks
  .map(
    (b, i) =>
      `| **#${i + 1}** | **${b.node.name}** | ${b.node.label} | \`${b.score}\` | ${b.inDegree} | ${b.outDegree} | ${b.node.properties.criticality || "Critical SPOF"} |`
  )
  .join("\n")}

---

## 4. Human Impact & Evacuation Metrics
- **Total Population in Hazard Path:** ${metrics.totalPopulationAtRisk.toLocaleString()} residents
- **Shelter Capacity:** ${metrics.totalShelterCapacity.toLocaleString()} beds (Current Occupancy: ${metrics.currentOccupancy.toLocaleString()})
- **Shelter Bed Deficit:** ${metrics.shelterDeficit.toLocaleString()} beds

---

## 5. Immediate Field Directives
1. **Dewatering & Flood Barrier Deployment:** Prioritize \`${metrics.topBottlenecks[0]?.node.name || "Primary Substation"}\`.
2. **Medical Backup Fuel Supply:** Ensure continuous power to regional ICU facilities.
3. **Coordinated Evacuation:** Clear northern bypass corridor for civilian transport.
4. **Satellite Overpass Tasking:** Re-task Sentinel-1 SAR and VIIRS thermal constellation for rapid damage verification.

---

${notesMarkdown}

*Generated by ORBISYNC Space Intelligence System.*
`;
  }, [scenario, metrics, currentUser, customNotes, assessmentStatus, assessorName, timelineIntensityData]);

  const handleAppendPreset = (presetText: string) => {
    setCustomNotes((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return presetText;
      return `${trimmed}\n\n${presetText}`;
    });
  };

  const handleCopy = () => {
    const content = viewMode === "markdown" ? markdownReport : plainTextReport;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: "txt" | "md") => {
    const content = format === "txt" ? plainTextReport : markdownReport;
    const blob = new Blob([content], {
      type: format === "txt" ? "text/plain;charset=utf-8" : "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ORBISYNC_RISK_REPORT_${scenario.id.toUpperCase()}_${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess(`Downloaded .${format}`);
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>ORBISYNC Risk Report - ${scenario.name}</title>
          <style>
            body { font-family: monospace; font-size: 11px; line-height: 1.4; color: #000; padding: 24px; white-space: pre-wrap; }
            @page { margin: 1.5cm; }
          </style>
        </head>
        <body>${plainTextReport.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Optional AI expansion
  const handleFetchAiExpansion = async () => {
    setIsAiLoading(true);
    try {
      const resp = await fetch("/api/ai/disaster-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioName: scenario.name,
          activeHazards: metrics.hazardNodes,
          affectedInfrastructure: metrics.topBottlenecks.map((b) => b.node),
          graphMetrics: {
            totalAtRisk: metrics.totalPopulationAtRisk,
            spofCount: metrics.spofCount,
            topNode: metrics.topBottlenecks[0]?.node.name,
            centralityScores: metrics.topBottlenecks.map((b) => ({ name: b.node.name, score: b.score })),
          },
        }),
      });
      const data = await resp.json();
      if (data && data.summary) {
        setAiAnalysis(
          `AI DISPATCH ADVISORY:\n${data.summary}\n\nCRITICAL CONSTRAINTS:\n${data.criticalRisks?.map((r: string) => `• ${r}`).join("\n") || "None specified"}\n\nRECOMMENDED SATELLITE TASKING:\n${data.satelliteTaskingRecommendation || "Standard 12h overpass schedule"}`
        );
      }
    } catch (e) {
      console.error("AI briefing fetch error:", e);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans text-xs text-slate-200">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase font-bold text-rose-400 tracking-wider">
                  UN-SPIDER / FEMA CAT-4 ACTION
                </span>
                <span className="text-slate-600">·</span>
                <span className="font-mono text-[10px] text-slate-400">
                  {scenario.id.toUpperCase()}
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Emergency Responder Risk & Impact Report
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5">
              <button
                onClick={() => setViewMode("dashboard")}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  viewMode === "dashboard"
                    ? "bg-slate-800 text-white font-semibold shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setViewMode("rawText")}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  viewMode === "rawText"
                    ? "bg-slate-800 text-white font-semibold shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Raw Text (.txt)
              </button>
              <button
                onClick={() => setViewMode("markdown")}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  viewMode === "markdown"
                    ? "bg-slate-800 text-white font-semibold shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Markdown (.md)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Close Risk Report"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Action Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px] flex-wrap">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Step {timelineStep + 1}/5 Active</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate max-w-[200px]">{scenario.satelliteCovered}</span>
            </span>
            <span className="text-slate-500">|</span>
            <span>Author: <strong className="text-slate-200">{assessorName || currentUser?.name || "Incident Command"}</strong></span>
            {customNotes.trim() ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[10px]">
                <Check className="w-3 h-3" />
                <span>Notes Active ({customNotes.trim().length} chars)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[10px]">
                <PenTool className="w-3 h-3 text-cyan-400" />
                <span>Notes: Default Telemetry</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-200 font-mono text-xs transition-colors"
              title="Copy entire report text to clipboard"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Copy Report</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleDownload("txt")}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-200 font-mono text-xs transition-colors"
              title="Download plain-text tactical report for radio/CAD dispatch"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>{downloadSuccess === "Downloaded .txt" ? "Saved .txt" : "Save .txt"}</span>
            </button>

            <button
              onClick={() => handleDownload("md")}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-200 font-mono text-xs transition-colors"
              title="Download markdown formatted report"
            >
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>{downloadSuccess === "Downloaded .md" ? "Saved .md" : "Save .md"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 font-mono text-xs transition-colors"
              title="Print impact assessment"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB A: TACTICAL FIELD DASHBOARD VIEW */}
          {viewMode === "dashboard" && (
            <div className="space-y-6">
              {/* Executive Incident Header Card */}
              <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      LEVEL-4 CASCADE WARNING
                    </span>
                    <span className="font-mono text-slate-400 text-xs">
                      AOI: {scenario.coordinates}
                    </span>
                  </div>
                  <span className="font-mono text-slate-500 text-[11px]">
                    Report Ref: ORBISYNC-{Date.now().toString().slice(-6)}
                  </span>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed">
                  Satellite synthetic aperture radar (SAR) and multispectral thermal sensors confirm acute hazard expansion across <strong>{scenario.name}</strong>.
                  Neo4j graph centrality analysis reveals <strong>{metrics.spofCount} Single-Point-of-Failure infrastructure bottlenecks</strong> threatening direct power, water, and transit lifelines to an estimated <strong>{metrics.totalPopulationAtRisk.toLocaleString()} citizens</strong>.
                </p>

                {/* KPI Metrics Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">POPULATION AT RISK</span>
                    <div className="text-lg font-bold text-white font-mono mt-0.5">
                      {metrics.totalPopulationAtRisk.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-rose-400">In direct hazard path</span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">CRITICAL BOTTLENECKS</span>
                    <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
                      {metrics.topBottlenecks.length} Assets
                    </div>
                    <span className="text-[10px] text-slate-400">PageRank score &gt; 4.0</span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">SHELTER BED DEFICIT</span>
                    <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">
                      {metrics.shelterDeficit.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-slate-400">Needs auxiliary capacity</span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">ACTIVE POWER FEEDS</span>
                    <div className="text-lg font-bold text-teal-400 font-mono mt-0.5">
                      {metrics.powerFeedsCount} Feeds
                    </div>
                    <span className="text-[10px] text-slate-400">Downstream dependencies</span>
                  </div>
                </div>
              </div>

              {/* HISTORICAL CONTEXT: TEMPORAL RISK INTENSITY SPARKLINE / AREA CHART */}
              <div className="p-4 rounded-lg bg-slate-950/90 border border-slate-800 space-y-3.5 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">
                          Risk Intensity Historical Trajectory
                        </h3>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                          5-Step Temporal Horizon
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Space-derived threat acceleration modeled from pre-disaster baseline (T-18h) to live peak cascade (T-0h)
                      </p>
                    </div>
                  </div>

                  {/* Active Step Intensity Pill */}
                  <div className="flex items-center gap-2">
                    <div className="text-right font-mono">
                      <div className="text-[10px] text-slate-400 uppercase">
                        Current Phase ({timelineIntensityData[timelineStep]?.label || "Active"})
                      </div>
                      <div className="text-sm font-bold text-rose-400 flex items-center justify-end gap-1">
                        <Activity className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                        <span>{timelineIntensityData[timelineStep]?.intensity || 96}% Risk Intensity</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase border ${
                      timelineIntensityData[timelineStep]?.severityColor || "text-rose-400 border-rose-500/40 bg-rose-500/15"
                    }`}>
                      {timelineIntensityData[timelineStep]?.severity || "CRITICAL CASCADE"}
                    </span>
                  </div>
                </div>

                {/* Step Selector Chips / Scrubbing Control */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Select timeline step to analyze historical state:</span>
                  </span>
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded p-1">
                    {timelineIntensityData.map((stepData) => {
                      const isCurrent = stepData.step === timelineStep;
                      return (
                        <button
                          key={stepData.step}
                          type="button"
                          onClick={() => onTimelineStepChange?.(stepData.step)}
                          className={`px-2 py-1 rounded text-[10px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
                            isCurrent
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/50 font-bold shadow-xs"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                          }`}
                          title={`${stepData.label} (${stepData.utcTime}): ${stepData.intensity}% intensity`}
                        >
                          <span>{stepData.label}</span>
                          <span className={`text-[9px] ${isCurrent ? "text-rose-400" : "text-slate-500"}`}>
                            {stepData.intensity}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SVG Area Chart / Sparkline */}
                <div className="relative w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 overflow-hidden">
                  <svg
                    viewBox="0 0 540 130"
                    className="w-full h-36 select-none"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="riskAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.45" />
                        <stop offset="45%" stopColor="#f59e0b" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
                      </linearGradient>
                      <linearGradient id="riskLineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="30%" stopColor="#eab308" />
                        <stop offset="70%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#f43f5e" />
                      </linearGradient>
                      <filter id="areaGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Horizontal grid lines & y-axis labels */}
                    <g className="opacity-40">
                      <line x1="48" y1="18" x2="504" y2="18" stroke="#475569" strokeDasharray="3 3" />
                      <line x1="48" y1="40" x2="504" y2="40" stroke="#334155" strokeDasharray="3 3" />
                      <line x1="48" y1="61" x2="504" y2="61" stroke="#334155" strokeDasharray="3 3" />
                      <line x1="48" y1="83" x2="504" y2="83" stroke="#334155" strokeDasharray="3 3" />
                      <line x1="48" y1="104" x2="504" y2="104" stroke="#475569" />
                    </g>

                    {/* Y-axis markers */}
                    <text x="40" y="22" textAnchor="end" fontSize="9" fontFamily="monospace" fill="#64748b">100%</text>
                    <text x="40" y="65" textAnchor="end" fontSize="9" fontFamily="monospace" fill="#64748b">50%</text>
                    <text x="40" y="107" textAnchor="end" fontSize="9" fontFamily="monospace" fill="#64748b">0%</text>

                    {/* Area polygon fill */}
                    <path d={areaPath} fill="url(#riskAreaGrad)" />

                    {/* Glowing curve stroke */}
                    <path
                      d={linePath}
                      fill="none"
                      stroke="url(#riskLineGrad)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#areaGlow)"
                    />
                    <path
                      d={linePath}
                      fill="none"
                      stroke="url(#riskLineGrad)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Vertical guideline for active timeline step */}
                    {chartPoints[timelineStep] && (
                      <g>
                        <line
                          x1={chartPoints[timelineStep].x}
                          y1="18"
                          x2={chartPoints[timelineStep].x}
                          y2="104"
                          stroke="#f43f5e"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                          opacity="0.8"
                        />
                        <circle
                          cx={chartPoints[timelineStep].x}
                          cy={chartPoints[timelineStep].y}
                          r="11"
                          fill="none"
                          stroke="#f43f5e"
                          strokeWidth="1.5"
                          className="animate-ping"
                          opacity="0.6"
                        />
                      </g>
                    )}

                    {/* Data Points */}
                    {chartPoints.map((p, idx) => {
                      const isActive = p.step === timelineStep;
                      const isHovered = p.step === hoveredStepIndex;
                      return (
                        <g key={p.step} className="cursor-pointer">
                          {/* Invisible hit area */}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="18"
                            fill="transparent"
                            onMouseEnter={() => setHoveredStepIndex(idx)}
                            onMouseLeave={() => setHoveredStepIndex(null)}
                            onClick={() => onTimelineStepChange?.(p.step)}
                          />

                          {/* Outer point ring */}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={isActive ? "6" : isHovered ? "5.5" : "4"}
                            fill={isActive ? "#f43f5e" : "#0f172a"}
                            stroke={isActive ? "#ffffff" : isHovered ? "#38bdf8" : p.step <= timelineStep ? "#06b6d4" : "#475569"}
                            strokeWidth={isActive ? "2.5" : "2"}
                            className="transition-all duration-150"
                          />

                          {/* Value label above point */}
                          <text
                            x={p.x}
                            y={p.y - 10}
                            textAnchor="middle"
                            fontSize={isActive ? "10" : "9"}
                            fontWeight={isActive ? "bold" : "600"}
                            fontFamily="monospace"
                            fill={isActive ? "#fecdd3" : isHovered ? "#38bdf8" : "#94a3b8"}
                          >
                            {p.intensity}%
                          </text>

                          {/* X-axis Step Label */}
                          <text
                            x={p.x}
                            y="120"
                            textAnchor="middle"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight={isActive ? "bold" : "normal"}
                            fill={isActive ? "#f43f5e" : isHovered ? "#38bdf8" : "#64748b"}
                          >
                            {p.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Interactive Dynamic Telemetry Inspector Bar */}
                {(() => {
                  const inspectIdx = hoveredStepIndex !== null ? hoveredStepIndex : timelineStep;
                  const item = timelineIntensityData[inspectIdx] || timelineIntensityData[0];
                  return (
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">
                            PHASE {item.step + 1} OF 5: {item.label} ({item.utcTime})
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${item.severityColor}`}>
                            {item.intensity}% INTENSITY · {item.severity}
                          </span>
                          {hoveredStepIndex !== null && (
                            <span className="text-[10px] text-cyan-400">(Hover Preview)</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 font-sans">
                          {item.eventDescription}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-slate-400 shrink-0">
                        <div>
                          <span className="text-slate-500">Active Hazards: </span>
                          <strong className="text-rose-400">{item.activeHazardsCount}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Threatened Infra: </span>
                          <strong className="text-amber-400">{item.activeInfraCount}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Sensor Overpass: </span>
                          <span className="text-cyan-300">{item.satelliteAction.split(" ")[0]}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Trajectory Insights Footer */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px] font-mono">
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">18h Overall Surge</span>
                    <span className="text-rose-400 font-bold">
                      +{timelineIntensityData[4]?.intensity - timelineIntensityData[0]?.intensity}% Escalation
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Peak Velocity Trigger</span>
                    <span className="text-amber-300 font-bold">Phase 3 (T-6h Onset)</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Critical SPOF Horizon</span>
                    <span className="text-cyan-300 font-bold">{metrics.spofCount} Bottlenecks At Risk</span>
                  </div>
                </div>
              </div>

              {/* Section 1: PageRank Criticality Ranking Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">
                      Infrastructure Centrality Rankings (PageRank)
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Highest downstream utility dependencies
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-lg">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-3">Rank</th>
                        <th className="p-3">Infrastructure Asset</th>
                        <th className="p-3">PageRank Score</th>
                        <th className="p-3">In / Out Degree</th>
                        <th className="p-3">Cascade Consequence</th>
                        <th className="p-3">Backup Autonomy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 font-sans">
                      {metrics.topBottlenecks.map((item, idx) => (
                        <tr key={item.node.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="p-3 font-mono font-bold text-amber-400">
                            #{idx + 1}
                          </td>
                          <td className="p-3 font-semibold text-white">
                            <div>{item.node.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">ID: {item.node.id} · :{item.node.label}</div>
                          </td>
                          <td className="p-3 font-mono font-bold text-rose-400">
                            {item.score}
                          </td>
                          <td className="p-3 font-mono text-slate-300">
                            {item.inDegree} in / {item.outDegree} out
                          </td>
                          <td className="p-3 text-slate-300 text-[11px]">
                            {item.node.properties.notes || item.node.properties.description || "Powers critical healthcare and municipal drainage grid"}
                          </td>
                          <td className="p-3 font-mono text-amber-300 text-[11px]">
                            {item.node.properties.backupFuelHours ?? "0h (Direct Grid)"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 2: Vulnerable Populations & Evacuation Corridors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vulnerable Communities */}
                <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-purple-400">
                    <Users className="w-4 h-4" />
                    <h4 className="font-semibold text-white text-xs uppercase font-mono tracking-wider">
                      Vulnerable Communities in Inundation Path
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {metrics.populationNodes.map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-200 text-xs">{p.name}</div>
                          <div className="text-[10px] text-slate-400">
                            Risk Factor: {p.properties.vulnerableFactor || "Floodplain low terrain"}
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="text-xs font-bold text-purple-300">
                            {Number(p.properties.size || p.properties.population || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500">citizens</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Safe Zones & Shelters */}
                <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-teal-400">
                    <Building className="w-4 h-4" />
                    <h4 className="font-semibold text-white text-xs uppercase font-mono tracking-wider">
                      Designated Safe Zones & Shelters
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {metrics.safeZoneNodes.map((s) => (
                      <div
                        key={s.id}
                        className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-200 text-xs">{s.name}</div>
                          <div className="text-[10px] text-slate-400">
                            Status: <span className="text-emerald-400 font-medium">{s.properties.status || "Operational"}</span>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="text-xs font-bold text-teal-300">
                            {Number(s.properties.currentOccupancy || 0).toLocaleString()} / {Number(s.properties.capacity || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500">beds occupied</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 3: Immediate Tactical Directives */}
              <div className="p-4 rounded-lg bg-slate-950/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">
                      Immediate Tactical Directives (First 60 Minutes)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">
                    Incident Command Authorized
                  </span>
                </div>

                <div className="space-y-2 font-sans text-xs">
                  <div className="p-3 rounded bg-slate-900 border border-slate-800 flex items-start gap-3">
                    <div className="p-1 rounded bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">
                        1. Deploy Dewatering Pumps to Substation Beta
                      </div>
                      <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">
                        Flood level within 35cm of critical transformer bus bars. Losing this node triggers downstream shutdown of St. Jude Hospital ICU and North Pumping Station.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded bg-slate-900 border border-slate-800 flex items-start gap-3">
                    <div className="p-1 rounded bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">
                        2. Emergency Fuel Tanker Escort to Regional Trauma Center
                      </div>
                      <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">
                        St. Jude generator fuel reserves estimated at 14 hours. Route fuel convoy via North High Elevation Corridor to avoid compromised eastern causeway.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded bg-slate-900 border border-slate-800 flex items-start gap-3">
                    <div className="p-1 rounded bg-teal-500/20 text-teal-400 shrink-0 mt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">
                        3. Open Secondary Safe Zone Auxiliary Facilities
                      </div>
                      <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">
                        Current municipal shelter occupancy at 65%. Prepare auxiliary tents and potable water distribution for overflow from Sundarbans coastal hamlets.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: Responder Manual Assessment & Custom Field Notes */}
              <div className="p-4 rounded-lg bg-slate-950/90 border border-slate-700/80 space-y-3.5 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                      <PenTool className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider flex items-center gap-2">
                        <span>5. Responder Manual Assessment & Field Notes</span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Append on-scene observations, priority overrides, and tactical ground-truth into the exported report
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      Appends Live to All Exports (.txt, .md, Copy, Print)
                    </span>
                    {customNotes.trim() && (
                      <button
                        onClick={() => setCustomNotes("")}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700 text-[10px] font-mono transition-colors cursor-pointer"
                        title="Clear custom field notes"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Priority Status & Assessor Identification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                      Operational Priority Level
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {(
                        [
                          { key: "CRITICAL", label: "CRITICAL" },
                          { key: "ACTION_REQUIRED", label: "ACTION REQ" },
                          { key: "OBSERVATION", label: "OBSERVE" },
                          { key: "ALL_CLEAR", label: "ALL CLEAR" },
                        ] as const
                      ).map((item) => {
                        const active = assessmentStatus === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setAssessmentStatus(item.key)}
                            className={`px-2 py-1.5 rounded text-[10px] font-mono font-bold uppercase transition-all cursor-pointer text-center ${
                              active
                                ? item.key === "CRITICAL"
                                  ? "bg-rose-500/25 border-rose-500 text-rose-300 shadow-xs border"
                                  : item.key === "ACTION_REQUIRED"
                                  ? "bg-amber-500/25 border-amber-500 text-amber-300 shadow-xs border"
                                  : item.key === "OBSERVATION"
                                  ? "bg-cyan-500/25 border-cyan-500 text-cyan-300 shadow-xs border"
                                  : "bg-emerald-500/25 border-emerald-500 text-emerald-300 shadow-xs border"
                                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                      Assessor Identity / CAD Callsign
                    </label>
                    <input
                      type="text"
                      value={assessorName}
                      onChange={(e) => setAssessorName(e.target.value)}
                      placeholder="e.g. Commander Sarah Chen (UN-SPIDER Alpha-1)"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded text-slate-200 text-xs font-mono outline-hidden transition-colors"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
                      Quick Tactical Presets (Click to append):
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_TACTICAL_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleAppendPreset(preset.text)}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded text-[10px] font-mono text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes Textarea */}
                <div className="space-y-1.5">
                  <textarea
                    rows={4}
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="Type responder field observations, road obstructions, shelter overflow notes, or specific resource requests here... These notes are automatically appended into Section 5 of the generated report before downloading or copying."
                    className="w-full p-3 bg-slate-900/90 border border-slate-700/80 focus:border-cyan-400 rounded-lg text-slate-100 placeholder:text-slate-500 font-mono text-xs leading-relaxed outline-hidden resize-y shadow-inner transition-colors"
                  />
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>
                      {customNotes.trim()
                        ? `${customNotes.trim().length} characters · ${customNotes.trim().split(/\s+/).length} words appended`
                        : "No custom notes yet · Report will export standard graph metrics"}
                    </span>
                    <span className="text-cyan-400 font-medium">
                      Status: [{assessmentStatus}] · Ready for dispatch
                    </span>
                  </div>
                </div>
              </div>

              {/* Optional AI Expansion Box */}
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <h4 className="font-bold text-white text-xs font-mono uppercase tracking-wider">
                      Gemini Live Situational Expansion
                    </h4>
                  </div>
                  <button
                    onClick={handleFetchAiExpansion}
                    disabled={isAiLoading}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-mono text-xs font-semibold rounded shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>{isAiLoading ? "Synthesizing AI SITREP..." : "Generate AI Advisory"}</span>
                  </button>
                </div>

                {aiAnalysis ? (
                  <pre className="p-3 bg-slate-900 border border-slate-800 rounded font-mono text-[11px] text-cyan-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {aiAnalysis}
                  </pre>
                ) : (
                  <p className="text-slate-500 text-xs">
                    Click &ldquo;Generate AI Advisory&rdquo; to query Gemini 3.8 Flash for an expanded satellite sensor tasking brief and dynamic risk synthesis.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB B: MONOSPACE RAW TEXT TERMINAL VIEW (.txt) */}
          {viewMode === "rawText" && (
            <div className="space-y-3">
              {/* Inline Quick Notes Editor Drawer for Raw View */}
              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <PenTool className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-semibold text-white">Manual Assessment & Field Notes:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      customNotes.trim() ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
                    }`}>
                      {customNotes.trim() ? `${customNotes.trim().length} chars appended in Section 5` : "Empty (Default Telemetry Only)"}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowNotesDrawer(!showNotesDrawer)}
                    className="text-cyan-400 hover:text-cyan-300 text-[11px] underline flex items-center gap-1 cursor-pointer"
                  >
                    <FileEdit className="w-3 h-3" />
                    <span>{showNotesDrawer ? "Hide Notes Editor" : "Edit Custom Notes"}</span>
                  </button>
                </div>

                {showNotesDrawer && (
                  <div className="pt-2 space-y-2 border-t border-slate-800 animate-in fade-in duration-150">
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_TACTICAL_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleAppendPreset(preset.text)}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[10px] font-mono text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={3}
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      placeholder="Type custom responder field assessment here to update the report in real time..."
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:border-cyan-400 outline-hidden"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>FORMAT: ASCII FIXED-WIDTH DISPATCH REPORT (SUITABLE FOR LOW-BANDWIDTH RADIO/CAD)</span>
                <button
                  onClick={handleCopy}
                  className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? "Copied" : "Copy All"}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-slate-200 leading-relaxed overflow-x-auto max-h-[60vh] select-all shadow-inner">
                  {plainTextReport}
                </pre>
              </div>
            </div>
          )}

          {/* TAB C: MARKDOWN VIEW (.md) */}
          {viewMode === "markdown" && (
            <div className="space-y-3">
              {/* Inline Quick Notes Editor Drawer for Markdown View */}
              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <PenTool className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-semibold text-white">Manual Assessment & Field Notes:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      customNotes.trim() ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
                    }`}>
                      {customNotes.trim() ? `${customNotes.trim().length} chars appended in Section 5` : "Empty (Default Telemetry Only)"}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowNotesDrawer(!showNotesDrawer)}
                    className="text-cyan-400 hover:text-cyan-300 text-[11px] underline flex items-center gap-1 cursor-pointer"
                  >
                    <FileEdit className="w-3 h-3" />
                    <span>{showNotesDrawer ? "Hide Notes Editor" : "Edit Custom Notes"}</span>
                  </button>
                </div>

                {showNotesDrawer && (
                  <div className="pt-2 space-y-2 border-t border-slate-800 animate-in fade-in duration-150">
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_TACTICAL_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleAppendPreset(preset.text)}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[10px] font-mono text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={3}
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      placeholder="Type custom responder field assessment here to update the markdown report in real time..."
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:border-cyan-400 outline-hidden"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>FORMAT: GITHUB-FLAVORED MARKDOWN (.md)</span>
                <button
                  onClick={handleCopy}
                  className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? "Copied" : "Copy All"}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-emerald-300 leading-relaxed overflow-x-auto max-h-[60vh] select-all shadow-inner">
                  {markdownReport}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-950 border-t border-slate-800 text-xs font-mono text-slate-400">
          <div>
            <span>ORBISYNC DISASTER INTELLIGENCE PLATFORM · GROUND TRUTH SATELLITE & LPG NETWORK</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-sans transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
