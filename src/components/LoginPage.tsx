import React, { useState } from "react";
import {
  Satellite,
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  ArrowRight,
  Radio,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export interface UserProfile {
  name: string;
  role: string;
  agency: string;
  clearance: string;
  callsign: string;
  avatarSeed: string;
}

export const DEMO_PROFILES: UserProfile[] = [
  {
    name: "Dr. Alena Vance",
    role: "Lead Disaster Coordinator",
    agency: "UN-SPIDER & Sentinel Asia",
    clearance: "Level 4 Global Command",
    callsign: "ORBIT-ALPHA-1",
    avatarSeed: "alena",
  },
  {
    name: "Cmdr. Marcus Rowe",
    role: "Satellite Operations Specialist",
    agency: "Copernicus Emergency Management",
    clearance: "Level 3 Orbital Fleet",
    callsign: "SWATH-LEO-9",
    avatarSeed: "marcus",
  },
  {
    name: "Sarah Chen, P.E.",
    role: "Critical Infrastructure Engineer",
    agency: "Municipal Resiliency & Grid Taskforce",
    clearance: "Level 3 Civil Lifelines",
    callsign: "CASCADE-DEFENSE",
    avatarSeed: "sarah",
  },
];

interface LoginPageProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [selectedPreset, setSelectedPreset] = useState<UserProfile>(DEMO_PROFILES[0]);
  const [email, setEmail] = useState("alena.vance@un-spider.org");
  const [passcode, setPasscode] = useState("••••••••••••••");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStage, setAuthStage] = useState<string | null>(null);

  const handleAuthorize = (profile: UserProfile) => {
    setIsAuthenticating(true);
    setAuthStage("Validating Space Command Credentials...");

    setTimeout(() => {
      setAuthStage("Synchronizing Neo4j Knowledge Graph Session...");
      setTimeout(() => {
        setIsAuthenticating(false);
        setAuthStage(null);
        onLoginSuccess(profile);
      }, 700);
    }, 600);
  };

  const handleSelectPreset = (p: UserProfile) => {
    setSelectedPreset(p);
    setEmail(`${p.callsign.toLowerCase()}@orbitgraph.int`);
    setPasscode("••••••••••••••");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none font-sans">
      {/* Background Satellite Swath Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #334155 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Authentication Card */}
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl relative z-10 overflow-hidden">
        {/* Top Header */}
        <div className="p-6 sm:p-8 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Satellite className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-semibold">
                  SECURE INCIDENT GATEWAY · UN-SPIDER PROTOCOL
                </span>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  ORBISYNC Mission Command
                </h1>
                <div className="text-[11px] font-mono text-cyan-300">
                  Connect Space. Decode Earth. Protect Tomorrow.
                </div>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>TLS 1.3 ENCRYPTED</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400 leading-relaxed font-sans">
            Authentication portal for authorized emergency directors, satellite radar analysts, and civil infrastructure responders.
          </p>
        </div>

        {/* Preset Clearance Roles */}
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2.5">
              SELECT DEMO INCIDENT COMMANDER PROFILE:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {DEMO_PROFILES.map((p) => {
                const isSelected = selectedPreset.callsign === p.callsign;
                return (
                  <button
                    key={p.callsign}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-slate-800 border-cyan-500 shadow-md ring-1 ring-cyan-500/40"
                        : "bg-slate-950/70 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <div>
                      <div className="text-[10px] font-mono text-cyan-400 font-semibold uppercase">
                        {p.callsign}
                      </div>
                      <div className="font-semibold text-white text-xs mt-1 leading-snug">
                        {p.name}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2 truncate font-mono">
                      {p.role}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                OPERATIONAL EMAIL / CALLSIGN ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  SECURITY CLEARANCE PASSKEY
                </label>
                <span className="text-[10px] text-cyan-400 font-mono">
                  Clearance: {selectedPreset.clearance}
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Authentication Progress Display */}
          {authStage && (
            <div className="p-3 bg-cyan-950/40 border border-cyan-800/80 rounded-lg flex items-center gap-2.5 text-xs text-cyan-300 font-mono">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>{authStage}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            onClick={() => handleAuthorize(selectedPreset)}
            disabled={isAuthenticating}
            className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:translate-y-0.5"
          >
            <span>Authorize Command & Access Graph Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>Connected via Neo4j Knowledge Graph Engine</span>
          <span>Build: Hackathon Release v2.4</span>
        </div>
      </div>
    </div>
  );
};
