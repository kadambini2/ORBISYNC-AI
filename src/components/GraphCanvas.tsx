import React, { useState, useEffect, useRef, useMemo } from "react";
import { GraphNode, GraphRelationship } from "../data/graphData";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Eye,
  Info,
  Layers,
  ChevronRight,
  X,
  Zap,
  Radio,
  Building,
  Users,
  ShieldCheck,
  Compass,
  AlertTriangle,
  Download,
  FileJson,
  Image as ImageIcon,
  Check,
  Pin,
  Trash2,
  Tag,
  Plus,
  EyeOff,
  MessageSquare,
  Flame,
  Sliders,
  ShieldAlert,
} from "lucide-react";

export interface GraphAnnotation {
  id: string;
  x: number;
  y: number;
  author: string;
  category: "Critical" | "Tactical" | "Field" | "Evacuation";
  content: string;
  timestamp: string;
  color: "amber" | "rose" | "cyan" | "emerald";
}

const DEFAULT_ANNOTATIONS: GraphAnnotation[] = [
  {
    id: "note-substation-crest",
    x: 480,
    y: 340,
    author: "Cmdr. Rowe",
    category: "Critical",
    content: "Substation Beta flood wall at 1.65m. Water cresting in 45 min. Sandbagging deployed.",
    timestamp: "12:45 UTC",
    color: "amber",
  },
  {
    id: "note-hosp-fuel",
    x: 620,
    y: 220,
    author: "Dr. Vance",
    category: "Tactical",
    content: "St. Jude ICU generator fuel reserves: 14 hrs. Prioritize fuel tanker convoy via High Route.",
    timestamp: "13:10 UTC",
    color: "rose",
  },
];

interface GraphCanvasProps {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  highlightedNodeIds?: string[];
  highlightedRelIds?: string[];
  onSelectNode?: (node: GraphNode | null) => void;
  selectedNode?: GraphNode | null;
  timelineStep?: number;
  currentAuthor?: string;
}

const LABEL_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  Satellite: { bg: "#083344", border: "#06b6d4", text: "#67e8f9", glow: "rgba(6,182,212,0.3)" },
  Observation: { bg: "#0c2b4d", border: "#38bdf8", text: "#bae6fd", glow: "rgba(56,189,248,0.3)" },
  HazardEvent: { bg: "#4c0519", border: "#f43f5e", text: "#fecdd3", glow: "rgba(244,63,94,0.4)" },
  GeographicEntity: { bg: "#064e3b", border: "#10b981", text: "#a7f3d0", glow: "rgba(16,185,129,0.3)" },
  Infrastructure: { bg: "#451a03", border: "#f59e0b", text: "#fde68a", glow: "rgba(245,158,11,0.35)" },
  VulnerablePopulation: { bg: "#2e1065", border: "#a855f7", text: "#e9d5ff", glow: "rgba(168,85,247,0.3)" },
  SafeZone: { bg: "#134e4a", border: "#14b8a6", text: "#99f6e4", glow: "rgba(20,184,166,0.35)" },
};

const ANNOTATION_STYLES: Record<
  GraphAnnotation["color"],
  { bg: string; border: string; headerBg: string; text: string; badge: string; pinFill: string }
> = {
  amber: {
    bg: "#1c1407",
    border: "#f59e0b",
    headerBg: "#78350f",
    text: "#fef3c7",
    badge: "#fde68a",
    pinFill: "#fbbf24",
  },
  rose: {
    bg: "#1f070e",
    border: "#f43f5e",
    headerBg: "#881337",
    text: "#ffe4e6",
    badge: "#fecdd3",
    pinFill: "#fb7185",
  },
  cyan: {
    bg: "#051821",
    border: "#06b6d4",
    headerBg: "#155e75",
    text: "#cffafe",
    badge: "#a5f3fc",
    pinFill: "#38bdf8",
  },
  emerald: {
    bg: "#041a14",
    border: "#10b981",
    headerBg: "#065f46",
    text: "#d1fae5",
    badge: "#a7f3d0",
    pinFill: "#34d399",
  },
};

