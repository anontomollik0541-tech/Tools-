import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Eye,
  Camera,
  Mic,
  MapPin,
  Bell,
  Cpu,
  Flame,
  Terminal,
  Sparkles,
  Copy,
  Check,
  Wrench,
  ShieldAlert,
} from 'lucide-react';
import { DeviceHygieneAudit, SupportedLanguage, AuditProblemItem } from '../types/assistant';
import { runFullDeviceAudit } from '../services/deviceAudit';

interface DeviceAuditViewProps {
  language: SupportedLanguage;
  onRunInTerminal?: (cmd: string) => void;
  onAskAI?: (problemQuery: string) => void;
}

export const DeviceAuditView: React.FC<DeviceAuditViewProps> = ({
  language,
  onRunInTerminal,
  onAskAI,
}) => {
  const [audit, setAudit] = useState<DeviceHygieneAudit | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [simulatedLeak, setSimulatedLeak] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);

  const fetchAudit = async (simulate: boolean = simulatedLeak) => {
    setLoading(true);
    try {
      const data = await runFullDeviceAudit(simulate);
      setAudit(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit(simulatedLeak);
  }, [simulatedLeak]);

  const handleToggleSimulation = () => {
    const nextVal = !simulatedLeak;
    setSimulatedLeak(nextVal);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAskAIAboutProblem = (problem: AuditProblemItem) => {
    if (!onAskAI) return;
    const title =
      language === 'bn' ? problem.titleBn : language === 'banglish' ? problem.titleBanglish : problem.title;
    const detail =
      language === 'bn' ? problem.problemDetailBn : language === 'banglish' ? problem.problemDetailBanglish : problem.problemDetail;
    const prompt =
      language === 'bn'
        ? `আমার ডিভাইসে এই সমস্যাটি পাওয়া গেছে: "${title}". বিবরণ: ${detail}। এটি টারম্যাক্সে বা ব্রাউজারে কীভাবে স্থায়ীভাবে সমাধান করব ধাপে ধাপে বলুন।`
        : language === 'banglish'
        ? `Amar device audit e ei problem dhora porse: "${title}". Detail: ${detail}. Eta Termux ba browser e kivabe solve korbo step by step bolo.`
        : `Device Audit identified this vulnerability: "${title}". Details: ${detail}. How do I resolve this step-by-step in my environment?`;
    onAskAI(prompt);
  };

  if (!audit) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8.5rem)] min-h-[500px] bg-[#0d131d] rounded-xl border border-zinc-800">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-xs text-zinc-400">Analyzing device telemetry, permissions & WebRTC STUN leaks...</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20';
    if (score >= 70) return 'text-amber-400 border-amber-500/40 bg-amber-950/20';
    return 'text-red-400 border-red-500/40 bg-red-950/20';
  };

  const getSeverityBadge = (severity: AuditProblemItem['severity']) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-800/80 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            CRITICAL
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800/80 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            HIGH RISK
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-yellow-950 text-yellow-300 border border-yellow-800/80">
            WARNING
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
            INFO
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] min-h-[500px] bg-[#0d131d] rounded-xl border border-zinc-800 shadow-xl overflow-hidden text-xs">
      {/* Top Header */}
      <div className="p-4 bg-[#131b26] border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              {language === 'bn'
                ? 'ডিভাইস হাইজিন ও আইপি লিক অডিট (সমস্যা ও সমাধানের পরামর্শ)'
                : language === 'banglish'
                ? 'Device Hygiene & IP Leak Audit (Problem & Solutions)'
                : 'Device Hygiene & IP Leak Audit (Problems & Solution Suggestions)'}
            </h2>
            <p className="text-[11px] text-zinc-400">
              {language === 'bn'
                ? 'আসল আইপি লিক, ক্ষতিকারক প্লাগইন ও পারমিশন পরীক্ষা করে তাত্ক্ষণিক সমাধানের পরামর্শ প্রদান করে।'
                : language === 'banglish'
                ? 'IP leak, permissions ebong device vulnerability detect kore step-by-step solution dey.'
                : 'Proactive WebRTC STUN leak detection, Flash hygiene check, permissions audit & actionable remediation.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Toggle Simulated Problem */}
          <button
            onClick={handleToggleSimulation}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              simulatedLeak
                ? 'bg-amber-950/80 text-amber-300 border-amber-600'
                : 'bg-[#182333] text-zinc-300 border-zinc-700 hover:bg-[#202e42]'
            }`}
            title="Toggle simulated WebRTC IP leak to view solutions"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>{simulatedLeak ? 'Simulation Active (Leak On)' : 'Simulate Leak Test'}</span>
          </button>

          <button
            onClick={() => fetchAudit(simulatedLeak)}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Scanning...' : 'Re-Scan Device'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 overflow-y-auto space-y-5">
        {/* Top Summary Banner: Score & Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Security Score Card */}
          <div className={`p-4 rounded-xl border flex items-center space-x-4 ${getScoreColor(audit.score)}`}>
            <div className="text-3xl font-extrabold font-mono">{audit.score}/100</div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider">
                {audit.score >= 90 ? 'Secure State' : audit.score >= 70 ? 'Moderate Exposure' : 'Critical Issues Detected'}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {audit.problems.length} vulnerability vector(s) analyzed with remediation solutions.
              </p>
            </div>
          </div>

          {/* WebRTC IP Leak Card */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-[#121924] flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${audit.webrtc.hasLeak ? 'bg-red-950/60 text-red-400' : 'bg-emerald-950/60 text-emerald-400'}`}>
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-zinc-200">WebRTC Shield:</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    audit.webrtc.hasLeak ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {audit.webrtc.hasLeak ? 'LEAK DETECTED' : 'PASS (SECURE)'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                {audit.webrtc.hasLeak
                  ? `Exposing: ${[...audit.webrtc.localIps, ...audit.webrtc.publicIps].join(', ')}`
                  : 'Zero STUN candidate bypass. Real IP shielded.'}
              </p>
            </div>
          </div>

          {/* Adobe Flash & Legacy Vulnerabilities Card */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-[#121924] flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${audit.flashStatus === 'present' ? 'bg-red-950/60 text-red-400' : 'bg-emerald-950/60 text-emerald-400'}`}>
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-zinc-200">Flash Plugin Check:</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    audit.flashStatus === 'present' ? 'bg-red-950 text-red-300' : 'bg-emerald-950 text-emerald-300'
                  }`}
                >
                  {audit.flashStatus === 'present' ? 'CRITICAL RISK' : 'PURGED (SAFE)'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {audit.flashStatus === 'present'
                  ? 'Obsolete Adobe Flash detected! Uninstall immediately.'
                  : 'Zero NPAPI/Flash exploit attack surface.'}
              </p>
            </div>
          </div>
        </div>

        {/* PRIMARY SECTION: Identified Problems & Actionable Solutions */}
        <div className="bg-[#121924] border border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
            <div className="flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-zinc-100">
                {language === 'bn'
                  ? 'শনাক্তকৃত সমস্যা ও কার্যকর সমাধানের পরামর্শ (Solution Suggestions)'
                  : language === 'banglish'
                  ? 'Problems Found & Actionable Solution Suggestions'
                  : 'Identified Vulnerabilities & Step-by-Step Remediation Solutions'}
              </h3>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              {audit.problems.length} item(s) available
            </span>
          </div>

          <div className="space-y-4">
            {audit.problems.map((prob) => {
              const title =
                language === 'bn' ? prob.titleBn : language === 'banglish' ? prob.titleBanglish : prob.title;
              const detail =
                language === 'bn' ? prob.problemDetailBn : language === 'banglish' ? prob.problemDetailBanglish : prob.problemDetail;
              const steps =
                language === 'bn'
                  ? prob.solutionStepsBn
                  : language === 'banglish'
                  ? prob.solutionStepsBanglish
                  : prob.solutionSteps;

              const isExpanded = selectedProblem === prob.id || prob.severity === 'critical';

              return (
                <div
                  key={prob.id}
                  className={`rounded-xl border transition-all ${
                    prob.severity === 'critical'
                      ? 'bg-[#181a24] border-red-700/60 shadow-md'
                      : prob.severity === 'high'
                      ? 'bg-[#171b26] border-amber-700/50'
                      : 'bg-[#101622] border-zinc-800'
                  }`}
                >
                  {/* Problem Card Header */}
                  <div
                    onClick={() => setSelectedProblem(isExpanded ? null : prob.id)}
                    className="p-4 flex items-start justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getSeverityBadge(prob.severity)}
                        <h4 className="font-bold text-zinc-100 text-xs sm:text-sm">{title}</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{detail}</p>
                    </div>

                    <button
                      type="button"
                      className="text-zinc-400 hover:text-zinc-200 text-xs font-mono shrink-0 ml-2 mt-1"
                    >
                      {isExpanded ? 'Hide Steps' : 'View Fix'}
                    </button>
                  </div>

                  {/* Solution Steps & Action Toolbar */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-zinc-800/80 space-y-3">
                      <div>
                        <div className="text-[11px] font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5" />
                          <span>
                            {language === 'bn'
                              ? 'প্রস্তাবিত সমাধানের পদক্ষেপ:'
                              : language === 'banglish'
                              ? 'Recommended Solution Steps:'
                              : 'Recommended Remediation Steps:'}
                          </span>
                        </div>

                        <ul className="space-y-1.5 pl-2">
                          {steps.map((step, sIdx) => (
                            <li key={sIdx} className="text-[11px] text-zinc-300 flex items-start gap-2">
                              <span className="text-emerald-400 font-mono font-bold">✓</span>
                              <span className="leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 1-Click Action Bar */}
                      <div className="bg-[#090d14] p-3 rounded-lg border border-zinc-800 flex flex-wrap items-center justify-between gap-2.5">
                        {prob.suggestedCommand ? (
                          <div className="flex items-center gap-2 overflow-x-auto font-mono text-[11px] text-emerald-300">
                            <span className="text-zinc-500 font-bold">&gt;</span>
                            <code>{prob.suggestedCommand}</code>
                          </div>
                        ) : (
                          <div className="text-[11px] text-zinc-500 font-mono">
                            Configuration adjustment required in browser / OS site settings.
                          </div>
                        )}

                        <div className="flex items-center gap-2 flex-wrap ml-auto">
                          {prob.suggestedCommand && onRunInTerminal && (
                            <button
                              onClick={() => onRunInTerminal(prob.suggestedCommand!)}
                              className="px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                            >
                              <Terminal className="w-3 h-3" />
                              <span>Run in Shell</span>
                            </button>
                          )}

                          {prob.suggestedCommand && (
                            <button
                              onClick={() => handleCopy(prob.suggestedCommand!, prob.id)}
                              className="px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1 transition-colors border border-zinc-700"
                            >
                              {copiedId === prob.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          )}

                          {onAskAI && (
                            <button
                              onClick={() => handleAskAIAboutProblem(prob)}
                              title="Ask AI Assistant to explain and guide resolution"
                              className="px-2.5 py-1.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-1.5 transition-colors"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Ask AI to Fix</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Secondary Details: Permissions & Device Hardware Specs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Permissions Audit */}
          <div className="bg-[#121924] border border-zinc-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-zinc-200 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Browser Hardware Permissions Audit
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#0a0f16] border border-zinc-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <Camera className="w-3.5 h-3.5 text-zinc-400" />
                  Camera
                </span>
                <span
                  className={`text-[10px] font-mono font-semibold ${
                    audit.permissions.camera === 'granted' ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {audit.permissions.camera}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0a0f16] border border-zinc-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <Mic className="w-3.5 h-3.5 text-zinc-400" />
                  Microphone
                </span>
                <span
                  className={`text-[10px] font-mono font-semibold ${
                    audit.permissions.microphone === 'granted' ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {audit.permissions.microphone}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0a0f16] border border-zinc-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  Geolocation
                </span>
                <span
                  className={`text-[10px] font-mono font-semibold ${
                    audit.permissions.geolocation === 'granted' ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {audit.permissions.geolocation}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0a0f16] border border-zinc-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <Bell className="w-3.5 h-3.5 text-zinc-400" />
                  Notifications
                </span>
                <span className="text-[10px] font-mono font-semibold text-zinc-400">
                  {audit.permissions.notifications}
                </span>
              </div>
            </div>
          </div>

          {/* System & Hardware Environment */}
          <div className="bg-[#121924] border border-zinc-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-zinc-200 mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Device Hardware & Sandbox Environment
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Platform OS:</span>
                <span className="font-mono text-zinc-200">{audit.platform}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">CPU Thread Concurrency:</span>
                <span className="font-mono text-zinc-200">{audit.hardwareConcurrency} Cores</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                <span className="text-zinc-400">Display Resolution:</span>
                <span className="font-mono text-zinc-200">{audit.screenResolution}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-400">Cookies Policy:</span>
                <span className="font-mono text-emerald-400">
                  {audit.cookiesEnabled ? 'Standard Enabled' : 'Strict Block'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
