import React, { useState } from "react";
import { PRESET_CYPHER_QUERIES } from "../data/graphData";
import { CypherQueryResult } from "../services/cypherEngine";
import {
  Terminal,
  Play,
  Sparkles,
  Database,
  Clock,
  Layers,
  CheckCircle,
  AlertCircle,
  Copy,
  RotateCcw
} from "lucide-react";

interface CypherStudioProps {
  onRunQuery: (query: string) => CypherQueryResult;
  lastResult: CypherQueryResult | null;
  onHighlightSubgraph?: (nodeIds: string[], relIds: string[]) => void;
}

export const CypherStudio: React.FC<CypherStudioProps> = ({
  onRunQuery,
  lastResult,
  onHighlightSubgraph,
}) => {
  const [activeQueryText, setActiveQueryText] = useState(PRESET_CYPHER_QUERIES[0].cypher);
  const [activePresetId, setActivePresetId] = useState(PRESET_CYPHER_QUERIES[0].id);
  const [nlInput, setNlInput] = useState("");
  const [isAiTranslating, setIsAiTranslating] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExecute = (overrideQuery?: string) => {
    const q = overrideQuery || activeQueryText;
    const res = onRunQuery(q);
    if (onHighlightSubgraph) {
      onHighlightSubgraph(res.matchedNodeIds, res.matchedRelIds);
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_CYPHER_QUERIES[0]) => {
    setActivePresetId(preset.id);
    setActiveQueryText(preset.cypher);
    setAiExplanation(null);
    handleExecute(preset.cypher);
  };

  const handleAiTranslate = async () => {
    if (!nlInput.trim()) return;
    setIsAiTranslating(true);
    setAiExplanation(null);

    try {
      const resp = await fetch("/api/ai/nl-to-cypher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: nlInput }),
      });

      const data = await resp.json();
      if (data.cypher) {
        setActiveQueryText(data.cypher);
        setAiExplanation(data.explanation || "AI-generated Cypher translation for graph query traversal.");
        handleExecute(data.cypher);
      }
    } catch (err) {
      console.error("AI translation error:", err);
    } finally {
      setIsAiTranslating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeQueryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* AI Copilot Prompt Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-cyan-400 font-mono uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Natural Language to Cypher Translation</span>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Ask questions in plain English about satellite scans, flooded facilities, or evacuation bottlenecks.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={nlInput}
            onChange={(e) => setNlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAiTranslate()}
            placeholder="e.g., Which hospitals lose grid power if Substation Beta is flooded? Or: Trace satellite radar lineage."
            className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
          />
          <button
            onClick={handleAiTranslate}
            disabled={isAiTranslating || !nlInput.trim()}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold text-xs rounded transition-colors flex items-center gap-1.5 shrink-0"
          >
            {isAiTranslating ? (
              <span>Translating...</span>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Cypher</span>
              </>
            )}
          </button>
        </div>

        {aiExplanation && (
          <div className="mt-3 p-2.5 bg-cyan-950/40 border border-cyan-800/60 rounded text-xs text-cyan-200">
            <span className="font-semibold text-cyan-400 font-mono">Graph Traversal Logic: </span>
            {aiExplanation}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Preset Cypher Query Catalog (1 col) */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Preset Intelligence Queries</span>
          </div>

          <div className="space-y-2">
            {PRESET_CYPHER_QUERIES.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-slate-900 border-cyan-500/60 shadow-sm"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <h4 className="font-semibold text-white mb-1 leading-snug">
                    {preset.title}
                  </h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {preset.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Cypher Code Editor & Execution Results (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2 font-mono text-slate-300">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>neo4j$ cypher-console</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title="Copy Cypher Query"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleExecute()}
                  className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run Cypher</span>
                </button>
              </div>
            </div>

            {/* Cypher Code Input */}
            <textarea
              value={activeQueryText}
              onChange={(e) => setActiveQueryText(e.target.value)}
              rows={6}
              className="w-full bg-slate-950 p-4 font-mono text-xs text-cyan-300 focus:outline-none resize-none leading-relaxed"
              spellCheck={false}
            />

            {/* Performance Ribbon */}
            {lastResult && (
              <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle className="w-3 h-3" />
                    <span>SUCCESS</span>
                  </span>
                  <span>{lastResult.totalRecords} records found</span>
                  <span>·</span>
                  <span>{lastResult.executionTimeMs} ms</span>
                </div>
                <div className="text-slate-500">
                  Highlighted {lastResult.matchedNodeIds.length} nodes & {lastResult.matchedRelIds.length} edges
                </div>
              </div>
            )}
          </div>

          {/* Results Table */}
          {lastResult && lastResult.rows.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-800 text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider flex items-center justify-between">
                <span>Cypher Result Set</span>
                <span className="text-slate-500 font-normal">Table Projection</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                    <tr>
                      {lastResult.columns.map((col) => (
                        <th key={col} className="px-3.5 py-2 font-medium">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-slate-200">
                    {lastResult.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                        {lastResult.columns.map((col) => (
                          <td key={col} className="px-3.5 py-2.5 text-[11px] tabular-nums whitespace-nowrap">
                            {row[col] !== undefined ? String(row[col]) : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
