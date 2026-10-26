import { ToolItem } from '../types/assistant';

export const DEFAULT_TOOLS: ToolItem[] = [
  // AI NOC Diagnostic Tool
  {
    id: 'tool-ai-noc',
    name: 'AI NOC Diagnostic (বাংলা অটোমেশন)',
    category: 'network',
    description: 'Runs automated diagnostics across OLT optical PON, WiFi RF, and latency, returning structured Bangla report.',
    descriptionBn: 'সিস্টেমের সমস্ত টুলস অটো-রান করে ONU ফাইবার পাওয়ার, ওয়াইফাই সিগন্যাল ও লেটেন্সি পরীক্ষা করে বাংলায় ফাইনাল রেজাল্ট দেয়।',
    descriptionBanglish: 'OLT ONU fibre power, WiFi signal ebong ping drop test kore Bangla JSON format e result dey.',
    command: 'python3 ai_noc_diagnostic.py 10.10.20.5 vsol 1 12',
    githubUrl: 'https://github.com/termux/termux-packages',
  },
  // Network Tools
  {
    id: 'tool-ping',
    name: 'Live Ping & RTT Probe',
    category: 'network',
    description: 'Measures round-trip latency, packet stability, and jitter across targets.',
    descriptionBn: 'টার্গেট সার্ভারে রাউন্ড-ট্রিপ লেটেন্সি, প্যাকেট ক্ষতি এবং জিটার পরিমাপ করে।',
    descriptionBanglish: 'Server er ping latency, packet loss ebong jitter check kore.',
    command: 'ping 1.1.1.1',
    githubUrl: 'https://github.com/iputils/iputils',
  },
  {
    id: 'tool-dns',
    name: 'Cloudflare / Google DoH DNS Resolver',
    category: 'website',
    description: 'Inspects A, AAAA, MX, and TXT DNS records securely via DNS-over-HTTPS.',
    descriptionBn: 'DNS-over-HTTPS এর মাধ্যমে A, AAAA, MX এবং TXT রেকর্ড নিরাপদে বিশ্লেষণ করে।',
    descriptionBanglish: 'Cloudflare DoH diye kono domain er A, MX, TXT record dekhe.',
    command: 'dns cloudflare.com',
    githubUrl: 'https://github.com/NLnetLabs/ldns',
  },
  {
    id: 'tool-headers',
    name: 'HTTP Security Headers Auditor',
    category: 'website',
    description: 'Analyzes HSTS, CSP, X-Frame-Options, CORS, and server software leakage.',
    descriptionBn: 'ওয়েবসাইটের HSTS, CSP, X-Frame-Options এবং হেডার নিরাপত্তা যাচাই করে।',
    descriptionBanglish: 'Website er HSTS, CSP, CORS ebong security headers test kore.',
    command: 'curl -I https://github.com',
    githubUrl: 'https://github.com/curl/curl',
  },
  {
    id: 'tool-social',
    name: 'Social OSINT Footprint Scanner',
    category: 'social',
    description: 'Validates username existence and profile links across GitHub, X, Telegram, Reddit.',
    descriptionBn: 'গিটহাব, এক্স, টেলিগ্রাম এবং রেডিটে ইউজারনেমের লিংক ও ফরম্যাট যাচাই করে।',
    descriptionBanglish: 'GitHub, X, Telegram, Reddit e username er profile link check kore.',
    command: 'social check @anondev',
    githubUrl: 'https://github.com/sherlock-project/sherlock',
  },
  {
    id: 'tool-webrtc',
    name: 'WebRTC IP Leak Shield Test',
    category: 'security',
    description: 'Probes STUN candidates to verify if real internal/public IPs bypass VPNs.',
    descriptionBn: 'ভিপিএন থাকা সত্ত্বেও ব্রাউজার দিয়ে গোপন আইপি লিক হচ্ছে কিনা তা ধরে ফেলে।',
    descriptionBanglish: 'Browser e WebRTC theke real IP leak hocche kina test kore.',
    command: 'leakcheck',
    githubUrl: 'https://github.com/termux/termux-app',
  },
  {
    id: 'tool-nmap',
    name: 'Nmap Port & Service Scanner',
    category: 'network',
    description: 'Network discovery and service vulnerability assessment utility.',
    descriptionBn: 'নেটওয়ার্ক ডিসকভারি ও উন্মুক্ত পোর্ট ও সার্ভিস নিরীক্ষা টুল।',
    descriptionBanglish: 'Network er open ports ebong active services scan korar tool.',
    command: 'nmap -F 192.168.1.1',
    githubUrl: 'https://github.com/nmap/nmap',
  },
  {
    id: 'tool-whois',
    name: 'WHOIS & Domain Registrar Lookup',
    category: 'website',
    description: 'Retrieves domain creation date, name servers, and registrar security data.',
    descriptionBn: 'ডোমেইনের মেয়াদ, নেমসার্ভার ও রেজিস্ট্রারের নিরাপত্তা তথ্য উদ্ধার করে।',
    descriptionBanglish: 'Domain kobe register hoise, name servers ki shob dekhe.',
    command: 'whois google.com',
    githubUrl: 'https://github.com/rfc1036/whois',
  },
  {
    id: 'tool-malwarescan',
    name: 'Device Hygiene & Extension Auditor',
    category: 'security',
    description: 'Audits permissions, Flash plugins, storage access, and rogue processes.',
    descriptionBn: 'সিস্টেম পারমিশন, ক্ষতিকারক ফ্ল্যাশ প্লাগইন এবং ব্যাকগ্রাউন্ড প্রসেস নিরীক্ষা।',
    descriptionBanglish: 'Device permissions, flash plugin risk ebong background process check.',
    command: 'malwarescan',
    githubUrl: 'https://github.com/clamav/clamav',
  },
  {
    id: 'tool-optical',
    name: 'Optical PON / ONU Telemetry',
    category: 'network',
    description: 'Monitors fiber optical power levels (RX/TX dBm), LOS alarm, and CRC drops.',
    descriptionBn: 'ফাইবার অপটিক্যাল পাওয়ার লেভেল (RX/TX dBm) এবং LOS অ্যালার্ম মনিটর করে।',
    descriptionBanglish: 'Fiber optical power levels (dBm), LOS alarm ebong CRC drop check kore.',
    command: 'optical',
    githubUrl: 'https://github.com/termux/termux-packages',
    isTrue: false, // Default snapshot has fiber anomaly for realistic NOC detection
  },
];