function wrapText(text: string, maxCharsPerLine = 24): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, 4);
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  relationships,
  highlightedNodeIds = [],
  highlightedRelIds = [],
  onSelectNode,
  selectedNode: externalSelectedNode,
  timelineStep = 4,
  currentAuthor = "Cmdr. Rowe",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [internalSelectedNode, setInternalSelectedNode] = useState<GraphNode | null>(null);
  const selectedNode = externalSelectedNode !== undefined ? externalSelectedNode : internalSelectedNode;
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Sticky Notes / Annotations State with localStorage persistence
  const [annotations, setAnnotations] = useState<GraphAnnotation[]>(() => {
    try {
      const stored = localStorage.getItem("orbisync_annotations");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Failed to load annotations from localStorage:", e);
    }
    return DEFAULT_ANNOTATIONS;
  });

  const [isPinMode, setIsPinMode] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [draggingAnnotationId, setDraggingAnnotationId] = useState<string | null>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

  // New Note Modal / Popover state
  const [newNoteModalCoords, setNewNoteModalCoords] = useState<{ x: number; y: number } | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState<GraphAnnotation["category"]>("Critical");
  const [newNoteColor, setNewNoteColor] = useState<GraphAnnotation["color"]>("amber");

  // Save annotations to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("orbisync_annotations", JSON.stringify(annotations));
    } catch (e) {
      console.warn("Failed to save annotations to localStorage:", e);
    }
  }, [annotations]);

  // Vulnerability Heatmap Overlay State
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapIntensity, setHeatmapIntensity] = useState<"standard" | "high" | "thermal">("standard");

  // Calculate node vulnerability & PageRank centrality scores for the heatmap overlay
  const centralityScores = useMemo(() => {
    const scores: Record<
      string,
      {
        score: number;
        normalizedScore: number;
        rank: number;
        level: "CRITICAL" | "HIGH" | "ELEVATED" | "BASELINE";
        inDegree: number;
        outDegree: number;
      }
    > = {};

    const rawScores = nodes.map((node) => {
      const inDegree = relationships.filter((r) => r.target === node.id).length;
      const outDegree = relationships.filter((r) => r.source === node.id).length;

      // Base PageRank dependency weight
      let score = outDegree * 2.2 + inDegree * 1.1;

      // Criticality level booster
      const crit = String(node.properties.criticality || "").toLowerCase();
      if (crit.includes("extreme") || crit.includes("single-point-of-failure")) score += 4.5;
      else if (crit.includes("critical")) score += 3.0;
      else if (crit.includes("high")) score += 1.8;

      // Inundation/physical risk factor
      const risk = Number(node.properties.inundationRisk || node.properties.failureProbability || 0);
      if (risk > 0) score += (risk / 100) * 3.0;

      // Population impact factor
      if (node.properties.population || node.properties.servesCustomers) {
        score += 1.8;
      }

      const rounded = Number(score.toFixed(1));
      return { id: node.id, score: rounded, inDegree, outDegree };
    });

    const maxScore = Math.max(...rawScores.map((s) => s.score), 1);
    const minScore = Math.min(...rawScores.map((s) => s.score), 0);
    const range = Math.max(maxScore - minScore, 0.1);

    // Sort descending to assign ranks
    const sorted = [...rawScores].sort((a, b) => b.score - a.score);

    sorted.forEach((item, index) => {
      const normalized = Math.max(0.12, Math.min(1.0, (item.score - minScore) / range));
      let level: "CRITICAL" | "HIGH" | "ELEVATED" | "BASELINE" = "BASELINE";
      if (normalized >= 0.72) level = "CRITICAL";
      else if (normalized >= 0.45) level = "HIGH";
      else if (normalized >= 0.22) level = "ELEVATED";

      scores[item.id] = {
        score: item.score,
        normalizedScore: normalized,
        rank: index + 1,
        level,
        inDegree: item.inDegree,
        outDegree: item.outDegree,
      };
    });

    return scores;
  }, [nodes, relationships]);

  // Top critical bottleneck nodes for quick focus in heatmap legend
  const topCriticalNodes = useMemo(() => {
    return Object.entries(centralityScores)
      .map(([id, data]) => ({ node: nodes.find((n) => n.id === id)!, ...data }))
      .filter((item) => item.node)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [nodes, centralityScores]);

  // Viewport transform: zoom & pan
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Filter by label
  const [activeLabelFilters, setActiveLabelFilters] = useState<Record<string, boolean>>({
    Satellite: true,
    Observation: true,
    HazardEvent: true,
    GeographicEntity: true,
    Infrastructure: true,
    VulnerablePopulation: true,
    SafeZone: true,
  });

  // Dragging node state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  // Positioned nodes map
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});

  // Initialize force-like stable circular/hierarchical positions when scenario or nodes change
  useEffect(() => {
    const width = 900;
    const height = 580;
    const centerX = width / 2;
    const centerY = height / 2;

    const initialPositions: Record<string, { x: number; y: number }> = {};

    // Group nodes by label layer
    const layerOffsets: Record<string, { rx: number; ry: number; angleOffset: number }> = {
      Satellite: { rx: 360, ry: 220, angleOffset: -Math.PI / 2 },
      Observation: { rx: 270, ry: 170, angleOffset: -Math.PI / 3 },
      HazardEvent: { rx: 70, ry: 60, angleOffset: 0 },
      GeographicEntity: { rx: 170, ry: 120, angleOffset: Math.PI / 4 },
      Infrastructure: { rx: 280, ry: 190, angleOffset: Math.PI / 2 },
      VulnerablePopulation: { rx: 370, ry: 240, angleOffset: (5 * Math.PI) / 6 },
      SafeZone: { rx: 390, ry: 230, angleOffset: Math.PI / 6 },
    };

    const grouped: Record<string, GraphNode[]> = {};
    for (const node of nodes) {
      if (!grouped[node.label]) grouped[node.label] = [];
      grouped[node.label].push(node);
    }

    for (const [label, groupNodes] of Object.entries(grouped)) {
      const cfg = layerOffsets[label] || { rx: 200, ry: 150, angleOffset: 0 };
      const count = groupNodes.length;

      groupNodes.forEach((node, idx) => {
        const angle = cfg.angleOffset + (idx / Math.max(count, 1)) * (Math.PI * 0.8) - 0.4;
        initialPositions[node.id] = {
          x: centerX + Math.cos(angle) * cfg.rx + (Math.random() * 20 - 10),
          y: centerY + Math.sin(angle) * cfg.ry + (Math.random() * 20 - 10),
        };
      });
    }

    setNodePositions(initialPositions);
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, [nodes]);

  // Handle Pan and Annotation Pinning
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".hud-button") || (e.target as HTMLElement).closest(".annotation-dialog")) {
      return;
    }

    if (isPinMode) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;
      setNewNoteModalCoords({ x: Math.round(mouseX), y: Math.round(mouseY) });
      setIsPinMode(false);
      return;
    }

    if ((e.target as HTMLElement).closest(".node-group") || (e.target as HTMLElement).closest(".annotation-group")) {
      return;
    }
    setIsPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else if (draggingNodeId) {
      // Node drag update
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;

      setNodePositions((prev) => ({
        ...prev,
        [draggingNodeId]: { x: mouseX, y: mouseY },
      }));
    } else if (draggingAnnotationId) {
      // Annotation sticky note drag update
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;

      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === draggingAnnotationId
            ? { ...a, x: Math.round(mouseX), y: Math.round(mouseY) }
            : a
        )
      );
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
    setDraggingAnnotationId(null);
  };

  const handleCreateAnnotation = () => {
    if (!newNoteModalCoords || !newNoteContent.trim()) return;

    const now = new Date();
    const utcHours = String(now.getUTCHours()).padStart(2, "0");
    const utcMins = String(now.getUTCMinutes()).padStart(2, "0");

    const newNote: GraphAnnotation = {
      id: `note-${Date.now()}`,
      x: newNoteModalCoords.x,
      y: newNoteModalCoords.y,
      author: currentAuthor || "Cmdr. Rowe",
      category: newNoteCategory,
      content: newNoteContent.trim(),
      timestamp: `${utcHours}:${utcMins} UTC`,
      color: newNoteColor,
    };

    setAnnotations((prev) => [...prev, newNote]);
    setNewNoteModalCoords(null);
    setNewNoteContent("");
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  };

  // Node Click
  const handleNodeClick = (node: GraphNode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectNode) {
      onSelectNode(node);
    } else {
      setInternalSelectedNode(node);
    }
  };

  // Filtered nodes and relationships based on label filters AND timelineStep
  const visibleNodes = useMemo(() => {
    return nodes.filter(
      (n) =>
        activeLabelFilters[n.label] &&
        (n.timeStep === undefined || n.timeStep <= timelineStep)
    );
  }, [nodes, activeLabelFilters, timelineStep]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

  const visibleRelationships = useMemo(() => {
    return relationships.filter(
      (r) =>
        (r.timeStep === undefined || r.timeStep <= timelineStep) &&
        visibleNodeIds.has(r.source) &&
        visibleNodeIds.has(r.target)
    );
  }, [relationships, visibleNodeIds, timelineStep]);

  const toggleFilter = (label: string) => {
    setActiveLabelFilters((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const getNodeIcon = (label: string) => {
    switch (label) {
      case "Satellite":
        return <Radio className="w-3.5 h-3.5 text-cyan-400" />;
      case "Observation":
        return <Compass className="w-3.5 h-3.5 text-sky-400" />;
      case "HazardEvent":
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      case "GeographicEntity":
        return <Layers className="w-3.5 h-3.5 text-emerald-400" />;
      case "Infrastructure":
        return <Building className="w-3.5 h-3.5 text-amber-400" />;
      case "VulnerablePopulation":
        return <Users className="w-3.5 h-3.5 text-purple-400" />;
      case "SafeZone":
        return <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />;
      default:
        return <Zap className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const handleExportPNG = () => {
    if (!svgRef.current) return;
    const svgEl = svgRef.current;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgEl);

    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const dpr = 2;
      const width = 1200;
      const height = 750;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.scale(dpr, dpr);

      // Deep space background
      ctx.fillStyle = "#070b13";
      ctx.fillRect(0, 0, width, height);

      // Precision coordinate grid dots
      ctx.fillStyle = "#1e293b";
      for (let x = 0; x < width; x += 24) {
        for (let y = 0; y < height; y += 24) {
          ctx.fillRect(x, y, 1.5, 1.5);
        }
      }

      // Draw SVG graph visualization
      ctx.drawImage(img, 0, 0, width, height);

      // Tactical Header Banner
      ctx.fillStyle = "rgba(11, 15, 23, 0.94)";
      ctx.fillRect(0, 0, width, 44);
      ctx.strokeStyle = "rgba(51, 65, 85, 0.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 44);
      ctx.lineTo(width, 44);
      ctx.stroke();

      ctx.font = "bold 13px system-ui, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("ORBISYNC — Space Data & Disaster Intelligence Platform", 20, 26);

      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#06b6d4";
      ctx.fillText("TAGLINE: Connect Space. Decode Earth. Protect Tomorrow. · Neo4j LPG Graph Snapshot", 520, 26);

      // Bottom Telemetry Watermark
      ctx.fillStyle = "rgba(11, 15, 23, 0.94)";
      ctx.fillRect(0, height - 32, width, 32);
      ctx.strokeStyle = "rgba(51, 65, 85, 0.7)";
      ctx.beginPath();
      ctx.moveTo(0, height - 32);
      ctx.lineTo(width, height - 32);
      ctx.stroke();

      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(`CLASSIFICATION: UN-SPIDER Rapid Action · Active Nodes: ${visibleNodes.length} · Edges: ${visibleRelationships.length}${showHeatmap ? " · [HEATMAP ACTIVE: PageRank Centrality Overlay]" : ""} · Exported: ${new Date().toUTCString()}`, 20, height - 12);

      const a = document.createElement("a");
      a.download = `orbisync-graph-report-${Date.now()}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      URL.revokeObjectURL(url);

      setExportSuccess("Exported PNG");
      setTimeout(() => setExportSuccess(null), 2500);
      setShowExportMenu(false);
    };
    img.src = url;
  };

  const handleExportJSON = () => {
    const exportData = {
      platform: "ORBISYNC",
      tagline: "Connect Space. Decode Earth. Protect Tomorrow.",
      schema: "Neo4j Labeled Property Graph (LPG)",
      exportedAtUtc: new Date().toUTCString(),
      stats: {
        totalVisibleNodes: visibleNodes.length,
        totalVisibleRelationships: visibleRelationships.length,
        heatmapActive: showHeatmap,
      },
      nodes: visibleNodes.map(n => ({
        id: n.id,
        label: n.label,
        name: n.name,
        timeStep: n.timeStep,
        properties: n.properties,
        pageRankCriticality: centralityScores[n.id] || null,
      })),
      relationships: visibleRelationships.map(r => ({
        id: r.id,
        source: r.source,
        target: r.target,
        type: r.type,
        timeStep: r.timeStep,
        properties: r.properties
      })),
      annotations: annotations.map(a => ({
        id: a.id,
        x: a.x,
        y: a.y,
        author: a.author,
        category: a.category,
        content: a.content,
        timestamp: a.timestamp,
        color: a.color
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = `orbisync-knowledge-graph-${Date.now()}.json`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);

    setExportSuccess("Exported JSON");
    setTimeout(() => setExportSuccess(null), 2500);
    setShowExportMenu(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative w-full h-[620px] bg-slate-950 border border-slate-800 rounded-lg overflow-hidden select-none cursor-grab active:cursor-grabbing"
    >
      {/* Background Coordinate Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #334155 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Top HUD Controls: Zoom, Reset, Export and Filter Toggles */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-md shadow-md">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}
            className="hud-button p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))}
            className="hud-button p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="hud-button p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors"
            title="Reset View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-400 px-1.5 border-l border-slate-700">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Offline Reporting Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 px-2.5 py-1.5 rounded-md text-xs font-mono text-slate-200 transition-colors shadow-md"
            title="Export Graph for Offline Reporting"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>{exportSuccess || "Export Graph"}</span>
          </button>

          {showExportMenu && (
            <div className="absolute left-0 mt-1.5 w-52 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl p-1.5 z-40 space-y-1 font-mono text-xs animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={handleExportPNG}
                className="w-full text-left px-3 py-2 rounded hover:bg-slate-800 text-slate-200 flex items-center gap-2 transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="font-semibold text-white">Export High-Res PNG</div>
                  <div className="text-[10px] text-slate-400 font-sans">2x DPI with metadata watermark</div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportJSON}
                className="w-full text-left px-3 py-2 rounded hover:bg-slate-800 text-slate-200 flex items-center gap-2 transition-colors"
              >
                <FileJson className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-semibold text-white">Export Neo4j JSON</div>
                  <div className="text-[10px] text-slate-400 font-sans">Filtered LPG nodes & edges</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Sticky Notes & Annotations HUD Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-md shadow-md">
          <button
            onClick={() => setIsPinMode(!isPinMode)}
            className={`hud-button flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-all border ${
              isPinMode
                ? "bg-amber-500 text-slate-950 font-semibold border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse"
                : "hover:bg-slate-800 text-slate-200 border-transparent hover:border-slate-700"
            }`}
            title={isPinMode ? "Click anywhere on graph canvas to place note" : "Pin sticky note to canvas"}
          >
            <Pin className={`w-3.5 h-3.5 ${isPinMode ? "fill-current" : "text-amber-400"}`} />
            <span>{isPinMode ? "Placing Note..." : "Pin Note"}</span>
          </button>

          <button
            onClick={() => setShowAnnotations(!showAnnotations)}
            className={`hud-button flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono transition-colors border ${
              showAnnotations
                ? "hover:bg-slate-800 text-slate-200 border-transparent hover:border-slate-700"
                : "bg-slate-950/80 text-slate-500 border-slate-800"
            }`}
            title={showAnnotations ? "Hide sticky notes on canvas" : "Show sticky notes on canvas"}
          >
            {showAnnotations ? (
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className="text-[11px]">Notes ({annotations.length})</span>
          </button>

          {/* Vulnerability Heatmap Toggle Button */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`hud-button flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-all border ${
              showHeatmap
                ? "bg-rose-950/90 text-rose-300 font-semibold border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                : "hover:bg-slate-800 text-slate-300 border-transparent hover:border-slate-700"
            }`}
            title={showHeatmap ? "Hide Vulnerability Heatmap" : "Visualize node vulnerability glowing heatmap based on PageRank"}
          >
            <Flame className={`w-3.5 h-3.5 ${showHeatmap ? "text-rose-400 fill-rose-500 animate-pulse" : "text-slate-400"}`} />
            <span>Heatmap {showHeatmap ? "ON" : "OFF"}</span>
          </button>
        </div>

        {/* Label Filters HUD */}
        <div className="hidden xl:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-md shadow-md text-xs">
          {Object.entries(LABEL_COLORS).map(([label, style]) => {
            const active = activeLabelFilters[label];
            return (
              <button
                key={label}
                onClick={() => toggleFilter(label)}
                className={`hud-button px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  active
                    ? "bg-slate-800 text-white border border-slate-700"
                    : "opacity-40 text-slate-500 hover:opacity-75"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: style.border }}
                />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Canvas for Neo4j Graph Rendering */}
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        <defs>
          {/* Arrow markers for edges */}
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="24"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#64748b" />
          </marker>

          <marker
            id="arrow-highlighted"
            viewBox="0 0 10 10"
            refX="24"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#f43f5e" />
          </marker>

          {/* PageRank Vulnerability Heatmap Radial Gradients */}
          <radialGradient id="heatmap-glow-critical" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.88" />
            <stop offset="25%" stopColor="#e11d48" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#f59e0b" stopOpacity="0.25" />
            <stop offset="85%" stopColor="#f43f5e" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="heatmap-glow-high" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.75" />
            <stop offset="30%" stopColor="#d97706" stopOpacity="0.45" />
            <stop offset="65%" stopColor="#b45309" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="heatmap-glow-elevated" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.65" />
            <stop offset="35%" stopColor="#0284c7" stopOpacity="0.32" />
            <stop offset="70%" stopColor="#0369a1" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="heatmap-glow-baseline" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
            <stop offset="45%" stopColor="#059669" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Vulnerability Heatmap Overlay Layer (PageRank Centrality) */}
        {showHeatmap && (
          <g className="heatmap-overlay-layer pointer-events-none" style={{ mixBlendMode: "screen" }}>
            {visibleNodes.map((node) => {
              const pos = nodePositions[node.id];
              if (!pos) return null;
              const centrality = centralityScores[node.id];
              if (!centrality) return null;

              const { normalizedScore, level } = centrality;
              const intensityMultiplier =
                heatmapIntensity === "high" ? 1.35 : heatmapIntensity === "thermal" ? 1.6 : 1.0;

              // Radius scales dynamically with PageRank vulnerability score
              const outerRadius = (48 + normalizedScore * 100) * intensityMultiplier;
              const gradId =
                level === "CRITICAL"
                  ? "url(#heatmap-glow-critical)"
                  : level === "HIGH"
                  ? "url(#heatmap-glow-high)"
                  : level === "ELEVATED"
                  ? "url(#heatmap-glow-elevated)"
                  : "url(#heatmap-glow-baseline)";

              return (
                <g key={`heatmap-${node.id}`} transform={`translate(${pos.x}, ${pos.y})`}>
                  {/* Outer Diffuse Thermal Halo */}
                  <circle
                    r={outerRadius}
                    fill={gradId}
                    opacity={level === "CRITICAL" ? 0.95 : 0.8}
                  />

                  {/* Concentric Pulsing Wave Rings for Top Bottlenecks */}
                  {level === "CRITICAL" && (
                    <>
                      <circle
                        r={outerRadius * 0.65}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="1.8"
                        strokeDasharray="4,4"
                        opacity="0.7"
                      />
                      <circle
                        r={outerRadius * 0.35}
                        fill="none"
                        stroke="#fb7185"
                        strokeWidth="2.2"
                        opacity="0.85"
                      />
                    </>
                  )}

                  {/* Secondary thermal ring for High Risk */}
                  {level === "HIGH" && (
                    <circle
                      r={outerRadius * 0.5}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1.2"
                      strokeDasharray="3,3"
                      opacity="0.6"
                    />
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* Relationships (Edges) */}
        <g className="relationships">
          {visibleRelationships.map((rel) => {
            const sourcePos = nodePositions[rel.source];
            const targetPos = nodePositions[rel.target];
            if (!sourcePos || !targetPos) return null;

            const isHighlighted = highlightedRelIds.includes(rel.id);
            const isPowerCascade = rel.type === "FEEDS_POWER_TO";

            const dx = targetPos.x - sourcePos.x;
            const dy = targetPos.y - sourcePos.y;
            const midX = (sourcePos.x + targetPos.x) / 2;
            const midY = (sourcePos.y + targetPos.y) / 2;

            return (
              <g key={rel.id} className="relationship-group">
                <line
                  x1={sourcePos.x}
                  y1={sourcePos.y}
                  x2={targetPos.x}
                  y2={targetPos.y}
                  stroke={isHighlighted ? "#f43f5e" : isPowerCascade ? "#f59e0b" : "#334155"}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  strokeDasharray={isPowerCascade ? "4,3" : "none"}
                  markerEnd={isHighlighted ? "url(#arrow-highlighted)" : "url(#arrow)"}
                  opacity={isHighlighted ? 1 : 0.75}
                />
                {/* Edge Label Badge */}
                <g transform={`translate(${midX}, ${midY})`}>
                  <rect
                    x="-42"
                    y="-9"
                    width="84"
                    height="18"
                    rx="3"
                    fill="#0f172a"
                    stroke={isHighlighted ? "#f43f5e" : "#1e293b"}
                    strokeWidth="1"
                    opacity="0.9"
                  />
                  <text
                    textAnchor="middle"
                    dy="3.5"
                    className="text-[9px] font-mono fill-slate-300 font-medium tracking-tight pointer-events-none"
                  >
                    :{rel.type}
                  </text>
                </g>
              </g>
            );
          })}
        </g>

        {/* Nodes */}
        <g className="nodes">
          {visibleNodes.map((node) => {
            const pos = nodePositions[node.id];
            if (!pos) return null;

            const style = LABEL_COLORS[node.label] || {
              bg: "#1e293b",
              border: "#94a3b8",
              text: "#cbd5e1",
              glow: "none",
            };

            const isSelected = selectedNode?.id === node.id;
            const isHighlighted = highlightedNodeIds.includes(node.id);
            const isHazard = node.label === "HazardEvent";

            const radius = isHazard ? 28 : 22;

            return (
              <g
                key={node.id}
                className="node-group cursor-pointer"
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={(e) => handleNodeClick(node, e)}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDraggingNodeId(node.id);
                }}
              >
                {/* Highlight Glow Ring */}
                {(isSelected || isHighlighted) && (
                  <circle
                    r={radius + 8}
                    fill="none"
                    stroke={isSelected ? "#06b6d4" : "#f43f5e"}
                    strokeWidth="2"
                    strokeDasharray={isSelected ? "none" : "3,2"}
                    opacity="0.9"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  r={radius}
                  fill={style.bg}
                  stroke={isSelected ? "#ffffff" : isHighlighted ? "#f43f5e" : style.border}
                  strokeWidth={isSelected ? 2.5 : 1.8}
                  style={{ filter: `drop-shadow(0 0 6px ${style.glow})` }}
                />

                {/* Node Center Label Abbreviation */}
                <text
                  textAnchor="middle"
                  dy="4"
                  className="text-[10px] font-bold font-mono pointer-events-none uppercase"
                  fill={style.text}
                >
                  {node.label.substring(0, 3)}
                </text>

                {/* PageRank Vulnerability Badge when Heatmap Layer is Active */}
                {showHeatmap && centralityScores[node.id] && (
                  <g transform={`translate(0, ${-radius - 11})`}>
                    <rect
                      x="-30"
                      y="-7"
                      width="60"
                      height="14"
                      rx="3"
                      fill="#020617"
                      stroke={
                        centralityScores[node.id].level === "CRITICAL"
                          ? "#f43f5e"
                          : centralityScores[node.id].level === "HIGH"
                          ? "#f59e0b"
                          : centralityScores[node.id].level === "ELEVATED"
                          ? "#06b6d4"
                          : "#10b981"
                      }
                      strokeWidth="1.2"
                      opacity="0.95"
                    />
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      className="text-[8.5px] font-mono font-bold select-none pointer-events-none"
                      fill={
                        centralityScores[node.id].level === "CRITICAL"
                          ? "#fb7185"
                          : centralityScores[node.id].level === "HIGH"
                          ? "#fde68a"
                          : centralityScores[node.id].level === "ELEVATED"
                          ? "#67e8f9"
                          : "#a7f3d0"
                      }
                    >
                      PR: {centralityScores[node.id].score}
                    </text>
                  </g>
                )}

                {/* Node Name Label Below */}
                <g transform={`translate(0, ${radius + 12})`}>
                  <rect
                    x="-65"
                    y="-8"
                    width="130"
                    height="16"
                    rx="3"
                    fill="#020617"
                    stroke={isSelected ? "#06b6d4" : "#1e293b"}
                    strokeWidth="1"
                    opacity="0.9"
                  />
                  <text
                    textAnchor="middle"
                    dy="3.5"
                    className="text-[9.5px] font-sans fill-slate-200 font-medium pointer-events-none truncate"
                  >
                    {node.name.length > 20 ? `${node.name.substring(0, 18)}…` : node.name}
                  </text>
                </g>
              </g>
            );
          })}
        </g>

        {/* Sticky Notes & Text Annotations Layer */}
        {showAnnotations && (
          <g className="annotations-layer">
            {annotations.map((note) => {
              const style = ANNOTATION_STYLES[note.color] || ANNOTATION_STYLES.amber;
              const isSelected = selectedAnnotationId === note.id;
              const lines = wrapText(note.content, 26);
              const cardWidth = 195;
              const cardHeight = Math.max(90, 42 + lines.length * 15);

              return (
                <g
                  key={note.id}
                  className="annotation-group cursor-move"
                  transform={`translate(${note.x}, ${note.y})`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedAnnotationId(note.id);
                    setDraggingAnnotationId(note.id);
                  }}
                >
                  {/* Pin Needle Anchor Dot at exact Graph Coordinate (0, 0) */}
                  <circle
                    cx="0"
                    cy="0"
                    r="4.5"
                    fill={style.pinFill}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  {/* Dashed connector line to sticky note card */}
                  <line
                    x1="0"
                    y1="0"
                    x2="12"
                    y2="12"
                    stroke={style.border}
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                    opacity="0.85"
                  />

                  {/* Note Card Body */}
                  <g transform="translate(12, 12)">
                    {/* Card Background Shadow & Rect */}
                    <rect
                      x="0"
                      y="0"
                      width={cardWidth}
                      height={cardHeight}
                      rx="6"
                      fill={style.bg}
                      stroke={isSelected ? "#ffffff" : style.border}
                      strokeWidth={isSelected ? "2" : "1.2"}
                      style={{ filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.7))" }}
                    />

                    {/* Card Top Header Banner */}
                    <rect
                      x="0"
                      y="0"
                      width={cardWidth}
                      height="22"
                      rx="6"
                      fill={style.headerBg}
                      opacity="0.9"
                    />
                    <rect
                      x="0"
                      y="16"
                      width={cardWidth}
                      height="6"
                      fill={style.headerBg}
                      opacity="0.9"
                    />

                    {/* Category Badge */}
                    <text
                      x="8"
                      y="14.5"
                      fill={style.badge}
                      className="text-[9px] font-mono font-bold tracking-wider uppercase pointer-events-none"
                    >
                      [{note.category}]
                    </text>

                    {/* Timestamp */}
                    <text
                      x={cardWidth - 26}
                      y="14.5"
                      fill="#e2e8f0"
                      className="text-[8.5px] font-mono opacity-80 pointer-events-none"
                      textAnchor="end"
                    >
                      {note.timestamp}
                    </text>

                    {/* Delete Note Button (X) */}
                    <g
                      transform={`translate(${cardWidth - 18}, 3.5)`}
                      className="cursor-pointer hover:opacity-100 opacity-65"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAnnotation(note.id);
                      }}
                    >
                      <rect
                        x="0"
                        y="0"
                        width="14"
                        height="14"
                        rx="3"
                        fill="rgba(0,0,0,0.4)"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="0.5"
                      />
                      <text
                        x="7"
                        y="10.5"
                        textAnchor="middle"
                        fill="#ffffff"
                        className="text-[11px] font-bold select-none pointer-events-none"
                      >
                        ×
                      </text>
                    </g>

                    {/* Author Callsign */}
                    <text
                      x="8"
                      y="34"
                      fill="#94a3b8"
                      className="text-[8.5px] font-mono pointer-events-none uppercase tracking-tight"
                    >
                      OP: {note.author}
                    </text>

                    {/* Multi-line Annotation Content */}
                    <text
                      x="8"
                      y="48"
                      fill={style.text}
                      className="text-[10px] font-sans font-medium pointer-events-none"
                    >
                      {lines.map((line, i) => (
                        <tspan key={i} x="8" dy={i === 0 ? 0 : 13}>
                          {line}
                        </tspan>
                      ))}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {/* Floating Active Pin Mode Alert */}
      {isPinMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-amber-500 text-slate-950 font-mono text-xs px-4 py-2 rounded-lg shadow-2xl border border-amber-300">
          <Pin className="w-4 h-4 text-slate-950 fill-current animate-bounce" />
          <span className="font-bold">
            PIN MODE ACTIVE: Click anywhere on graph canvas to place sticky note
          </span>
          <button
            onClick={() => setIsPinMode(false)}
            className="hud-button ml-2 px-2.5 py-0.5 bg-slate-950 text-white rounded text-[11px] hover:bg-slate-800 transition-colors font-sans"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Pin Sticky Note Creation Dialog */}
      {newNoteModalCoords && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 annotation-dialog">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-5 space-y-4 font-sans text-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Pin className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Pin Sticky Note to Graph</h3>
                  <div className="text-[10px] font-mono text-slate-400">
                    X: {newNoteModalCoords.x}px · Y: {newNoteModalCoords.y}px · Author: {currentAuthor}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setNewNoteModalCoords(null)}
                className="text-slate-500 hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
                Annotation Category
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(["Critical", "Tactical", "Field", "Evacuation"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setNewNoteCategory(cat);
                      if (cat === "Critical") setNewNoteColor("amber");
                      else if (cat === "Tactical") setNewNoteColor("rose");
                      else if (cat === "Field") setNewNoteColor("cyan");
                      else if (cat === "Evacuation") setNewNoteColor("emerald");
                    }}
                    className={`px-2 py-1.5 rounded text-xs font-medium border transition-colors ${
                      newNoteCategory === cat
                        ? "bg-slate-800 border-cyan-400 text-white shadow-xs"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Card Visual Accent Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
                Note Theme Accent
              </label>
              <div className="flex items-center gap-2">
                {(["amber", "rose", "cyan", "emerald"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewNoteColor(c)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs capitalize border transition-all ${
                      newNoteColor === c
                        ? "border-white bg-slate-800 text-white"
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          c === "amber"
                            ? "#f59e0b"
                            : c === "rose"
                            ? "#f43f5e"
                            : c === "cyan"
                            ? "#06b6d4"
                            : "#10b981",
                      }}
                    />
                    <span>{c}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Note Content Textarea */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
                Observation or Directive
              </label>
              <textarea
                rows={3}
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="e.g. Substation flood defense breached at 14:15 UTC. Diverting backup generator to North Clinic."
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-hidden rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 font-sans resize-none"
                autoFocus
              />
            </div>

            {/* Dialog Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setNewNoteModalCoords(null)}
                className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateAnnotation}
                disabled={!newNoteContent.trim()}
                className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Pin className="w-3.5 h-3.5 fill-current" />
                <span>Save to Graph</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Node Inspector Drawer */}
      {selectedNode && (
        <div className="absolute right-4 top-4 bottom-4 w-80 bg-slate-900/95 border border-slate-800 rounded-lg p-4 shadow-2xl backdrop-blur-md overflow-y-auto z-30 font-sans text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-slate-800 border border-slate-700">
                  {getNodeIcon(selectedNode.label)}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                    :{selectedNode.label}
                  </span>
                  <h4 className="text-sm font-semibold text-white leading-tight">
                    {selectedNode.name}
                  </h4>
                </div>
              </div>
              <button
                onClick={() => {
                  if (onSelectNode) onSelectNode(null);
                  setInternalSelectedNode(null);
                }}
                className="text-slate-500 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Properties List */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold tracking-wider">
                NODE PROPERTIES (LPG)
              </span>
              <div className="bg-slate-950/70 border border-slate-800 rounded p-2.5 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400">id:</span>
                  <span className="text-cyan-400 font-semibold">{selectedNode.id}</span>
                </div>
                {Object.entries(selectedNode.properties).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-baseline gap-2 py-0.5 border-b border-slate-900/60 last:border-0">
                    <span className="text-slate-400 shrink-0">{key}:</span>
                    <span className="text-slate-200 text-right truncate">
                      {typeof val === "boolean" ? (val ? "true" : "false") : String(val)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Direct Graph Connections */}
              <div className="pt-2">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold tracking-wider">
                  DIRECT RELATIONSHIPS
                </span>
                <div className="mt-1.5 space-y-1">
                  {relationships
                    .filter((r) => r.source === selectedNode.id || r.target === selectedNode.id)
                    .map((r) => {
                      const isOutbound = r.source === selectedNode.id;
                      const otherId = isOutbound ? r.target : r.source;
                      const otherNode = nodes.find((n) => n.id === otherId);

                      return (
                        <div
                          key={r.id}
                          className="flex items-center justify-between p-1.5 bg-slate-950/50 border border-slate-800 rounded text-[11px]"
                        >
                          <span className="font-mono text-cyan-400 text-[10px]">
                            {isOutbound ? `-> [:${r.type}] ->` : `<- [:${r.type}] <-`}
                          </span>
                          <span className="text-slate-300 font-medium truncate max-w-[140px]">
                            {otherNode?.name || otherId}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="font-mono text-[10px]">Neo4j Native Node</span>
            <span className="text-slate-500">Degree: {relationships.filter((r) => r.source === selectedNode.id || r.target === selectedNode.id).length}</span>
          </div>
        </div>
      )}

      {/* Heatmap Legend & Telemetry HUD (Bottom-Left) */}
      {showHeatmap && (
        <div className="absolute bottom-4 left-4 z-20 bg-slate-900/95 border border-slate-800 rounded-lg p-3 shadow-2xl backdrop-blur-md w-80 font-sans text-xs space-y-2.5 pointer-events-auto animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-400 fill-rose-500" />
              <span className="font-mono text-[11px] font-bold text-white uppercase tracking-wider">
                Vulnerability Heatmap
              </span>
            </div>
            <button
              onClick={() => setShowHeatmap(false)}
              className="text-slate-500 hover:text-white p-0.5 rounded transition-colors"
              title="Close Heatmap Legend"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Thermal Gradient Scale Bar */}
          <div className="space-y-1">
            <div className="h-2 w-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-400 via-amber-400 to-rose-500 shadow-inner" />
            <div className="flex justify-between text-[9px] font-mono text-slate-400">
              <span className="text-emerald-400">Baseline</span>
              <span className="text-cyan-400">Elevated</span>
              <span className="text-amber-400">High</span>
              <span className="text-rose-400 font-bold">Critical (SPOF)</span>
            </div>
          </div>

          {/* Heatmap Intensity Modes */}
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[10px] font-mono text-slate-400">GLOW RADIUS:</span>
            <div className="flex items-center gap-1">
              {(["standard", "high", "thermal"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setHeatmapIntensity(mode)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase transition-colors ${
                    heatmapIntensity === mode
                      ? "bg-rose-900/60 text-rose-200 border border-rose-500/80 font-bold shadow-xs"
                      : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Top 3 Critical Bottlenecks (Click to Inspect) */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-[10px] font-mono text-slate-400 mb-1.5 flex items-center justify-between">
              <span>CRITICAL BOTTLENECKS (PAGERANK):</span>
              <span className="text-rose-400 text-[9px]">Click to focus</span>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              {topCriticalNodes.map((item) => (
                <div
                  key={item.node.id}
                  onClick={() => {
                    if (onSelectNode) onSelectNode(item.node);
                    else setInternalSelectedNode(item.node);
                    const pos = nodePositions[item.node.id];
                    if (pos && containerRef.current) {
                      const rect = containerRef.current.getBoundingClientRect();
                      setPan({
                        x: rect.width / 2 - pos.x * zoom,
                        y: rect.height / 2 - pos.y * zoom,
                      });
                    }
                  }}
                  className="flex items-center justify-between px-2 py-1 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/60 rounded cursor-pointer transition-colors"
                >
                  <span className="text-slate-200 truncate max-w-[170px] font-sans text-xs">
                    {item.node.name}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] px-1 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                      PR {item.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
