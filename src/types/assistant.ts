export type SupportedLanguage = 'en' | 'bn' | 'banglish';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
  language?: SupportedLanguage;
  suggestedCommand?: string;
  toolResultRef?: string;
  isErrorAnalysis?: boolean;
}

export type ToolCategory = 'network' | 'website' | 'social' | 'security' | 'termux';

export interface ToolItem {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  descriptionBn?: string;
  descriptionBanglish?: string;
  command: string;
  githubUrl?: string;
  isCustom?: boolean;
  status?: 'idle' | 'running' | 'success' | 'failed';
  lastRunOutput?: string;
  isTrue?: boolean; // Auto-detect True/False status
}

export interface AutoDetectResult {
  toolId: string;
  name: string;
  category: ToolCategory;
  isTrue?: boolean; // true = pass, false = alert/failure, undefined = not tested/unknown
  statusText: string;
  details: string;
  recommendedCommand?: string;
  latencyMs?: number;
}

export interface WebRTCLeakResult {
  localIps: string[];
  publicIps: string[];
  hasLeak: boolean;
  status: 'clean' | 'leaked' | 'unknown';
}

export interface AuditProblemItem {
  id: string;
  category: 'webrtc_leak' | 'flash_risk' | 'geolocation' | 'camera_mic' | 'termux_storage' | 'dns_leak' | 'open_ports';
  severity: 'critical' | 'high' | 'medium' | 'info';
  title: string;
  titleBn: string;
  titleBanglish: string;
  problemDetail: string;
  problemDetailBn: string;
  problemDetailBanglish: string;
  solutionSteps: string[];
  solutionStepsBn: string[];
  solutionStepsBanglish: string[];
  suggestedCommand?: string;
  actionLabel?: string;
}

export interface DeviceHygieneAudit {
  score: number; // 0 - 100
  timestamp: string;
  webrtc: WebRTCLeakResult;
  flashStatus: 'disabled' | 'present' | 'not_supported';
  cookiesEnabled: boolean;
  screenResolution: string;
  platform: string;
  userAgent: string;
  hardwareConcurrency: number;
  permissions: {
    camera: string;
    microphone: string;
    geolocation: string;
    notifications: string;
  };
  risksDetected: string[];
  problems: AuditProblemItem[];
  recommendations: {
    en: string[];
    bn: string[];
    banglish: string[];
  };
}

export interface PrivacySettings {
  redactIps: boolean;
  redactMacs: boolean;
  redactTokens: boolean;
  redactUsernames: boolean;
  enabled: boolean;
}
