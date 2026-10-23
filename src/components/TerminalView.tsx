import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TermIcon,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Copy,
  Check,
} from 'lucide-react';
import { TerminalEntry, Language } from '../types/network';
import { SCENARIOS } from '../data/demoSnapshots';

interface TerminalViewProps {
  entries: TerminalEntry[];
  onExecuteCommand: (cmd: string) => void;
  onClear: () => void;
  onSendToAI: (content: string) => void;
  currentScenario: string;
  onSelectScenario: (scenarioKey: string) => void;
  language: Language;
}

export const TerminalView: React.FC<TerminalViewProps> = ({
  entries,
  onExecuteCommand,
  onClear,
  onSendToAI,
  currentScenario,
  onSelectScenario,
  language,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim()) return;

    const cmd = inputVal.trim();
    setHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    setInputVal('');
    onExecuteCommand(cmd);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInputVal(history[nextIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= history.length) {
        setHistoryIndex(-1);
        setInputVal('');
      } else {
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx] || '');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple tab completion
      const common = ['diagnose', 'report', 'status', 'optical', 'wifi', 'router', 'leakcheck', 'malwarescan', 'autorun', 'dns', 'ping', 'whois', 'clear'];
      const matched = common.find(c => c.startsWith(inputVal.trim().toLowerCase()));
      if (matched) {
        setInputVal(matched);
      }
    }
  };

  const insertExtraKey = (key: string) => {
    if (key === 'CLEAR') {
      onClear();
      return;
    }
    if (key === 'TAB') {
      const common = ['diagnose', 'report', 'status', 'optical', 'wifi', 'router', 'leakcheck', 'malwarescan', 'autorun', 'dns', 'ping'];
      const matched = common.find(c => c.startsWith(inputVal.trim().toLowerCase()));
      if (matched) setInputVal(matched);
      return;
    }
    setInputVal(prev => prev + key);
    inputRef.current?.focus();
  };

  const handleSendLatestOutputToAI = () => {
    const outputs = entries.filter(e => e.type === 'output' || e.type === 'error');
    if (outputs.length === 0) return;
    const last = outputs[outputs.length - 1];
    if (last.content) {
      onSendToAI(last.content);
    }
  };

  const copyEntry = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] min-h-[500px] bg-[#080d14] rounded-xl border border-zinc-800 shadow-2xl overflow-hidden font-mono text-xs">
      {/* Terminal Title Bar & Scenario Controls */}
      <div className="px-4 py-2 bg-[#0e1622] border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
          </div>
          <span className="text-zinc-400 text-xs font-semibold ml-2 flex items-center gap-1.5">
            <TermIcon className="w-3.5 h-3.5 text-emerald-400" />
            termux@aarch64: ~
          </span>
        </div>

        {/* Scenario Selector & Action buttons */}
        <div className="flex items-center space-x-2 flex-wrap">
          <div className="flex items-center space-x-1.5 text-[11px] text-zinc-400">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>Scenario:</span>
            <select
              value={currentScenario}
              onChange={(e) => onSelectScenario(e.target.value)}
              className="bg-[#141e2e] border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              {Object.entries(SCENARIOS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSendLatestOutputToAI}
            title="Send terminal output directly to AI Chat to diagnose & recommend next command"
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-xs transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            <span className="hidden sm:inline">Send Output to AI</span>
          </button>

          <button
            onClick={onClear}
            title="Clear Terminal Window"
            className="flex items-center space-x-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Terminal Output Log Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2.5 bg-[#070b10] selection:bg-emerald-500/30 selection:text-emerald-200">
        {entries.map((entry) => {
          if (entry.type === 'input') {
            return (
              <div key={entry.id} className="flex items-center text-emerald-400">
                <span className="text-zinc-500 mr-2">u0_a184@localhost:~$</span>
                <span className="font-bold">{entry.content}</span>
              </div>
            );
          }

          if (entry.type === 'table' && entry.tableData) {
            return (
              <div key={entry.id} className="my-2 overflow-x-auto rounded border border-zinc-800 bg-[#0c121c]">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-[#111927] text-zinc-400">
                      {entry.tableData.headers.map((h, i) => (
                        <th key={i} className="py-1.5 px-3 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entry.tableData.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-zinc-800/40 hover:bg-zinc-800/20 text-zinc-200">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="py-1 px-3">
                            {String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          const isError = entry.type === 'error';
          const isSuccess = entry.type === 'success';
          const isSystem = entry.type === 'system';

          return (
            <div
              key={entry.id}
              className={`relative group rounded p-2 text-xs leading-relaxed ${
                isError
                  ? 'text-red-400 bg-red-950/20 border-l-2 border-red-500'
                  : isSuccess
                  ? 'text-emerald-300 bg-emerald-950/20 border-l-2 border-emerald-500'
                  : isSystem
                  ? 'text-cyan-300 bg-cyan-950/20 border-l-2 border-cyan-500'
                  : 'text-zinc-300'
              }`}
            >
              <pre className="whitespace-pre-wrap font-mono">{entry.content}</pre>

              {/* Copy quick action */}
              {entry.content && (
                <button
                  onClick={() => copyEntry(entry.id, entry.content!)}
                  title="Copy output line"
                  className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition-opacity"
                >
                  {copiedId === entry.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
            </div>
          );
        })}
        <div ref={terminalEndRef} />
      </div>

      {/* Termux Extra Keys Bar */}
      <div className="px-2 py-1.5 bg-[#0d141e] border-t border-zinc-800 flex items-center gap-1 overflow-x-auto text-[11px] font-semibold text-zinc-300 select-none">
        {['ESC', 'TAB', 'CTRL', 'ALT', '-', '/', '|', '~', 'CLEAR'].map((key) => (
          <button
            key={key}
            onClick={() => insertExtraKey(key)}
            className="px-2.5 py-1 rounded bg-[#15202f] hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/50 transition-colors shadow-xs active:bg-emerald-600"
          >
            {key}
          </button>
        ))}
      </div>

      {/* Interactive Command Prompt Input */}
      <form onSubmit={handleSubmit} className="p-2.5 bg-[#0e1622] border-t border-zinc-800 flex items-center gap-2">
        <span className="text-emerald-400 font-bold whitespace-nowrap">
          u0_a184@localhost:~$
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          placeholder={
            language === 'bn'
              ? "কমান্ড টাইপ করুন ('help', 'diagnose', 'optical', 'ping 1.1.1.1', 'leakcheck')..."
              : "type 'help', 'diagnose', 'optical', 'ping 1.1.1.1', 'dns cloudflare.com', 'leakcheck'..."
          }
          className="flex-1 bg-transparent text-emerald-200 focus:outline-none font-mono text-xs placeholder-zinc-600 caret-emerald-400"
        />
        <button
          type="submit"
          className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1 transition-colors"
        >
          <Play className="w-3 h-3" />
          <span>Execute</span>
        </button>
      </form>
    </div>
  );
};
