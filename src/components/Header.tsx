import React from 'react';
import {
  Terminal,
  Bot,
  Layers,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Download,
  Play,
  Activity,
} from 'lucide-react';
import { SupportedLanguage, PrivacySettings } from '../types/assistant';

interface HeaderProps {
  activeTab: 'terminal' | 'chat' | 'noc' | 'tools' | 'device';
  setActiveTab: (tab: 'terminal' | 'chat' | 'noc' | 'tools' | 'device') => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  privacy: PrivacySettings;
  setPrivacy: React.Dispatch<React.SetStateAction<PrivacySettings>>;
  onOpenConnectModal: () => void;
  onOpenExportModal: () => void;
  onOpenNocModal: () => void;
  onRunAutoDetect: () => void;
  isAutoDetectRunning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  privacy,
  setPrivacy,
  onOpenConnectModal,
  onOpenExportModal,
  onOpenNocModal,
  onRunAutoDetect,
  isAutoDetectRunning,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-[#0b1017] sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold shadow-sm">
            &gt;_
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                Termux NOC Diagnostics
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/50">
                v2.4
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              {language === 'bn'
                ? 'টারম্যাক্স শেল, এআই অ্যাসিস্ট্যান্ট ও সাইবার সিকিউরিটি টুলকিট'
                : language === 'banglish'
                ? 'Termux Shell, AI Assistant & Cyber Security Suite'
                : 'Linux / Termux Shell, AI Diagnostics & Security Telemetry'}
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center bg-[#131b26] p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'terminal'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'টার্মিনাল' : language === 'banglish' ? 'Termux Shell' : 'Terminal Shell'}</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all relative ${
              activeTab === 'chat'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'এআই সহকারী' : language === 'banglish' ? 'AI Assistant' : 'AI Assistant'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
          </button>

          {/* Dedicated NOC Diagnostics Navigation Button */}
          <button
            onClick={() => setActiveTab('noc')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'noc'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{language === 'bn' ? 'NOC ডায়াগনস্টিকস' : language === 'banglish' ? 'NOC Diag' : 'NOC Diagnostics'}</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono font-bold">
              100%
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tools')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'tools'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'টুলস হাব' : language === 'banglish' ? 'Tools Hub' : 'Tools Hub'}</span>
          </button>

          <button
            onClick={() => setActiveTab('device')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'device'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'ডিভাইস লিক' : language === 'banglish' ? 'Device Audit' : 'Device & Leaks'}</span>
          </button>
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center space-x-2 flex-wrap">
          {/* Auto-Detect Quick Action Button */}
          <button
            onClick={onRunAutoDetect}
            disabled={isAutoDetectRunning}
            title="Auto-detect tools health (True/False) & post to AI chat"
            className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors shadow-sm"
          >
            <Play className={`w-3.5 h-3.5 ${isAutoDetectRunning ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {isAutoDetectRunning
                ? 'Scanning...'
                : language === 'bn'
                ? 'অটো রান'
                : language === 'banglish'
                ? 'Auto Run'
                : 'Auto Run Tools'}
            </span>
          </button>

          {/* Privacy Guard Safe Toggle */}
          <button
            onClick={() => setPrivacy(prev => ({ ...prev, enabled: !prev.enabled }))}
            title={privacy.enabled ? 'Privacy Guard ON: Personal data is masked on export' : 'Privacy Guard OFF'}
            className={`flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-all ${
              privacy.enabled
                ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                : 'bg-zinc-800/60 border-zinc-700 text-zinc-400'
            }`}
          >
            {privacy.enabled ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> : <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />}
            <span className="hidden md:inline">
              {privacy.enabled ? 'Safe Guard' : 'Masking Off'}
            </span>
          </button>

          {/* AI NOC Bangla Diagnostic Button */}
          <button
            onClick={onOpenNocModal}
            title="AI NOC Diagnostic Automation (ai_noc_diagnostic.py)"
            className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 transition-colors shadow-xs"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">AI NOC বাংলা</span>
          </button>

          {/* Google & Tor Connect Button */}
          <button
            onClick={onOpenConnectModal}
            title="Google & Tor Browser Connect"
            className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-[#131b26] hover:bg-[#1c2737] text-zinc-300 border border-zinc-700/60 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Google / Tor</span>
          </button>

          {/* Export / Import Button */}
          <button
            onClick={onOpenExportModal}
            title="Export / Import Files safely"
            className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-[#131b26] hover:bg-[#1c2737] text-zinc-300 border border-zinc-700/60 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Export / Import</span>
          </button>

          {/* Tri-Language Selector */}
          <div className="flex items-center bg-[#131b26] rounded-md border border-zinc-800 p-0.5 text-xs font-medium">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded transition-colors ${
                language === 'en' ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('bn')}
              className={`px-2 py-1 rounded transition-colors ${
                language === 'bn' ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              বাং
            </button>
            <button
              onClick={() => setLanguage('banglish')}
              className={`px-2 py-1 rounded transition-colors ${
                language === 'banglish' ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Banglish"
            >
              Banglish
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
