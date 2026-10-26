import React, { useState } from 'react';
import {
  Download,
  Upload,
  ShieldCheck,
  ShieldAlert,
  Check,
  X,
  FileCode,
  Terminal,
  Database,
} from 'lucide-react';
import { PrivacySettings, ToolItem } from '../types/assistant';
import { sanitizePrivacyData, sanitizeObject } from '../services/privacyGuard';
import { NetworkSnapshot } from '../types/network';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  privacy: PrivacySettings;
  setPrivacy: React.Dispatch<React.SetStateAction<PrivacySettings>>;
  tools: ToolItem[];
  snapshot: NetworkSnapshot;
  terminalHistory: string;
  onImportTools: (tools: ToolItem[]) => void;
  onImportSnapshot: (snapshot: NetworkSnapshot) => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  privacy,
  setPrivacy,
  tools,
  snapshot,
  terminalHistory,
  onImportTools,
  onImportSnapshot,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  // Sample data to show real-time preview of privacy masking
  const previewSample = `[Sample Diagnostics Log]
Target IP: 192.168.1.105 (Gateway: 103.22.180.44)
MAC Address: 44:D9:E7:2B:99:A1
User: anontomollik0541@gmail.com
Authorization: Bearer sk-ant-api03-abcdef1234567890`;

  const { sanitized: previewSanitized, stats: previewStats } = sanitizePrivacyData(previewSample, privacy);

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const finalContent = privacy.enabled ? sanitizePrivacyData(content, privacy).sanitized : content;
    const blob = new Blob([finalContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportTools = () => {
    const data = privacy.enabled ? sanitizeObject(tools, privacy) : tools;
    downloadFile('termux-tools-config.json', JSON.stringify(data, null, 2), 'application/json');
  };

  const handleExportSnapshot = () => {
    const data = privacy.enabled ? sanitizeObject(snapshot, privacy) : snapshot;
    downloadFile('noc-network-snapshot.json', JSON.stringify(data, null, 2), 'application/json');
  };

  const handleExportTerminalLog = () => {
    downloadFile('termux-session.log', terminalHistory || 'No command session recorded yet.', 'text/plain');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setImportStatus('Import rejected: file exceeds the 2 MiB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setImportStatus('Import failed: unable to read the selected file.');
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') {
          setImportStatus('Import failed: file content is not text.');
          return;
        }
        const parsed: unknown = JSON.parse(text);
        const isRecord = (v: unknown): v is Record<string, unknown> =>
          typeof v === 'object' && v !== null && !Array.isArray(v);
        const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
        const isTools = (v: unknown): v is ToolItem[] =>
          Array.isArray(v) && v.length > 0 && v.length <= 500 && v.every((item) =>
            isRecord(item) && typeof item.id === 'string' && item.id.length > 0 &&
            typeof item.name === 'string' && item.name.trim().length > 0 &&
            ['network', 'website', 'social', 'security', 'termux'].includes(String(item.category)) &&
            typeof item.description === 'string' && typeof item.command === 'string' &&
            item.command.trim().length > 0 &&
            (item.githubUrl === undefined || (typeof item.githubUrl === 'string' &&
              (item.githubUrl === '' || /^https:\/\//i.test(item.githubUrl)))) &&
            (item.isTrue === undefined || typeof item.isTrue === 'boolean'));
        const isSnapshot = (v: unknown): v is NetworkSnapshot => {
          if (!isRecord(v) || typeof v.timestamp !== 'string' || !Number.isFinite(Date.parse(v.timestamp)) ||
              !Array.isArray(v.optical) || !Array.isArray(v.wifi) ||
              !Array.isArray(v.routers) || !Array.isArray(v.olt)) return false;
          return v.optical.every((x) => isRecord(x) && typeof x.onu_id === 'string' &&
            typeof x.port === 'string' && isNum(x.rx_dbm) && isNum(x.tx_dbm) &&
            typeof x.los_alarm === 'boolean' && isNum(x.crc_errors) && isNum(x.drop_count)) &&
            v.wifi.every((x) => isRecord(x) && typeof x.ssid === 'string' && isNum(x.channel) &&
              isNum(x.rssi_dbm) && isNum(x.noise_dbm) && isNum(x.snr_dbm) && isNum(x.clients) &&
              isNum(x.channel_utilization) && isNum(x.packet_loss_pct)) &&
            v.routers.every((x) => isRecord(x) && typeof x.device_name === 'string' &&
              isNum(x.cpu_percent) && isNum(x.memory_used_pct) && isNum(x.uptime_hours) &&
              isNum(x.interface_errors) && isNum(x.pppoe_flaps) && isNum(x.dhcp_failures) && isNum(x.route_flaps)) &&
            v.olt.every((x) => isRecord(x) && typeof x.olt_name === 'string' && typeof x.port === 'string' &&
              (x.port_state === 'up' || x.port_state === 'down') && isNum(x.onu_count) &&
              Array.isArray(x.alarms) && x.alarms.every((alarm) => typeof alarm === 'string') &&
              (x.power_dbm === undefined || isNum(x.power_dbm)));
        };
        if (isTools(parsed)) {
          onImportTools(parsed);
          setImportStatus(`Validated and imported ${parsed.length} tools.`);
        } else if (isSnapshot(parsed)) {
          onImportSnapshot(parsed);
          setImportStatus('Validated and loaded snapshot. Imported telemetry is not verified live data.');
        } else {
          setImportStatus('Import rejected: JSON does not match a valid tools list or network snapshot schema.');
        }
      } catch {
        setImportStatus('Import failed: invalid JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#111824] border border-zinc-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden text-xs">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#162030] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Download className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Safe Export & Import Hub (Privacy Guard)
              </h3>
              <p className="text-[11px] text-zinc-400">
                Safely export tools, snapshots, and logs with automatic redaction of personal details.
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

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Privacy Guard Controls */}
          <div className="bg-[#0b1017] border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {privacy.enabled ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">
                    My Details Safe Guard (Redaction Engine)
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Automatically redacts sensitive IP addresses, MACs, passwords, and tokens before export.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPrivacy((p) => ({ ...p, enabled: !p.enabled }))}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                  privacy.enabled
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-600'
                }`}
              >
                {privacy.enabled ? 'ACTIVE (SAFE)' : 'DISABLED'}
              </button>
            </div>

            {/* Fine-grained Toggles */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80">
              <label className="flex items-center space-x-2 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacy.redactIps}
                  disabled={!privacy.enabled}
                  onChange={(e) => setPrivacy((p) => ({ ...p, redactIps: e.target.checked }))}
                  className="rounded border-zinc-700 text-emerald-600 focus:ring-0"
                />
                <span>Redact Real IPs</span>
              </label>

              <label className="flex items-center space-x-2 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacy.redactMacs}
                  disabled={!privacy.enabled}
                  onChange={(e) => setPrivacy((p) => ({ ...p, redactMacs: e.target.checked }))}
                  className="rounded border-zinc-700 text-emerald-600 focus:ring-0"
                />
                <span>Redact MAC Addresses</span>
              </label>

              <label className="flex items-center space-x-2 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacy.redactTokens}
                  disabled={!privacy.enabled}
                  onChange={(e) => setPrivacy((p) => ({ ...p, redactTokens: e.target.checked }))}
                  className="rounded border-zinc-700 text-emerald-600 focus:ring-0"
                />
                <span>Redact Passwords & Tokens</span>
              </label>

              <label className="flex items-center space-x-2 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacy.redactUsernames}
                  disabled={!privacy.enabled}
                  onChange={(e) => setPrivacy((p) => ({ ...p, redactUsernames: e.target.checked }))}
                  className="rounded border-zinc-700 text-emerald-600 focus:ring-0"
                />
                <span>Mask Personal Email/User</span>
              </label>
            </div>

            {/* Real-time Sanitization Preview */}
            <div className="mt-3 pt-3 border-t border-zinc-800/80">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                <span>Sanitization Preview:</span>
                <span className="text-emerald-400 font-mono">
                  {previewStats.totalRedacted} items protected
                </span>
              </div>
              <pre className="p-2.5 rounded bg-[#070b10] border border-zinc-800 text-[10px] font-mono text-zinc-300 overflow-x-auto">
                {previewSanitized}
              </pre>
            </div>
          </div>

          {/* Section 2: Export Options */}
          <div>
            <h4 className="text-xs font-bold text-zinc-200 mb-2.5 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-400" />
              Export Application Data
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={handleExportTools}
                className="p-3 rounded-xl bg-[#0b1017] hover:bg-[#151f2e] border border-zinc-800 text-left transition-colors flex flex-col justify-between"
              >
                <FileCode className="w-5 h-5 text-cyan-400 mb-2" />
                <div>
                  <div className="font-semibold text-zinc-200">Tool Catalog</div>
                  <div className="text-[10px] text-zinc-500">tools-config.json</div>
                </div>
              </button>

              <button
                onClick={handleExportSnapshot}
                className="p-3 rounded-xl bg-[#0b1017] hover:bg-[#151f2e] border border-zinc-800 text-left transition-colors flex flex-col justify-between"
              >
                <Database className="w-5 h-5 text-emerald-400 mb-2" />
                <div>
                  <div className="font-semibold text-zinc-200">Network Telemetry</div>
                  <div className="text-[10px] text-zinc-500">snapshot.json</div>
                </div>
              </button>

              <button
                onClick={handleExportTerminalLog}
                className="p-3 rounded-xl bg-[#0b1017] hover:bg-[#151f2e] border border-zinc-800 text-left transition-colors flex flex-col justify-between"
              >
                <Terminal className="w-5 h-5 text-amber-400 mb-2" />
                <div>
                  <div className="font-semibold text-zinc-200">Terminal Log</div>
                  <div className="text-[10px] text-zinc-500">session.log (TXT)</div>
                </div>
              </button>
            </div>
          </div>

          {/* Section 3: Import Any JSON File */}
          <div className="bg-[#0b1017] border border-zinc-800 rounded-xl p-4">
            <h4 className="text-xs font-bold text-zinc-200 mb-2 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-purple-400" />
              Import Any Tool or Snapshot File
            </h4>
            <p className="text-[11px] text-zinc-400 mb-3">
              Upload custom tools collections or network snapshots (.json) to merge them directly into the app.
            </p>

            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-700 hover:border-emerald-500 rounded-xl cursor-pointer bg-[#0e1520] transition-colors">
              <Upload className="w-6 h-6 text-zinc-400 mb-1" />
              <span className="text-xs text-zinc-300 font-medium">Click to browse or drop file here</span>
              <span className="text-[10px] text-zinc-500 mt-0.5">Supports .json, .txt</span>
              <input type="file" accept=".json,.txt" onChange={handleFileUpload} className="hidden" />
            </label>

            {importStatus && (
              <div className="mt-2.5 p-2 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{importStatus}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
