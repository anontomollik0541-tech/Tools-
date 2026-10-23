import React, { useState } from 'react';
import {
  Activity,
  Wifi,
  Server,
  Radio,
  Cpu,
  Copy,
  Check,
  Terminal,
  Sparkles,
  X,
  Play,
} from 'lucide-react';
import { runAiNocDiagnostic, BanglaNocResult, NocDiagnosticParams } from '../services/aiNocDiagnostic';
import { SupportedLanguage } from '../types/assistant';

interface AiNocDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunInTerminal: (cmd: string) => void;
  onSendToAI: (content: string) => void;
  language: SupportedLanguage;
}

export const AiNocDiagnosticModal: React.FC<AiNocDiagnosticModalProps> = ({
  isOpen,
  onClose,
  onRunInTerminal,
  onSendToAI,
  language,
}) => {
  const [oltIp, setOltIp] = useState('10.10.20.5');
  const [brand, setBrand] = useState('vsol');
  const [port, setPort] = useState('1');
  const [onu, setOnu] = useState('12');
  const [result, setResult] = useState<BanglaNocResult | null>(() => runAiNocDiagnostic().banglaResult);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'json'>('cards');

  if (!isOpen) return null;

  const handleRunDiagnostic = (params?: NocDiagnosticParams) => {
    const diagResult = runAiNocDiagnostic(
      params || {
        oltIp,
        brand,
        port,
        onu,
      }
    );
    setResult(diagResult.banglaResult);
  };

  const handleCopyJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleForwardToAI = () => {
    if (!result) return;
    const jsonStr = JSON.stringify(result, null, 2);
    const prompt =
      language === 'bn'
        ? `আমি ai_noc_diagnostic.py এর এই বাংলা রিপোর্ট পেয়েছি:\n\`\`\`json\n${jsonStr}\n\`\`\`\nঅনুগ্রহ করে ফাইবার পাওয়ার ড্রপ এবং নেটওয়ার্ক সমস্যা সমাধানের জন্য পরবর্তী করণীয় বলে দিন।`
        : language === 'banglish'
        ? `Ami ai_noc_diagnostic.py run kore ei Bangla result paisi:\n\`\`\`json\n${jsonStr}\n\`\`\`\nFibre power drop ba network fix korte pore ki korbo bolo.`
        : `Here is the ai_noc_diagnostic.py diagnostic result:\n\`\`\`json\n${jsonStr}\n\`\`\`\nPlease analyze the optical power level and provide technical remediation advice.`;
    onSendToAI(prompt);
    onClose();
  };

  const commandToRun = `python3 ai_noc_diagnostic.py ${oltIp} ${brand} ${port} ${onu}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#101722] border border-zinc-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden text-xs flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#162130] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                AI NOC Diagnostic Automation (ai_noc_diagnostic.py)
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  বাংলা আউটপুট
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                স্বয়ংক্রিয়ভাবে OLT ONU ফাইবার পাওয়ার, ওয়াইফাই সিগন্যাল ও ড্রপ টেস্ট করে সরাসরি বাংলায় ফলাফল দেয়।
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

        {/* Input Parameters Bar */}
        <div className="p-4 bg-[#0d131d] border-b border-zinc-800 grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-end">
          <div>
            <label className="block text-zinc-400 text-[10px] font-mono mb-1">OLT IP Address</label>
            <input
              type="text"
              value={oltIp}
              onChange={(e) => setOltIp(e.target.value)}
              placeholder="10.10.20.5"
              className="w-full bg-[#141d2a] border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-[10px] font-mono mb-1">OLT Brand</label>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full bg-[#141d2a] border border-zinc-700 rounded px-2 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="vsol">VSOL</option>
              <option value="cdata">CDATA</option>
              <option value="bdcom">BDCOM</option>
              <option value="huawei">Huawei</option>
              <option value="zte">ZTE</option>
            </select>
          </div>

          <div>
            <label className="block text-zinc-400 text-[10px] font-mono mb-1">PON Port</label>
            <input
              type="text"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="1"
              className="w-full bg-[#141d2a] border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-[10px] font-mono mb-1">ONU ID</label>
            <input
              type="text"
              value={onu}
              onChange={(e) => setOnu(e.target.value)}
              placeholder="12"
              className="w-full bg-[#141d2a] border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <button
              onClick={() => handleRunDiagnostic()}
              className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Play className="w-3.5 h-3.5" />
              <span>রান করুন</span>
            </button>
          </div>
        </div>

        {/* View Mode Toggle & Shell Command Bar */}
        <div className="px-5 py-2 bg-[#121a26] border-b border-zinc-800 flex items-center justify-between flex-wrap gap-2 text-[11px]">
          <div className="flex items-center space-x-1.5 font-mono text-zinc-300">
            <span className="text-zinc-500 font-bold">&gt;</span>
            <code className="text-emerald-400">{commandToRun}</code>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-[#090e16] rounded p-0.5 border border-zinc-800">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  viewMode === 'cards' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                ভিজ্যুয়াল কার্ড
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  viewMode === 'json' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                বাংলা JSON
              </button>
            </div>

            <button
              onClick={() => {
                onRunInTerminal(commandToRun);
                onClose();
              }}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1 transition-colors"
              title="Run in Termux Shell"
            >
              <Terminal className="w-3 h-3 text-emerald-400" />
              <span>Shell Run</span>
            </button>

            <button
              onClick={handleCopyJson}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1 transition-colors"
              title="Copy Output"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleForwardToAI}
              className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 flex items-center gap-1 transition-colors"
              title="Send to AI Assistant"
            >
              <Sparkles className="w-3 h-3" />
              <span>এআই সমাধান নিন</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {result && viewMode === 'cards' && (
            <div className="space-y-3.5">
              {/* Card 1: ওএলটি ফাইবার টেলিমেট্রি */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-[#121924]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-bold text-zinc-200 text-xs">ওএলটি ফাইবার টেলিমেট্রি (Optical Power)</h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {result.ওএলটি_ফাইবার_টেলিমেট্রি.পোর্ট_ও_ওএনইউ}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] mt-2">
                  <div className="p-2.5 rounded bg-[#090e15] border border-zinc-800/80">
                    <span className="text-zinc-400 block mb-0.5">ওএলটি আইপি:</span>
                    <span className="font-mono text-zinc-100 font-semibold">{result.ওএলটি_ফাইবার_টেলিমেট্রি.ওএলটি_আইপি}</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#090e15] border border-zinc-800/80">
                    <span className="text-zinc-400 block mb-0.5">অপটিক্যাল পাওয়ার Rx:</span>
                    <span className="font-mono text-amber-300 font-bold">{result.ওএলটি_ফাইবার_টেলিমেট্রি.অপটিক্যাল_পাওয়ার_Rx}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: ওয়াইফাই ও লোকাল নেটওয়ার্ক */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-[#121924]">
                <div className="flex items-center space-x-2 mb-2">
                  <Wifi className="w-4 h-4 text-cyan-400" />
                  <h4 className="font-bold text-zinc-200 text-xs">ওয়াইফাই ও লোকাল নেটওয়ার্ক (Device Drop Detect)</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] mt-2">
                  <div className="p-2 rounded bg-[#090e15] border border-zinc-800/80">
                    <span className="text-zinc-400 block text-[10px]">ওয়াইফাই নাম:</span>
                    <span className="font-semibold text-zinc-100">{result.ওয়াইফাই_ও_লোকাল_নেটওয়ার্ক.ওয়াইফাই_নাম}</span>
                  </div>
                  <div className="p-2 rounded bg-[#090e15] border border-zinc-800/80">
                    <span className="text-zinc-400 block text-[10px]">সিগন্যাল স্ট্রেন্থ:</span>
                    <span className="text-emerald-300">{result.ওয়াইফাই_ও_লোকাল_নেটওয়ার্ক.সিগন্যাল}</span>
                  </div>
                  <div className="p-2 rounded bg-[#090e15] border border-zinc-800/80">
                    <span className="text-zinc-400 block text-[10px]">মোবাইল আইপি:</span>
                    <span className="font-mono text-zinc-200">{result.ওয়াইফাই_ও_লোকাল_নেটওয়ার্ক.মোবাইল_আইপি}</span>
                  </div>
                  <div className="p-2 rounded bg-[#090e15] border border-zinc-800/80">
                    <span className="text-zinc-400 block text-[10px]">লাইভ ডিভাইস:</span>
                    <span className="font-semibold text-zinc-200">{result.ওয়াইফাই_ও_লোকাল_নেটওয়ার্ক.কানেক্টেড_ডিভাইস_সংখ্যা}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: নেটওয়ার্ক ড্রপ ও পিং ডায়াগনস্টিকস */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-[#121924]">
                <div className="flex items-center space-x-2 mb-2">
                  <Radio className="w-4 h-4 text-purple-400" />
                  <h4 className="font-bold text-zinc-200 text-xs">নেটওয়ার্ক ড্রপ ও রুট অ্যানালাইসিস (Ping / RTT)</h4>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] mt-2">
                  <div className="p-2.5 rounded bg-[#090e15] border border-zinc-800/80">
                    <span className="text-zinc-400 block mb-0.5">ইন্টারনেট সংযোগ:</span>
                    <span className="text-emerald-400 font-semibold">{result.নেটওয়ার্ক_ড্রপ_ও_রুট_অ্যানালাইসিস.ইন্টারনেট_সংযোগ}</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#090e15] border border-zinc-800/80">
                    <span className="text-zinc-400 block mb-0.5">গড় লেটেন্সি:</span>
                    <span className="font-mono text-zinc-100 font-bold">{result.নেটওয়ার্ক_ড্রপ_ও_রুট_অ্যানালাইসিস.গড়_লেটেন্সি_Ping}</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#090e15] border border-zinc-800/80">
                    <span className="text-zinc-400 block mb-0.5">প্যাকেট ড্রপ:</span>
                    <span className="text-emerald-400 font-semibold">{result.নেটওয়ার্ক_ড্রপ_ও_রুট_অ্যানালাইসিস.প্যাকেট_ড্রপ}</span>
                  </div>
                </div>
              </div>

              {/* Card 4: এআই টেকনিশিয়ান মন্তব্য */}
              <div className="p-4 rounded-xl border border-amber-600/40 bg-[#181a24]">
                <div className="flex items-center space-x-2 mb-2">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-amber-300 text-xs">এআই টেকনিশিয়ান মন্তব্য ও নির্দেশনা</h4>
                </div>
                <p className="text-zinc-200 text-xs leading-relaxed font-sans bg-[#0d121b] p-3 rounded-lg border border-zinc-800">
                  {result.এআই_টেকনিশিয়ান_মন্তব্য}
                </p>
              </div>
            </div>
          )}

          {result && viewMode === 'json' && (
            <div className="bg-[#080d14] p-4 rounded-xl border border-zinc-800 font-mono text-xs">
              <pre className="text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
