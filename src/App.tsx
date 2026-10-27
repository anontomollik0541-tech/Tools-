import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { TerminalView } from './components/TerminalView';
import { AIChatBox } from './components/AIChatBox';
import { ToolsDashboard } from './components/ToolsDashboard';
import { DeviceAuditView } from './components/DeviceAuditView';
import { BrowserConnectModal } from './components/BrowserConnectModal';
import { ExportImportModal } from './components/ExportImportModal';
import { AiNocDiagnosticModal } from './components/AiNocDiagnosticModal';
import { NocDiagnosticsView } from './components/NocDiagnosticsView';

import {
  SupportedLanguage,
  ChatMessage,
  ToolItem,
  PrivacySettings,
} from './types/assistant';
import { NetworkSnapshot, TerminalEntry } from './types/network';
import { DEMO_SNAPSHOT, SCENARIOS } from './data/demoSnapshots';
import { classifyFaults } from './services/faultClassifier';
import { executeCommand, CommandContext } from './services/terminalCommands';
import { loadAllTools, saveTools, addCustomTool, removeTool } from './services/toolsCatalog';
import { analyzeUserInputOrLog, buildAutoDetectReportMessage } from './services/aiEngine';
import { runAutoDetectSuite } from './services/autoDetectEngine';
import { DEFAULT_PRIVACY_SETTINGS } from './services/privacyGuard';
import { buildConversationContext } from './services/conversationKnowledge';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'chat' | 'noc' | 'tools' | 'device'>('terminal');
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [privacy, setPrivacy] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);

  // Modals
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [nocModalOpen, setNocModalOpen] = useState(false);

  // Terminal State
  const [snapshot, setSnapshot] = useState<NetworkSnapshot>(DEMO_SNAPSHOT);
  const [currentScenario, setCurrentScenario] = useState<string>('demo');
  const [terminalEntries, setTerminalEntries] = useState<TerminalEntry[]>([
    {
      id: 'init-1',
      type: 'system',
      content: 'Linux localhost 5.10.101-android-noc-termux aarch64\nTermux NOC Diagnostics Shell initialized. Type "help" or "autorun" to start.',
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: 'init-2',
      type: 'output',
      content: 'Current Snapshot: demo (Standard Mixed Faults). Optical attenuation detected on PON-1 ONU-01.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  // Tools Catalog State
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [isAutoDetectRunning, setIsAutoDetectRunning] = useState(false);

  // AI Chat Messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Load initial tools from catalog
  useEffect(() => {
    setTools(loadAllTools());
  }, []);

  // Update initial welcome message when language changes if chat is empty
  useEffect(() => {
    const welcomeText = {
      en: '👋 Hello! I am your Termux, Network & Security AI Assistant.\n• Ask me what tools you need (e.g. "What tools for website audit?" or "My WiFi is slow").\n• Paste any terminal execution output or error log and I will tell you the exact next command.\n• Run "autorun" anytime to evaluate all tools with True/False telemetry.',
      bn: '👋 আসসালামু আলাইকুম / নমস্কার! আমি আপনার টারম্যাক্স, নেটওয়ার্ক ও সাইবার সিকিউরিটি এআই সহকারী।\n• কি ধরণের টুল লাগবে বা কি করতে হবে আমাকে জিজ্ঞেস করুন (যেমন: "আমার ওয়াইফাই স্লো কি করব?")।\n• টার্মিনালের যেকোনো আউটপুট বা এরর পেস্ট করলে আমি পরবর্তী সঠিক কমান্ড বলে দেব।\n• সব টুল পরীক্ষা করতে উপরে "অটো রান" চাপুন।',
      banglish: '👋 Hello! Ami tomar Termux & Cyber Assistant.\n• Ki doroner tool lagbe ba ki korba amake bolo (e.g. "wifi slow ki korbo?", "website audit").\n• Terminal e run kora tools er output copy kore paste korle ami detect kore next command bole dibo!\n• "Auto Run" diye shob tool ekbare test korte paro.',
    }[language];

    setMessages((prev) => {
      if (prev.length === 0 || prev[0]?.id === 'welcome') {
        return [
          {
            id: 'welcome',
            sender: 'ai',
            text: welcomeText,
            timestamp: new Date().toLocaleTimeString(),
            language,
            suggestedCommand: 'autorun',
          },
        ];
      }
      return prev;
    });
  }, [language]);

  // Execute Command in Terminal
  const handleExecuteCommand = useCallback(
    (cmd: string) => {
      setTerminalEntries((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'input',
          content: cmd,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      const issues = classifyFaults(snapshot);
      const ctx: CommandContext = {
        snapshot,
        setSnapshot,
        language: language === 'bn' ? 'bn' : 'en',
        setLanguage: (lang) => setLanguage(lang === 'bn' ? 'bn' : 'en'),
        clearTerminal: () => setTerminalEntries([]),
        issues,
        triggerAutoDetect: () => handleRunAutoDetect(),
        sendToAI: (content) => handleSendToAI(content),
      };

      const resultEntries = executeCommand(cmd, ctx);
      if (resultEntries.length > 0) {
        setTerminalEntries((prev) => [...prev, ...resultEntries]);
      }
    },
    [snapshot, language]
  );

  // Send message in AI Chat
  const handleSendMessage = (text: string) => {
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString(),
      language,
    };

    setMessages((prev) => [...prev, userMsg]);

    // Analyze query or pasted terminal error log
    setTimeout(() => {
      const analysis = analyzeUserInputOrLog(text, language, tools);
      const context = buildConversationContext(text);
      const contextSections: string[] = [];
      if (context.relevantKnowledge.length > 0) {
        contextSections.push(
          language === 'bn'
            ? '\n\n[আপনার সংরক্ষিত Knowledge — স্থানীয় নোট]\n' + context.relevantKnowledge.map((note) => `• ${note.title}: ${note.content}`).join('\n')
            : language === 'banglish'
              ? '\n\n[Tomar saved Knowledge — local notes]\n' + context.relevantKnowledge.map((note) => `• ${note.title}: ${note.content}`).join('\n')
              : '\n\n[Relevant saved knowledge — local notes]\n' + context.relevantKnowledge.map((note) => `• ${note.title}: ${note.content}`).join('\n')
        );
      }
      if (context.relevantMemories.length > 0) {
        contextSections.push(
          language === 'bn'
            ? '\n\n[আপনার অনুমোদিত প্রাসঙ্গিক Memory]\n' + context.relevantMemories.map((memory) => `• ${memory.text}`).join('\n')
            : language === 'banglish'
              ? '\n\n[Tomar approved relevant memory]\n' + context.relevantMemories.map((memory) => `• ${memory.text}`).join('\n')
              : '\n\n[Relevant approved memory]\n' + context.relevantMemories.map((memory) => `• ${memory.text}`).join('\n')
        );
      }
      const replyText = analysis.text + contextSections.join('');
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString(),
        language,
        suggestedCommand: analysis.suggestedCommand,
        isErrorAnalysis: analysis.isErrorAnalysis,
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 300);
  };

  // Run a suggested command or tool directly in terminal
  const handleRunInTerminal = (command: string) => {
    setActiveTab('terminal');
    handleExecuteCommand(command);
  };

  // Send output to AI from Terminal
  const handleSendToAI = (content: string) => {
    setActiveTab('chat');
    handleSendMessage(content);
  };

  // Auto-Detect runner
  const handleRunAutoDetect = async () => {
    setIsAutoDetectRunning(true);
    try {
      const results = await runAutoDetectSuite(snapshot);

      // Update tools isTrue state
      setTools((prev) =>
        prev.map((t) => {
          const match = results.find((r) => r.toolId === t.id);
          return match ? { ...t, isTrue: match.isTrue } : t;
        })
      );

      // Generate report message and inject into AI Chat
      const reportMsg = buildAutoDetectReportMessage(results, language);
      setMessages((prev) => [...prev, reportMsg]);

      // Add notification to terminal
      setTerminalEntries((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'system',
          content: `[Auto-Detect Complete] Evaluated ${results.length} checks. ${
            results.filter((r) => r.isTrue).length
          } Passed, ${results.filter((r) => r.isTrue === false).length} Alerts, ${results.filter((r) => r.isTrue === undefined).length} Unknown / not tested. Snapshot telemetry may be demo data, not live hardware.`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsAutoDetectRunning(false);
    }
  };

  // Add custom tool
  const handleAddCustomTool = (tool: Omit<ToolItem, 'id'>) => {
    const created = addCustomTool(tool);
    setTools((prev) => [...prev, created]);
  };

  // Remove custom tool
  const handleRemoveTool = (id: string) => {
    const updated = removeTool(id);
    setTools(updated);
  };

  // Select test scenario
  const handleSelectScenario = (key: string) => {
    if (SCENARIOS[key]) {
      setCurrentScenario(key);
      setSnapshot(SCENARIOS[key].snapshot);
      setTerminalEntries((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'success',
          content: `[Scenario Switched] Loaded "${SCENARIOS[key].label}": ${SCENARIOS[key].description}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  // Prepare full terminal history string for export
  const terminalHistoryText = terminalEntries
    .map((e) => (e.content ? `[${e.timestamp || ''}] ${e.type.toUpperCase()}: ${e.content}` : ''))
    .filter(Boolean)
    .join('\n');

  return (
    <div className="min-h-screen bg-[#080c12] text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        privacy={privacy}
        setPrivacy={setPrivacy}
        onOpenConnectModal={() => setConnectModalOpen(true)}
        onOpenExportModal={() => setExportModalOpen(true)}
        onOpenNocModal={() => setNocModalOpen(true)}
        onRunAutoDetect={handleRunAutoDetect}
        isAutoDetectRunning={isAutoDetectRunning}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5">
        {activeTab === 'terminal' && (
          <TerminalView
            entries={terminalEntries}
            onExecuteCommand={handleExecuteCommand}
            onClear={() => setTerminalEntries([])}
            onSendToAI={handleSendToAI}
            currentScenario={currentScenario}
            onSelectScenario={handleSelectScenario}
            language={language === 'bn' ? 'bn' : 'en'}
          />
        )}

        {activeTab === 'chat' && (
          <AIChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            onRunInTerminal={handleRunInTerminal}
            onClearChat={() => setMessages([])}
            language={language}
          />
        )}

        {activeTab === 'noc' && (
          <NocDiagnosticsView
            language={language}
            onRunInTerminal={handleRunInTerminal}
            onSendToAI={handleSendToAI}
          />
        )}

        {activeTab === 'tools' && (
          <ToolsDashboard
            tools={tools}
            onRunToolInTerminal={handleRunInTerminal}
            onAddCustomTool={handleAddCustomTool}
            onRemoveTool={handleRemoveTool}
            onRunAutoDetect={handleRunAutoDetect}
            isAutoDetectRunning={isAutoDetectRunning}
            language={language}
          />
        )}

        {activeTab === 'device' && (
          <DeviceAuditView
            language={language}
            onRunInTerminal={handleRunInTerminal}
            onAskAI={handleSendToAI}
          />
        )}
      </main>

      {/* Google & Tor Connect Modal */}
      <BrowserConnectModal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        onRunInTerminal={handleRunInTerminal}
        language={language}
      />

      {/* Safe Export & Import Modal */}
      <ExportImportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        privacy={privacy}
        setPrivacy={setPrivacy}
        tools={tools}
        snapshot={snapshot}
        terminalHistory={terminalHistoryText}
        onImportTools={(imported) => {
          saveTools(imported);
          setTools(imported);
        }}
        onImportSnapshot={(imported) => {
          setSnapshot(imported);
          setCurrentScenario('custom_imported');
        }}
      />

      {/* AI NOC Diagnostic Modal (ai_noc_diagnostic.py) */}
      <AiNocDiagnosticModal
        isOpen={nocModalOpen}
        onClose={() => setNocModalOpen(false)}
        onRunInTerminal={handleRunInTerminal}
        onSendToAI={handleSendToAI}
        language={language}
      />
    </div>
  );
};
