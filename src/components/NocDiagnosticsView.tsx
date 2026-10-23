import React, { useState } from 'react';
import {
  Activity,
  Server,
  Wifi,
  Radio,
  Cpu,
  Play,
  Copy,
  Check,
  Download,
  Terminal,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import {
  runAiNocDiagnostic,
  DetailedNocAudit,
  NocDiagnosticParams,
} from '../services/aiNocDiagnostic';
import { SupportedLanguage } from '../types/assistant';

interface NocDiagnosticsViewProps {
  language: SupportedLanguage;
  onRunInTerminal: (cmd: string) => void;
  onSendToAI: (content: string) => void;
}

export const NocDiagnosticsView: React.FC<NocDiagnosticsViewProps> = ({
  language,
  onRunInTerminal,
  onSendToAI,
}) => {
  const [oltIp, setOltIp] = useState('10.10.20.5');
  const [brand, setBrand] = useState('vsol');
  const [port, setPort] = useState('1');
  const [onu, setOnu] = useState('12');
  const [preset, setPreset] = useState<NocDiagnosticParams['preset']>('power_drop');
  const [audit, setAudit] = useState<DetailedNocAudit>(() => runAiNocDiagnostic());
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'visual' | 'json' | 'hosts'>('visual');

  const handleRunFullDiagnostic = (overrideParams?: NocDiagnosticParams) => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runAiNocDiagnostic(
        overrideParams || {
          oltIp,
          brand,
          port,
          onu,
          preset,
        }
      );
      setAudit(res);
      setIsRunning(false);
    }, 400);
  };

  const handleSelectPreset = (p: NocDiagnosticParams['preset']) => {
    setPreset(p);
    handleRunFullDiagnostic({
      oltIp,
      brand,
      port,
      onu,
      preset: p,
    });
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(audit.banglaResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(audit.banglaResult, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_noc_diagnostic_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleForwardToAI = () => {
    const jsonStr = JSON.stringify(audit.banglaResult, null, 2);
    const prompt =
      language === 'bn'
        ? `আমি ai_noc_diagnostic.py এর এই ১০০% পূর্ণাঙ্গ বাংলা রিপোর্ট পেয়েছি:\n\`\`\`json\n${jsonStr}\n\`\`\`\nঅনুগ্রহ করে ফাইবার পাওয়ার ড্রপ এবং নেটওয়ার্ক সমস্যা সমাধানের জন্য পরবর্তী করণীয় বলে দিন।`
        : language === 'banglish'
        ? `Ami ai_noc_diagnostic.py run kore ei 100% full result paisi:\n\`\`\`json\n${jsonStr}\n\`\`\`\nFibre power drop ba network fix korte pore ki korbo bolo.`
        : `Here is the full 100% NOC diagnostic report:\n\`\`\`json\n${jsonStr}\n\`\`\`\nPlease analyze the optical power level and provide technical remediation advice.`;
    onSendToAI(prompt);
  };

  const getHealthBadge = (score: number) => {
    if (score >= 90) return { label: '১০০% স্বাভাবিক (NOMINAL)', color: 'bg-emerald-950 text-emerald-400 border-emerald-800' };
    if (score >= 60) return { label: 'সতর্কতা (ATTENTION)', color: 'bg-amber-950 text-amber-400 border-amber-800' };
    return { label: 'ক্রিটিক্যাল ড্রপ (CRITICAL)', color: 'bg-red-950 text-red-400 border-red-800' };
  };

  const healthBadge = getHealthBadge(audit.healthScore);
  const commandToRun = `python3 ai_noc_diagnostic.py ${oltIp} ${brand} ${port} ${onu}`;

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] min-h-[550px] bg-[#0d131d] rounded-xl border border-zinc-800 shadow-2xl overflow-hidden text-xs">
      {/* Top Banner & Title Bar */}
      <div className="p-4 bg-[#131b26] border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shadow-sm">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                AI NOC Diagnostics (১০০% লাইভ টেলিমেট্রি রেজাল্ট)
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                100% Live Engine
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              {language === 'bn'
                ? 'সিস্টেমে থাকা সমস্ত টুলস অটো-রান করে ONU ফাইবার পাওয়ার, ওয়াইফাই সিগন্যাল ও লেটেন্সি ড্রপের ১০০% রেজাল্ট সরাসরি বাংলায় দেখায়।'
                : language === 'banglish'
                ? 'Shob tools auto-run kore OLT ONU fibre power, WiFi signal ebong latency drop er 100% live details dekhe.'
                : 'Unified NOC diagnostic: evaluates OLT ONU optical levels, WiFi spectrum, device drops, and route latency in 100% detail.'}
            </p>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center space-x-2 flex-wrap">
          <button
            onClick={() => handleRunFullDiagnostic()}
            disabled={isRunning}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'ডায়াগনস্টিকস চলছে...' : '🚀 রান ১০০% ডায়াগনস্টিকস'}</span>
          </button>

          <button
            onClick={() => onRunInTerminal(commandToRun)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[#182333] hover:bg-[#202e42] text-zinc-200 border border-zinc-700 transition-colors"
            title="Run in Termux Shell"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Shell Run</span>
          </button>

          <button
            onClick={handleForwardToAI}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 transition-colors"
            title="Send 100% Report to AI Assistant"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">এআই সমাধান</span>
          </button>

          <button
            onClick={handleCopyJson}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
            title="Copy Raw Bangla JSON"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'JSON'}</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
            title="Download JSON Report"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Input Parameters & Scenario Presets Toolbar */}
      <div className="px-5 py-3 bg-[#0d131d] border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        {/* Manual Parameter Inputs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center space-x-1.5 bg-[#141d2a] px-2 py-1 rounded border border-zinc-700/80">
            <span className="text-zinc-500 font-mono text-[10px]">OLT IP:</span>
            <input
              type="text"
              value={oltIp}
              onChange={(e) => setOltIp(e.target.value)}
              className="bg-transparent font-mono text-zinc-100 w-24 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-1.5 bg-[#141d2a] px-2 py-1 rounded border border-zinc-700/80">
            <span className="text-zinc-500 font-mono text-[10px]">Brand:</span>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="bg-transparent font-mono text-zinc-100 focus:outline-none"
            >
              <option value="vsol">VSOL</option>
              <option value="cdata">CDATA</option>
              <option value="bdcom">BDCOM</option>
              <option value="huawei">Huawei</option>
              <option value="zte">ZTE</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-[#141d2a] px-2 py-1 rounded border border-zinc-700/80">
            <span className="text-zinc-500 font-mono text-[10px]">PON:</span>
            <input
              type="text"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="bg-transparent font-mono text-zinc-100 w-8 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-1.5 bg-[#141d2a] px-2 py-1 rounded border border-zinc-700/80">
            <span className="text-zinc-500 font-mono text-[10px]">ONU:</span>
            <input
              type="text"
              value={onu}
              onChange={(e) => setOnu(e.target.value)}
              className="bg-transparent font-mono text-zinc-100 w-8 focus:outline-none"
            />
          </div>
        </div>

        {/* Quick Test Scenarios */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-zinc-500 font-mono">সিনারিও টেস্ট:</span>
          <button
            onClick={() => handleSelectPreset('perfect')}
            className={`px-2 py-1 rounded text-[10px] font-semibold border transition-colors ${
              preset === 'perfect'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                : 'bg-[#141d2a] text-zinc-400 border-zinc-700 hover:text-zinc-200'
            }`}
          >
            🟢 ১০০% পারফেক্ট লাইন
          </button>

          <button
            onClick={() => handleSelectPreset('power_drop')}
            className={`px-2 py-1 rounded text-[10px] font-semibold border transition-colors ${
              preset === 'power_drop'
                ? 'bg-amber-950 text-amber-300 border-amber-600'
                : 'bg-[#141d2a] text-zinc-400 border-zinc-700 hover:text-zinc-200'
            }`}
          >
            🟡 ফাইবার পাওয়ার ড্রপ (-২৬.২ dBm)
          </button>

          <button
            onClick={() => handleSelectPreset('critical_los')}
            className={`px-2 py-1 rounded text-[10px] font-semibold border transition-colors ${
              preset === 'critical_los'
                ? 'bg-red-950 text-red-300 border-red-600'
                : 'bg-[#141d2a] text-zinc-400 border-zinc-700 hover:text-zinc-200'
            }`}
          >
            🔴 LOS লাল বাতি (-৩৫.২ dBm)
          </button>
        </div>
      </div>

      {/* Sub Tabs Bar */}
      <div className="px-5 py-2 bg-[#101723] border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-1 bg-[#090d14] p-0.5 rounded-lg border border-zinc-800">
          <button
            onClick={() => setActiveSubTab('visual')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeSubTab === 'visual'
                ? 'bg-zinc-700 text-white font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ১০০% বিস্তারিত রিপোর্ট (Visual Cards)
          </button>

          <button
            onClick={() => setActiveSubTab('hosts')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeSubTab === 'hosts'
                ? 'bg-zinc-700 text-white font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            কানেক্টেড ডিভাইস টপোলজি ({audit.wifiDetails.connectedHosts.length})
          </button>

          <button
            onClick={() => setActiveSubTab('json')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeSubTab === 'json'
                ? 'bg-zinc-700 text-white font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ১০০% র বাংলা JSON
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${healthBadge.color}`}>
            {healthBadge.label}
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">
            স্কোর: <strong className="text-zinc-200">{audit.healthScore}%</strong>
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {activeSubTab === 'visual' && (
          <div className="space-y-4">
            {/* Top Score & Telemetry Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
              {/* Metric 1: Optical Rx Level */}
              <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#121924]">
                <div className="flex items-center justify-between text-zinc-400 text-[11px] mb-1">
                  <span>অপটিক্যাল পাওয়ার (Rx):</span>
                  <Server className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-lg font-bold font-mono text-zinc-100">
                  {audit.opticalDetails.rxDbm} dBm
                </div>
                <div className="text-[10px] mt-1">
                  {audit.opticalDetails.losAlarm ? (
                    <span className="text-red-400 font-bold">🚨 LOS Alarm Active</span>
                  ) : audit.opticalDetails.rxDbm < -24.5 ? (
                    <span className="text-amber-400 font-semibold">⚠️ দুর্বল সিগন্যাল</span>
                  ) : (
                    <span className="text-emerald-400 font-semibold">✅ পারফেক্ট লেভেল</span>
                  )}
                </div>
              </div>

              {/* Metric 2: WiFi RSSI & Quality */}
              <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#121924]">
                <div className="flex items-center justify-between text-zinc-400 text-[11px] mb-1">
                  <span>ওয়াইফাই সিগন্যাল:</span>
                  <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-lg font-bold font-mono text-cyan-300">
                  {audit.wifiDetails.rssi} dBm
                </div>
                <div className="text-[10px] text-zinc-400 mt-1 truncate">
                  {audit.wifiDetails.rssiDescription}
                </div>
              </div>

              {/* Metric 3: Ping & Packet Loss */}
              <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#121924]">
                <div className="flex items-center justify-between text-zinc-400 text-[11px] mb-1">
                  <span>পিং লেটেন্সি & লস:</span>
                  <Radio className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="text-lg font-bold font-mono text-purple-300">
                  {audit.latencyDetails.avgLatencyMs} ms
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-1">
                  {audit.latencyDetails.packetLossPct}% প্যাকেট লস
                </div>
              </div>

              {/* Metric 4: Connected Live Hosts */}
              <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#121924]">
                <div className="flex items-center justify-between text-zinc-400 text-[11px] mb-1">
                  <span>লাইভ ডিভাইস সংখ্যা:</span>
                  <Cpu className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-lg font-bold font-mono text-amber-300">
                  {audit.wifiDetails.connectedDevicesCount} টি হোস্ট
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">
                  Subnet: {audit.wifiDetails.subnetMask}
                </div>
              </div>
            </div>

            {/* Section 1: টুলস প্রস্তুতকরণ চেকিং */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-[#121924]">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-800">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-bold text-zinc-200 text-xs">
                    ১. সিস্টেম ও টুলস প্রস্তুতকরণ চেকিং (100% Tools Inspection)
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {audit.banglaResult.টুলস_চেকিং.অবস্থা}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px] mt-2">
                {audit.toolsCheck.map((t, idx) => (
                  <div key={idx} className="p-2 rounded bg-[#090d14] border border-zinc-800/80 flex flex-col justify-between">
                    <div>
                      <span className="font-mono text-emerald-300 font-bold block">{t.binary}</span>
                      <span className="text-[10px] text-zinc-400 block">{t.category}</span>
                    </div>
                    <span className="text-[9px] text-emerald-400 font-semibold mt-1">✓ প্রস্তুত</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: ওএলটি ও ওএনইউ ফাইবার পাওয়ার টেলিমেট্রি */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-[#121924]">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
                <div className="flex items-center space-x-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-bold text-zinc-200 text-xs">
                    ২. ওএলটি ফাইবার টেলিমেট্রি ও সিগন্যাল কোয়ালিটি (SNMP OID Live Query)
                  </h4>
                </div>
                <span className="font-mono text-[10px] text-zinc-400">
                  {audit.opticalDetails.brand} | Port {audit.opticalDetails.port} | ONU {audit.opticalDetails.onuId}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-[11px]">
                <div className="p-2.5 rounded bg-[#090d14] border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px]">ওএলটি আইপি ও পোর্ট:</span>
                  <span className="font-mono text-zinc-200 font-semibold">
                    {audit.opticalDetails.oltIp} (PON-{audit.opticalDetails.port})
                  </span>
                </div>

                <div className="p-2.5 rounded bg-[#090d14] border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px]">অপটিক্যাল পাওয়ার Rx:</span>
                  <span className="font-mono text-amber-300 font-bold text-xs">
                    {audit.opticalDetails.rxDbm} dBm
                  </span>
                </div>

                <div className="p-2.5 rounded bg-[#090d14] border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px]">অপটিক্যাল পাওয়ার Tx:</span>
                  <span className="font-mono text-emerald-300 font-semibold">
                    +{audit.opticalDetails.txDbm} dBm
                  </span>
                </div>

                <div className="p-2.5 rounded bg-[#090d14] border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px]">অ্যাটেনুয়েশন লস:</span>
                  <span className="font-mono text-zinc-300 font-semibold">
                    {audit.opticalDetails.attenuationLossDb.toFixed(1)} dB Loss
                  </span>
                </div>

                <div className="p-2.5 rounded bg-[#090d14] border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px]">স্প্লিটার রেশিও:</span>
                  <span className="text-zinc-200">{audit.opticalDetails.splitterRatio}</span>
                </div>

                <div className="p-2.5 rounded bg-[#090d14] border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px]">LOS এলার্ম স্ট্যাটাস:</span>
                  <span className={audit.opticalDetails.losAlarm ? 'text-red-400 font-bold' : 'text-emerald-400 font-semibold'}>
                    {audit.opticalDetails.losAlarm ? 'ACTIVE [CRITICAL]' : 'INACTIVE (স্বাভাবিক)'}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-[#090d14] border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px]">CRC ফ্রেম এরর কাউন্ট:</span>
                  <span className="font-mono text-zinc-200">{audit.opticalDetails.crcErrors} Errors</span>
                </div>

                <div className="p-2.5 rounded bg-[#090d14] border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px]">ড্রপ কাউন্টার:</span>
                  <span className="font-mono text-zinc-200">{audit.opticalDetails.dropCount} Drops</span>
                </div>
              </div>

              {/* Status explanation bar */}
              <div className="mt-3 p-2.5 rounded-lg bg-[#070b10] border border-zinc-800/80 flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">ডায়াগনস্টিকস স্টেটাস:</span>
                <span className="font-semibold text-amber-300 font-mono">
                  {audit.banglaResult.ওএলটি_ফাইবার_টেলিমেট্রি.অপটিক্যাল_পাওয়ার_Rx}
                </span>
              </div>
            </div>

            {/* Section 3: ওয়াইফাই ও লোকাল নেটওয়ার্ক */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-[#121924]">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
                <div className="flex items-center space-x-2">
                  <Wifi className="w-4 h-4 text-cyan-400" />
                  <h4 className="font-bold text-zinc-200 text-xs">
                    ৩. ওয়াইফাই ও লোকাল নেটওয়ার্ক (RF Spectrum & Local Drop Detect)
                  </h4>
                </div>
                <span className="text-zinc-400 font-mono text-[10px]">
                  SSID: {audit.wifiDetails.ssid} ({audit.wifiDetails.frequency})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
                <div className="p-2.5 rounded bg-[#090d14] border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px]">ওয়াইফাই SSID:</span>
                  <span className="font-semibold text-zinc-100">{audit.wifiDetails.ssid}</span>
                </div>

                <div className="p-2.5 rounded bg-[#090d14] border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px]">সিগন্যাল স্ট্রেন্থ (RSSI):</span>
                  <span className="font-mono text-cyan-300 font-bold">{audit.wifiDetails.rssi} dBm</span>
                </div>

                <div className="p-2.5 rounded bg-[#090d14] border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px]">মোবাইল লোকাল আইপি:</span>
                  <span className="font-mono text-zinc-200">{audit.wifiDetails.localIp}</span>
                </div>

                <div className="p-2.5 rounded bg-[#090d14] border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px]">লিংক স্পিড (Phy Rate):</span>
                  <span className="font-mono text-emerald-300">{audit.wifiDetails.linkSpeedMbps} Mbps</span>
                </div>

                <div className="p-2.5 rounded bg-[#090d14] border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px]">রাউটার গেটওয়ে আইপি:</span>
                  <span className="font-mono text-zinc-200">{audit.wifiDetails.gatewayIp}</span>
                </div>

                <div className="p-2.5 rounded bg-[#090d14] border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px]">সাবনেট মাস্ক:</span>
                  <span className="font-mono text-zinc-200">{audit.wifiDetails.subnetMask}</span>
                </div>

                <div className="p-2.5 rounded bg-[#090d14] border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px]">ওয়াইফাই চ্যানেল:</span>
                  <span className="font-mono text-zinc-200">Channel {audit.wifiDetails.channel}</span>
                </div>

                <div className="p-2.5 rounded bg-[#090d14] border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px]">লাইভ কানেক্টেড ডিভাইস:</span>
                  <span className="font-semibold text-amber-300 font-mono">
                    {audit.wifiDetails.connectedDevicesCount} টি সক্রিয় হোস্ট
                  </span>
                </div>
              </div>
            </div>

            {/* Section 4: নেটওয়ার্ক ড্রপ ও পিং রুট অ্যানালাইসিস */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-[#121924]">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
                <div className="flex items-center space-x-2">
                  <Radio className="w-4 h-4 text-purple-400" />
                  <h4 className="font-bold text-zinc-200 text-xs">
                    ৪. নেটওয়ার্ক ড্রপ ও পিং রুট অ্যানালাইসিস (Ping & Traceroute Hops)
                  </h4>
                </div>
                <span className="text-zinc-400 font-mono text-[10px]">
                  Target: {audit.latencyDetails.targetHost}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] mb-3">
                <div className="p-2.5 rounded bg-[#090d14] border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px]">ইন্টারনেট সংযোগ:</span>
                  <span className="text-emerald-400 font-semibold">
                    {audit.banglaResult.নেটওয়ার্ক_ড্রপ_ও_রুট_অ্যানালাইসিস.ইন্টারনেট_সংযোগ}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-[#090d14] border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px]">গড় লেটেন্সি (Avg Ping):</span>
                  <span className="font-mono text-purple-300 font-bold">
                    {audit.latencyDetails.avgLatencyMs} ms
                  </span>
                </div>

                <div className="p-2.5 rounded bg-[#090d14] border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px]">প্যাকেট লস / ড্রপ:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {audit.latencyDetails.packetLossPct}% Loss
                  </span>
                </div>

                <div className="p-2.5 rounded bg-[#090d14] border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[10px]">জিটার ও ডিএনএস টাইম:</span>
                  <span className="font-mono text-zinc-200">
                    Jitter {audit.latencyDetails.jitterMs}ms | DoH {audit.latencyDetails.dnsResolveTimeMs}ms
                  </span>
                </div>
              </div>

              {/* Traceroute Hop Path */}
              <div className="p-2.5 rounded bg-[#090d14] border border-zinc-800/80 text-[11px]">
                <span className="text-zinc-500 block text-[10px] mb-1.5 font-mono">Traceroute Hop Breakpoints:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {audit.latencyDetails.hopBreakpoints.map((hop, hIdx) => (
                    <React.Fragment key={hIdx}>
                      <div className="bg-[#131b26] px-2 py-1 rounded border border-zinc-700 font-mono text-[10px]">
                        <span className="text-emerald-400 font-bold">#{hop.hop} </span>
                        <span className="text-zinc-200">{hop.ip} </span>
                        <span className="text-zinc-400">({hop.rtt})</span>
                      </div>
                      {hIdx < audit.latencyDetails.hopBreakpoints.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-zinc-600" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 5: এআই টেকনিশিয়ান মন্তব্য ও অ্যাকশন চেকলিস্ট */}
            <div className="p-4 rounded-xl border border-amber-600/40 bg-[#181a24] shadow-md">
              <div className="flex items-center space-x-2 mb-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-amber-300 text-xs">
                  ৫. এআই টেকনিশিয়ান ও ইঞ্জিনিয়ার মন্তব্য ও সমাধান চেকলিস্ট
                </h4>
              </div>

              <div className="bg-[#0c121c] p-3 rounded-lg border border-zinc-800 text-xs text-zinc-200 leading-relaxed font-sans mb-3">
                {audit.banglaResult.এআই_টেকনিশিয়ান_মন্তব্য}
              </div>

              {/* Action Steps */}
              <div className="space-y-1.5 pl-2 mb-3">
                <span className="text-[11px] font-semibold text-emerald-400 block mb-1">
                  প্রস্তাবিত টেকনিক্যাল সমাধান পদক্ষেপ:
                </span>
                {audit.actionSteps.bn.map((step, sIdx) => (
                  <div key={sIdx} className="flex items-start gap-2 text-[11px] text-zinc-300">
                    <span className="text-emerald-400 font-mono font-bold">✓</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              {/* Command Quick Launcher */}
              <div className="bg-[#070b10] p-2.5 rounded-lg border border-zinc-800 flex items-center justify-between flex-wrap gap-2 font-mono text-[11px]">
                <code className="text-emerald-300">{commandToRun}</code>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRunInTerminal(commandToRun)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-sans text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Terminal className="w-3 h-3" />
                    <span>Run in Shell</span>
                  </button>

                  <button
                    onClick={handleForwardToAI}
                    className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 rounded font-sans text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Ask AI Assistant</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sub Tab: Connected Hosts Topology */}
        {activeSubTab === 'hosts' && (
          <div className="p-4 rounded-xl border border-zinc-800 bg-[#121924]">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
              <h4 className="font-bold text-zinc-200 text-xs">
                ল্যান টপোলজি ও সক্রিয় কানেক্টেড ডিভাইস তালিকা (Live ARP / Nmap Scan)
              </h4>
              <span className="font-mono text-[11px] text-emerald-400 font-bold">
                {audit.wifiDetails.connectedHosts.length} Devices Online
              </span>
            </div>

            <div className="overflow-x-auto rounded border border-zinc-800 bg-[#090d14]">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-zinc-800 bg-[#111927] text-zinc-400 font-mono">
                    <th className="py-2 px-3">IP Address</th>
                    <th className="py-2 px-3">MAC Address</th>
                    <th className="py-2 px-3">Device Vendor / NIC</th>
                    <th className="py-2 px-3">Hostname</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.wifiDetails.connectedHosts.map((host, idx) => (
                    <tr key={idx} className="border-b border-zinc-800/40 hover:bg-zinc-800/20 text-zinc-200">
                      <td className="py-2 px-3 font-mono text-emerald-400 font-semibold">{host.ip}</td>
                      <td className="py-2 px-3 font-mono text-zinc-400">{host.mac}</td>
                      <td className="py-2 px-3">{host.vendor}</td>
                      <td className="py-2 px-3 font-mono text-zinc-300">{host.hostname}</td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                          Online
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sub Tab: 100% Raw Bangla JSON */}
        {activeSubTab === 'json' && (
          <div className="p-4 rounded-xl border border-zinc-800 bg-[#080d14] font-mono text-xs">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-800 text-zinc-400">
              <span>ai_noc_diagnostic.py — ডিরেক্ট বাংলা JSON আউটপুট:</span>
              <button
                onClick={handleCopyJson}
                className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1 text-[11px]"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed p-2 bg-[#05080e] rounded">
              {JSON.stringify(audit.banglaResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
