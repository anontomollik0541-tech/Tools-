import React, { useState } from 'react';
import {
  Globe,
  Wifi,
  Share2,
  Shield,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  Search,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { ToolItem, ToolCategory, SupportedLanguage } from '../types/assistant';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

interface ToolsDashboardProps {
  tools: ToolItem[];
  onRunToolInTerminal: (command: string) => void;
  onAddCustomTool: (tool: Omit<ToolItem, 'id'>) => void;
  onRemoveTool: (id: string) => void;
  onRunAutoDetect: () => void;
  isAutoDetectRunning: boolean;
  language: SupportedLanguage;
}

export const ToolsDashboard: React.FC<ToolsDashboardProps> = ({
  tools,
  onRunToolInTerminal,
  onAddCustomTool,
  onRemoveTool,
  onRunAutoDetect,
  isAutoDetectRunning,
  language,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New tool form state
  const [newToolName, setNewToolName] = useState('');
  const [newToolCmd, setNewToolCmd] = useState('');
  const [newToolGithub, setNewToolGithub] = useState('');
  const [newToolCategory, setNewToolCategory] = useState<ToolCategory>('website');
  const [newToolDesc, setNewToolDesc] = useState('');

  const filteredTools = tools.filter((tool) => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory || (selectedCategory === 'custom' && tool.isCustom);
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToolName.trim() || !newToolCmd.trim()) return;

    onAddCustomTool({
      name: newToolName.trim(),
      command: newToolCmd.trim(),
      githubUrl: newToolGithub.trim() || undefined,
      category: newToolCategory,
      description: newToolDesc.trim() || 'Custom user utility added via manual collector.',
      isCustom: true,
      isTrue: undefined,
    });

    setNewToolName('');
    setNewToolCmd('');
    setNewToolGithub('');
    setNewToolDesc('');
    setShowAddModal(false);
  };

  const getCategoryIcon = (cat: ToolCategory) => {
    switch (cat) {
      case 'website':
        return <Globe className="w-4 h-4 text-cyan-400" />;
      case 'network':
        return <Wifi className="w-4 h-4 text-emerald-400" />;
      case 'social':
        return <Share2 className="w-4 h-4 text-purple-400" />;
      case 'security':
        return <Shield className="w-4 h-4 text-amber-400" />;
      default:
        return <Globe className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] min-h-[500px] bg-[#0d131d] rounded-xl border border-zinc-800 shadow-xl overflow-hidden">
      {/* Top Controls Toolbar */}
      <div className="p-4 bg-[#131b26] border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'all', label: language === 'bn' ? 'সব টুলস' : 'All Tools' },
            { id: 'website', label: language === 'bn' ? 'ওয়েবসাইট' : 'Website' },
            { id: 'network', label: language === 'bn' ? 'নেটওয়ার্ক' : 'Network' },
            { id: 'social', label: language === 'bn' ? 'সোশ্যাল OSINT' : 'Social' },
            { id: 'security', label: language === 'bn' ? 'সিকিউরিটি' : 'Security' },
            { id: 'custom', label: language === 'bn' ? 'কাস্টম' : 'Custom Tools' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'bg-[#182333] text-zinc-400 hover:text-zinc-200 border border-zinc-700/50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Action Buttons: Auto-Run & Add Tool */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onRunAutoDetect}
            disabled={isAutoDetectRunning}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAutoDetectRunning ? 'animate-spin' : ''}`} />
            <span>
              {isAutoDetectRunning
                ? 'Running Auto-Check...'
                : language === 'bn'
                ? 'সবগুলো অটো রান (True/False)'
                : language === 'banglish'
                ? 'Auto Run (True/False)'
                : 'Auto Run All Tools'}
            </span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#1a2537] hover:bg-[#223147] text-zinc-200 border border-zinc-700 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'bn' ? 'কাস্টম টুল যুক্ত করুন' : language === 'banglish' ? 'Add Tool' : 'Add Custom Tool'}</span>
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="px-4 py-2.5 bg-[#0e1622] border-b border-zinc-800 flex items-center gap-2">
        <Search className="w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            language === 'bn'
              ? 'টুল নাম, কমান্ড বা বিবরণ দিয়ে খুঁজুন...'
              : language === 'banglish'
              ? 'Tool name ba command diye search koro...'
              : 'Search tools by name, command, or category...'
          }
          className="flex-1 bg-transparent text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
        />
        <span className="text-[11px] text-zinc-500 font-mono">
          {filteredTools.length} tools available
        </span>
      </div>

      {/* Tools Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredTools.map((tool) => {
            const description =
              language === 'bn'
                ? tool.descriptionBn || tool.description
                : language === 'banglish'
                ? tool.descriptionBanglish || tool.description
                : tool.description;

            return (
              <div
                key={tool.id}
                className="bg-[#121924] border border-zinc-800/90 rounded-xl p-3.5 flex flex-col justify-between hover:border-zinc-700 transition-all shadow-sm"
              >
                <div>
                  {/* Card Header: Icon, Name, Category, True/False badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-[#1a2433] border border-zinc-700/60">
                        {getCategoryIcon(tool.category)}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                          {tool.name}
                          {tool.isCustom && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                              Custom
                            </span>
                          )}
                        </h3>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                          {tool.category}
                        </span>
                      </div>
                    </div>

                    {/* True / False Status indicator */}
                    <div
                      className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        tool.isTrue === true
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                          : 'bg-red-950/80 text-red-400 border border-red-800/60'
                      }`}
                    >
                      {tool.isTrue === true ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>PASS</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>{tool.isTrue === false ? 'ALERT' : 'NOT TESTED'}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-400 mb-3 line-clamp-2 leading-relaxed">
                    {description}
                  </p>

                  {/* Command Line Preview */}
                  <div className="bg-[#090d14] p-2 rounded-lg border border-zinc-800/80 mb-3 font-mono text-[11px] text-emerald-300 flex items-center justify-between overflow-x-auto">
                    <code>{tool.command}</code>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                  <div className="flex items-center space-x-2">
                    {tool.githubUrl && (
                      <a
                        href={tool.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="View GitHub Repository"
                        className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors"
                      >
                        <GithubIcon className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {tool.isCustom && (
                      <button
                        onClick={() => onRemoveTool(tool.id)}
                        title="Delete custom tool"
                        className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-zinc-800 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => onRunToolInTerminal(tool.command)}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1 transition-colors shadow-xs"
                  >
                    <Play className="w-3 h-3" />
                    <span>Run in Shell</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Custom Tool Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111823] border border-zinc-800 rounded-xl p-5 max-w-md w-full shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              {language === 'bn' ? 'নতুন কাস্টম টুল যুক্ত করুন' : language === 'banglish' ? 'Add Custom Tool' : 'Add Custom Tool'}
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Add any GitHub tool, Linux utility or bash command to your dashboard.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Tool Name</label>
                <input
                  type="text"
                  required
                  value={newToolName}
                  onChange={(e) => setNewToolName(e.target.value)}
                  placeholder="e.g. Subdomain Finder"
                  className="w-full bg-[#0a0f16] border border-zinc-700 rounded p-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Execution Command</label>
                <input
                  type="text"
                  required
                  value={newToolCmd}
                  onChange={(e) => setNewToolCmd(e.target.value)}
                  placeholder="e.g. subfinder -d example.com"
                  className="w-full bg-[#0a0f16] border border-zinc-700 rounded p-2 text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Category</label>
                <select
                  value={newToolCategory}
                  onChange={(e) => setNewToolCategory(e.target.value as ToolCategory)}
                  className="w-full bg-[#0a0f16] border border-zinc-700 rounded p-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="website">Website</option>
                  <option value="network">Network</option>
                  <option value="social">Social</option>
                  <option value="security">Security</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">GitHub Repository URL (Optional)</label>
                <input
                  type="url"
                  value={newToolGithub}
                  onChange={(e) => setNewToolGithub(e.target.value)}
                  placeholder="https://github.com/user/repo"
                  className="w-full bg-[#0a0f16] border border-zinc-700 rounded p-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newToolDesc}
                  onChange={(e) => setNewToolDesc(e.target.value)}
                  placeholder="What does this tool do?"
                  className="w-full bg-[#0a0f16] border border-zinc-700 rounded p-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
                >
                  Add Tool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
