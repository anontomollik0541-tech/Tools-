import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Terminal,
  Copy,
  Check,
  Play,
  ClipboardPaste,
  Trash2,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  Bot,
} from 'lucide-react';
import { ChatMessage, SupportedLanguage } from '../types/assistant';
import {
  addKnowledgeNote,
  clearConversationMemories,
  listConversationMemories,
  listKnowledgeNotes,
  saveConversationMemory,
  type ApprovedMemory,
  type KnowledgeNote,
} from '../services/conversationKnowledge';

interface AIChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onRunInTerminal: (command: string) => void;
  onClearChat: () => void;
  language: SupportedLanguage;
}

export const AIChatBox: React.FC<AIChatBoxProps> = ({
  messages,
  onSendMessage,
  onRunInTerminal,
  onClearChat,
  language,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pasteBoxOpen, setPasteBoxOpen] = useState(false);
  const [pastedLog, setPastedLog] = useState('');
  const [knowledgePanelOpen, setKnowledgePanelOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [memoryText, setMemoryText] = useState('');
  const [memoryApproved, setMemoryApproved] = useState(false);
  const [knowledgeNotes, setKnowledgeNotes] = useState<KnowledgeNote[]>([]);
  const [memories, setMemories] = useState<ApprovedMemory[]>([]);
  const [knowledgeStatus, setKnowledgeStatus] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const refreshKnowledge = () => {
    setKnowledgeNotes(listKnowledgeNotes());
    setMemories(listConversationMemories());
  };

  useEffect(() => {
    refreshKnowledge();
  }, []);

  const handleAddKnowledgeNote = () => {
    try {
      addKnowledgeNote(noteTitle, noteContent);
      setNoteTitle('');
      setNoteContent('');
      setKnowledgeStatus(language === 'bn' ? 'Knowledge নোট এই ব্রাউজারে সংরক্ষিত হয়েছে।' : 'Knowledge note saved in this browser.');
      refreshKnowledge();
    } catch (error) {
      setKnowledgeStatus(error instanceof Error ? error.message : 'Could not save note.');
    }
  };

  const handleSaveMemory = () => {
    try {
      saveConversationMemory(memoryText, memoryApproved);
      setMemoryText('');
      setMemoryApproved(false);
      setKnowledgeStatus(language === 'bn' ? 'অনুমোদিত Memory এই ব্রাউজারে সংরক্ষিত হয়েছে।' : 'Approved memory saved in this browser.');
      refreshKnowledge();
    } catch (error) {
      setKnowledgeStatus(error instanceof Error ? error.message : 'Could not save memory.');
    }
  };

  const handleClearMemories = () => {
    if (!window.confirm(language === 'bn' ? 'সব সংরক্ষিত Memory মুছে ফেলবেন?' : 'Clear all saved memories?')) return;
    try {
      const count = clearConversationMemories(true);
      setKnowledgeStatus(`Cleared ${count} saved memories.`);
      refreshKnowledge();
    } catch (error) {
      setKnowledgeStatus(error instanceof Error ? error.message : 'Could not clear memories.');
    }
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePasteLogSubmit = () => {
    if (!pastedLog.trim()) return;
    onSendMessage(pastedLog.trim());
    setPastedLog('');
    setPasteBoxOpen(false);
  };

  // Quick prompt chips depending on active language
  const promptChips = {
    en: [
      'What tools do I need for website security check?',
      'My WiFi is slow, what should I do?',
      'Check if my device or IP is leaking',
      'Suggest next command after ping',
    ],
    bn: [
      'ওয়েবসাইট সিকিউরিটি চেক করতে কি টুল লাগবে?',
      'আমার ওয়াইফাই স্লো, কি করব?',
      'ডিভাইসে কোনো ভাইরাস বা আইপি লিক আছে কিনা?',
      'টারম্যাক্সে এনম্যাপ ইন্সটল করব কীভাবে?',
    ],
    banglish: [
      'Website security check korte ki tool lagbe?',
      'Amar wifi slow, ki korbo bolbe?',
      'Device e kono malware ba IP leak ache kina?',
      'Termux e missing command thakle next ki dibo?',
    ],
  }[language];

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] min-h-[500px] bg-[#0d131d] rounded-xl border border-zinc-800 shadow-xl overflow-hidden">
      {/* Top Chat Header */}
      <div className="px-4 py-3 bg-[#131b26] border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
              {language === 'bn' ? 'এআই ডায়াগনস্টিক সহকারী' : language === 'banglish' ? 'AI Assistant & Command Advisor' : 'AI Assistant & Command Advisor'}
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                Online
              </span>
            </h2>
            <p className="text-[11px] text-zinc-400">
              {language === 'bn'
                ? 'টার্মিনাল আউটপুট বা ত্রুটি পেস্ট করুন, পরবর্তী সঠিক কমান্ড জেনে নিন।'
                : language === 'banglish'
                ? 'Terminal log ba error paste koro, AI next command bole dibe.'
                : 'Paste terminal logs or ask for tool recommendations in English / Bangla / Banglish.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setKnowledgePanelOpen((open) => !open)}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded bg-sky-900/40 hover:bg-sky-800/50 text-sky-300 border border-sky-700/50 transition-colors"
            title="Local Knowledge and opt-in Memory"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'Knowledge / Memory' : 'Knowledge / Memory'}</span>
          </button>
          <button
            onClick={() => setPasteBoxOpen(!pasteBoxOpen)}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded bg-emerald-900/40 hover:bg-emerald-800/50 text-emerald-300 border border-emerald-700/50 transition-colors"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'লগ পেস্ট করুন' : language === 'banglish' ? 'Paste Log' : 'Paste Log'}</span>
          </button>

          <button
            onClick={onClearChat}
            title="Clear Chat History"
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Browser-local Knowledge and explicit opt-in Memory */}
      {knowledgePanelOpen && (
        <section className="p-3 bg-[#0a111a] border-b border-zinc-800 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold text-sky-300">Local Knowledge & Memory</h3>
            <span className="text-[10px] text-zinc-500">Saved only in this browser</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2 rounded-lg border border-zinc-700 p-3">
              <h4 className="text-xs font-semibold text-zinc-200">Add Knowledge Note</h4>
              <input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Note title" className="w-full bg-[#111722] border border-zinc-700 rounded p-2 text-xs text-zinc-100" />
              <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Facts, project details, or instructions to reuse..." rows={3} className="w-full bg-[#111722] border border-zinc-700 rounded p-2 text-xs text-zinc-100" />
              <button onClick={handleAddKnowledgeNote} disabled={!noteTitle.trim() || !noteContent.trim()} className="px-3 py-1.5 rounded bg-sky-700 hover:bg-sky-600 disabled:opacity-40 text-white text-xs">Save Knowledge</button>
              <p className="text-[10px] text-zinc-400">Saved notes may be appended to replies when they match your question.</p>
            </div>
            <div className="space-y-2 rounded-lg border border-zinc-700 p-3">
              <h4 className="text-xs font-semibold text-zinc-200">Opt-in Memory</h4>
              <textarea value={memoryText} onChange={(e) => setMemoryText(e.target.value)} placeholder="Write the exact detail you want the assistant to remember..." rows={3} className="w-full bg-[#111722] border border-zinc-700 rounded p-2 text-xs text-zinc-100" />
              <label className="flex items-start gap-2 text-[11px] text-zinc-300">
                <input type="checkbox" checked={memoryApproved} onChange={(e) => setMemoryApproved(e.target.checked)} className="mt-0.5" />
                <span>I explicitly approve saving this memory on this browser.</span>
              </label>
              <button onClick={handleSaveMemory} disabled={!memoryText.trim() || !memoryApproved} className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs">Save Memory</button>
              <button onClick={handleClearMemories} disabled={memories.length === 0} className="ml-2 px-3 py-1.5 rounded bg-rose-950 hover:bg-rose-900 disabled:opacity-40 border border-rose-800 text-rose-200 text-xs">Clear Memories</button>
            </div>
          </div>
          <div className="text-[11px] text-zinc-400">Knowledge notes: {knowledgeNotes.length} · Saved memories: {memories.length}</div>
          {knowledgeNotes.length > 0 && (
            <div className="space-y-1">
              {knowledgeNotes.slice(0, 5).map((note) => <div key={note.id} className="text-[11px] text-zinc-300"><span className="text-sky-300">{note.title}:</span> {note.content}</div>)}
            </div>
          )}
          {memories.length > 0 && (
            <div className="space-y-1">
              {memories.slice(-5).reverse().map((memory) => <div key={memory.id} className="text-[11px] text-zinc-300">• {memory.text}</div>)}
            </div>
          )}
          {knowledgeStatus && <p role="status" className="text-[11px] text-emerald-300">{knowledgeStatus}</p>}
        </section>
      )}

      {/* Paste Log Expandable Box */}
      {pasteBoxOpen && (
        <div className="p-3 bg-[#0a0f17] border-b border-zinc-800 flex flex-col gap-2 transition-all">
          <div className="flex items-center justify-between text-xs text-zinc-300 font-medium">
            <span className="flex items-center gap-1 text-emerald-400">
              <Terminal className="w-3.5 h-3.5" />
              {language === 'bn'
                ? 'টার্মিনাল আউটপুট / এরর লগ এখানে পেস্ট করুন:'
                : language === 'banglish'
                ? 'Terminal output ba error log eikhane paste koro:'
                : 'Paste Terminal Output or Tool Error to detect next command:'}
            </span>
            <button
              onClick={() => setPasteBoxOpen(false)}
              className="text-zinc-500 hover:text-zinc-300 text-xs"
            >
              Close
            </button>
          </div>
          <textarea
            value={pastedLog}
            onChange={(e) => setPastedLog(e.target.value)}
            placeholder="e.g. bash: nmap: command not found&#10;or: Permission denied: /data/data/com.termux/files...&#10;or: LOS alarm active on ONU-01..."
            rows={3}
            className="w-full bg-[#111722] border border-zinc-700 rounded p-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500 placeholder-zinc-500"
          />
          <div className="flex justify-end">
            <button
              onClick={handlePasteLogSubmit}
              disabled={!pastedLog.trim()}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'ডিটেক্ট করে পরবর্তী কমান্ড দিন' : language === 'banglish' ? 'Detect Next Command' : 'Detect Next Command'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Message List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[78%] rounded-xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : msg.isErrorAnalysis
                    ? 'bg-[#181f2c] border border-amber-600/40 text-zinc-100 rounded-bl-none'
                    : 'bg-[#151c27] border border-zinc-800 text-zinc-200 rounded-bl-none'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-zinc-700/50 text-[10px] text-zinc-400 font-mono">
                    <span className="flex items-center gap-1">
                      {msg.isErrorAnalysis ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span className="text-amber-400 font-bold">Auto Error Detection</span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-3 h-3 text-emerald-400" />
                          <span>AI Assistant</span>
                        </>
                      )}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>
                )}

                {/* Message Text with preserved linebreaks */}
                <div className="whitespace-pre-wrap font-sans text-xs">
                  {msg.text}
                </div>

                {/* Next Command Recommendation Card */}
                {msg.suggestedCommand && (
                  <div className="mt-3 p-2.5 rounded-lg bg-[#0b1017] border border-emerald-500/30 text-xs">
                    <div className="flex items-center justify-between mb-1.5 text-[11px] font-mono text-emerald-400 font-semibold">
                      <span>&gt; Recommended Next Command:</span>
                      <span className="text-[10px] text-zinc-400">1-Click Execution</span>
                    </div>

                    <div className="font-mono text-emerald-300 bg-[#070b10] px-2.5 py-1.5 rounded border border-zinc-800 flex items-center justify-between overflow-x-auto">
                      <code>{msg.suggestedCommand}</code>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => onRunInTerminal(msg.suggestedCommand!)}
                        className="flex-1 py-1 px-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Play className="w-3 h-3" />
                        <span>Run in Shell</span>
                      </button>

                      <button
                        onClick={() => handleCopy(msg.suggestedCommand!, msg.id)}
                        className="py-1 px-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors border border-zinc-700"
                      >
                        {copiedId === msg.id ? (
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
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={chatBottomRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="px-3 py-2 bg-[#101722] border-t border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
        <span className="text-[11px] text-zinc-500 font-mono whitespace-nowrap flex items-center gap-1">
          <HelpCircle className="w-3 h-3" />
          {language === 'bn' ? 'সরাসরি প্রশ্ন:' : language === 'banglish' ? 'Ask AI:' : 'Quick Prompts:'}
        </span>
        {promptChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(chip)}
            className="px-2.5 py-1 rounded-full bg-[#182333] hover:bg-emerald-950/80 hover:text-emerald-300 text-zinc-300 text-[11px] whitespace-nowrap border border-zinc-700/60 transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 bg-[#131b26] border-t border-zinc-800 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            language === 'bn'
              ? 'এখানে লিখুন (যেমন: কি টুল লাগবে, পরবর্তী কমান্ড কি হবে)...'
              : language === 'banglish'
              ? 'Ki doroner tools lagbe bolte paro ba error paste koro...'
              : 'Ask AI: what tools do I need, or paste command outputs for next step...'
          }
          className="flex-1 bg-[#0b1017] border border-zinc-700 rounded-lg px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />

        <button
          onClick={handleSend}
          disabled={!inputText.trim()}
          className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
    </div>
  );
};
