import React from "react";
import { Satellite, ShieldAlert, Database, LogOut, User, Clock, FileText } from "lucide-react";
import { UserProfile } from "./LoginPage";

interface TopNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenBriefing: () => void;
  onOpenRiskReport?: () => void;
  onOpenNeo4jModal: () => void;
  neo4jStatus: {
    connected: boolean;
    type: string;
    latencyMs: number;
  };
  currentUser: UserProfile | null;
  onLogout: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenBriefing,
  onOpenRiskReport,
  onOpenNeo4jModal,
  neo4jStatus,
  currentUser,
  onLogout,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
        <div className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Satellite className="w-4 h-4" />
        </div>
        <span className="text-base font-bold tracking-tight text-white font-sans">
          ORBISYNC
        </span>
      </div>

      {/* Zone 2: Clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium tracking-wide">
        <button
          onClick={() => setActiveTab("graph")}
          className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
            activeTab === "graph"
              ? "text-cyan-400 border-cyan-400 font-semibold"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          Knowledge Graph
        </button>

        <button
          onClick={() => setActiveTab("timemachine")}
          className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 flex items-center gap-1.5 ${
            activeTab === "timemachine"
              ? "text-cyan-400 border-cyan-400 font-semibold"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>Crisis Time Machine</span>
        </button>

        <button
          onClick={() => setActiveTab("swaths")}
          className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
            activeTab === "swaths"
              ? "text-cyan-400 border-cyan-400 font-semibold"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          Satellite Swaths & GIS
        </button>

        <button
          onClick={() => setActiveTab("cypher")}
          className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
            activeTab === "cypher"
              ? "text-cyan-400 border-cyan-400 font-semibold"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          Neo4j Cypher Studio
        </button>

        <button
          onClick={() => setActiveTab("cascade")}
          className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
            activeTab === "cascade"
              ? "text-cyan-400 border-cyan-400 font-semibold"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          Cascade Simulator
        </button>

        <button
          onClick={() => setActiveTab("dossier")}
          className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
            activeTab === "dossier"
              ? "text-cyan-400 border-cyan-400 font-semibold"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          Innovation Dossier
        </button>
      </nav>

      {/* Zone 3: 1 primary action + Neo4j connect & user profile trigger */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Neo4j Connection Status Trigger */}
        <button
          onClick={onOpenNeo4jModal}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-slate-300 transition-colors"
          title="Click to manage Neo4j connection"
        >
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200">
            {neo4jStatus.type === "auradb" ? "Neo4j AuraDB" : neo4jStatus.type === "local" ? "Neo4j Local" : "Neo4j Sandbox"}
          </span>
        </button>

        {/* Risk Report Action Button */}
        {onOpenRiskReport && (
          <button
            onClick={onOpenRiskReport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/70 rounded transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-rose-950/40 cursor-pointer"
            title="Open Emergency Responder Impact Risk Report"
          >
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            <span>Risk Report</span>
          </button>
        )}

        {/* Primary Action Button */}
        <button
          onClick={onOpenBriefing}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-cyan-500/20 active:translate-y-0.5"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Crisis SITREP</span>
        </button>

        {/* User Profile Badge & Logout */}
        {currentUser && (
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-800 text-xs font-mono">
            <span className="text-cyan-400 font-semibold truncate max-w-[120px]" title={currentUser.name}>
              {currentUser.callsign}
            </span>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded transition-colors"
              title="Sign out of command session"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