const STORAGE_KEY = 'termux_custom_tools_v1';

export function loadAllTools(): ToolItem[] {
  try {
    const custom = localStorage.getItem(STORAGE_KEY);
    if (!custom) return DEFAULT_TOOLS;
    const parsed = JSON.parse(custom) as ToolItem[];
    // Merge default with custom
    const customMap = new Map(parsed.map(t => [t.id, t]));
    const result: ToolItem[] = [];
    
    // Add defaults
    for (const d of DEFAULT_TOOLS) {
      if (customMap.has(d.id)) {
        result.push(customMap.get(d.id)!);
        customMap.delete(d.id);
      } else {
        result.push(d);
      }
    }
    // Add user custom tools
    result.push(...customMap.values());
    return result;
  } catch {
    return DEFAULT_TOOLS;
  }
}

export function saveTools(tools: ToolItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tools));
  } catch (err) {
    console.error('Failed to save tools to localStorage', err);
  }
}

export function addCustomTool(tool: Omit<ToolItem, 'id'>): ToolItem {
  const newTool: ToolItem = {
    ...tool,
    id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    isCustom: true,
  };
  const current = loadAllTools();
  current.push(newTool);
  saveTools(current);
  return newTool;
}

export function removeTool(id: string): ToolItem[] {
  const current = loadAllTools().filter(t => t.id !== id);
  saveTools(current);
  return current;
}
