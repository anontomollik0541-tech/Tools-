import React, { useState } from 'react';
import {
  Globe,
  Search,
  ExternalLink,
  Shield,
  Copy,
  Check,
  Terminal,
  X,
} from 'lucide-react';
import { SupportedLanguage } from '../types/assistant';

interface BrowserConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunInTerminal: (cmd: string) => void;
  language: SupportedLanguage;
}

export const BrowserConnectModal: React.FC<BrowserConnectModalProps> = ({
  isOpen,
  onClose,
  onRunInTerminal,
  language,
}) => {
  const [googleQuery, setGoogleQuery] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [filetypeFilter, setFiletypeFilter] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const buildDorkQuery = () => {
    let q = googleQuery.trim();
    if (siteFilter.trim()) q += ` site:${siteFilter.trim()}`;
    if (filetypeFilter.trim()) q += ` filetype:${filetypeFilter.trim()}`;
    return q;
  };

  const handleLaunchGoogle = () => {
    const q = buildDorkQuery();
    if (!q) return;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const torCommands = [
    'pkg update && pkg install -y tor',
    'tor &',
    'torsocks curl -s https://check.torproject.org | grep -i congrat',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#111824] border border-zinc-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden text-xs">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#162030] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Globe className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {language === 'bn' ? 'গুগল এবং টর ব্রাউজার কানেক্ট স্যুট' : language === 'banglish' ? 'Google & Tor Browser Connect' : 'Google & Tor Browser Connection Suite'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {language === 'bn'
                  ? 'উন্নত গুগল সার্চ ডর্ক ও টারম্যাক্সে টর প্রক্সি সেটআপ গাইড।'
                  : language === 'banglish'
                  ? 'Advanced Google search dork ebong Termux e Tor proxy guide.'
                  : 'Advanced search operators, onion routing setup, and privacy engine gateways.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Google Advanced Search & Dorking */}
          <div className="bg-[#0b1017] border border-zinc-800 rounded-xl p-4">
            <h4 className="text-xs font-bold text-zinc-200 mb-2 flex items-center gap-1.5">
              <Search className="w-4 h-4 text-emerald-400" />
              Google Advanced & OSINT Search
            </h4>
            <div className="space-y-2.5">
              <div>
                <label className="block text-zinc-400 text-[11px] mb-1">Keywords / Search Term</label>
                <input
                  type="text"
                  value={googleQuery}
                  onChange={(e) => setGoogleQuery(e.target.value)}
                  placeholder="e.g. termux network diagnostics or router security"
                  className="w-full bg-[#131b26] border border-zinc-700 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 text-[11px] mb-1">Target Domain (site:)</label>
                  <input
                    type="text"
                    value={siteFilter}
                    onChange={(e) => setSiteFilter(e.target.value)}
                    placeholder="e.g. github.com"
                    className="w-full bg-[#131b26] border border-zinc-700 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-[11px] mb-1">File Type (filetype:)</label>
                  <input
                    type="text"
                    value={filetypeFilter}
                    onChange={(e) => setFiletypeFilter(e.target.value)}
                    placeholder="e.g. pdf, txt, conf"
                    className="w-full bg-[#131b26] border border-zinc-700 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Preview & Open */}
              <div className="flex items-center justify-between pt-1">
                <span className="font-mono text-[11px] text-zinc-400 truncate max-w-[70%]">
                  Query: <code className="text-emerald-300">{buildDorkQuery() || '(empty)'}</code>
                </span>
                <button
                  onClick={handleLaunchGoogle}
                  disabled={!buildDorkQuery()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Search on Google</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Tor Browser & Onion Routing Setup */}
          <div className="bg-[#0b1017] border border-zinc-800 rounded-xl p-4">
            <h4 className="text-xs font-bold text-zinc-200 mb-2 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-purple-400" />
              Tor Browser & SOCKS5 Proxy for Termux
            </h4>
            <p className="text-zinc-400 text-[11px] mb-3 leading-relaxed">
              Route your Termux curl/git/nmap connections through Tor SOCKS5 daemon (`127.0.0.1:9050`) to mask all outgoing traces.
            </p>

            <div className="space-y-2">
              {torCommands.map((cmd, idx) => (
                <div
                  key={idx}
                  className="bg-[#131b26] p-2.5 rounded-lg border border-zinc-800 flex items-center justify-between font-mono text-[11px]"
                >
                  <code className="text-purple-300 truncate mr-2">{cmd}</code>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopy(cmd)}
                      title="Copy command"
                      className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                    >
                      {copiedText === cmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => {
                        onRunInTerminal(cmd);
                        onClose();
                      }}
                      title="Execute in Shell"
                      className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Terminal className="w-3 h-3" />
                      <span>Run</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Onion Search Links */}
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between flex-wrap gap-2 text-[11px]">
              <span className="text-zinc-400">Tor Onion Gateways:</span>
              <div className="flex items-center gap-2">
                <a
                  href="https://duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded bg-[#162030] hover:bg-purple-950/60 text-purple-300 border border-purple-800/60 flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>DuckDuckGo (.onion)</span>
                </a>
                <a
                  href="https://startpage.com"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded bg-[#162030] hover:bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Startpage</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
