/**
 * Network, Website, and Social Footprint Analysis Service
 */

export interface DnsRecord {
  name: string;
  type: number;
  typeName: string;
  TTL: number;
  data: string;
}

export interface DnsResult {
  domain: string;
  status: number;
  records: DnsRecord[];
  rawAnswer?: unknown;
}

const DNS_TYPE_MAP: Record<number, string> = {
  1: 'A',
  28: 'AAAA',
  15: 'MX',
  16: 'TXT',
  5: 'CNAME',
  2: 'NS',
  6: 'SOA',
};

/**
 * Perform real DNS-over-HTTPS lookup via Cloudflare DoH API
 */
export async function queryDnsDoH(domain: string, type: string = 'A'): Promise<DnsResult> {
  const cleanDomain = domain.replace(/^https?:\/\//i, '').split('/')[0].trim();
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(cleanDomain)}&type=${encodeURIComponent(type)}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/dns-json',
      },
    });

    if (!res.ok) {
      throw new Error(`DNS DoH HTTP ${res.status}`);
    }

    const data = await res.json();
    const records: DnsRecord[] = (data.Answer || []).map((ans: { name: string; type: number; TTL: number; data: string }) => ({
      name: ans.name,
      type: ans.type,
      typeName: DNS_TYPE_MAP[ans.type] || `TYPE_${ans.type}`,
      TTL: ans.TTL,
      data: ans.data,
    }));

    return {
      domain: cleanDomain,
      status: data.Status,
      records,
      rawAnswer: data,
    };
  } catch {
    // Never fabricate DNS answers when the live query fails.
    return { domain: cleanDomain, status: 0, records: [] };
  }
}

/**
 * Real HTTP latency measurement (Ping)
 */
export async function testHttpPing(targetUrl: string): Promise<{ latencyMs: number; status: 'online' | 'slow' | 'unreachable'; target: string }> {
  let url = targetUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  const start = performance.now();
  try {
    // We send request with no-cors or HEAD to measure round-trip time safely
    await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
    });
    const latencyMs = Math.round(performance.now() - start);
    return {
      latencyMs,
      status: latencyMs > 250 ? 'slow' : 'online',
      target: url,
    };
  } catch {
    // A failed probe is not proof that the host is online.
    return { latencyMs: Math.round(performance.now() - start), status: 'unreachable', target: url };
  }
}

export interface SecurityHeaderCheck {
  header: string;
  present: boolean;
  severity: 'critical' | 'warning' | 'info';
  recommendation: string;
}

export function auditSecurityHeadersSimulation(url: string): SecurityHeaderCheck[] {
  const isHttps = url.toLowerCase().startsWith('https://');

  return [
    {
      header: 'Strict-Transport-Security (HSTS)',
      present: isHttps,
      severity: isHttps ? 'info' : 'critical',
      recommendation: isHttps
        ? 'Enforces TLS encryption on future visits.'
        : 'Missing HSTS: prone to SSL stripping / man-in-the-middle downgrade.',
    },
    {
      header: 'Content-Security-Policy (CSP)',
      present: true,
      severity: 'info',
      recommendation: 'Restricts script injection and unauthorized resource loading.',
    },
    {
      header: 'X-Frame-Options',
      present: true,
      severity: 'warning',
      recommendation: 'Protects against clickjacking attacks inside malicious iframes.',
    },
    {
      header: 'X-Content-Type-Options: nosniff',
      present: true,
      severity: 'info',
      recommendation: 'Prevents MIME-type sniffing of uploaded media.',
    },
    {
      header: 'Referrer-Policy: strict-origin-when-cross-origin',
      present: true,
      severity: 'info',
      recommendation: 'Stops leak of sensitive URL tokens to external third parties.',
    },
  ];
}

export interface SocialProfileCheck {
  platform: string;
  username: string;
  url: string;
  iconName: string;
  status: 'valid_format' | 'invalid_format';
  category: 'developer' | 'social' | 'chat';
}

/**
 * Builds OSINT links and validates username handles across major social networks
 */
export function buildSocialProfiles(rawUsername: string): SocialProfileCheck[] {
  const username = rawUsername.replace(/^@/, '').trim();
  const isValid = /^[a-zA-Z0-9_\-\.]{1,39}$/.test(username);

  return [
    {
      platform: 'GitHub',
      username,
      url: `https://github.com/${username}`,
      iconName: 'Github',
      status: isValid ? 'valid_format' : 'invalid_format',
      category: 'developer',
    },
    {
      platform: 'Twitter / X',
      username,
      url: `https://x.com/${username}`,
      iconName: 'Twitter',
      status: isValid ? 'valid_format' : 'invalid_format',
      category: 'social',
    },
    {
      platform: 'Telegram',
      username,
      url: `https://t.me/${username}`,
      iconName: 'Send',
      status: isValid ? 'valid_format' : 'invalid_format',
      category: 'chat',
    },
    {
      platform: 'Reddit',
      username,
      url: `https://www.reddit.com/user/${username}`,
      iconName: 'MessageSquare',
      status: isValid ? 'valid_format' : 'invalid_format',
      category: 'social',
    },
    {
      platform: 'LinkedIn',
      username,
      url: `https://www.linkedin.com/in/${username}`,
      iconName: 'Linkedin',
      status: isValid ? 'valid_format' : 'invalid_format',
      category: 'social',
    },
    {
      platform: 'YouTube',
      username,
      url: `https://www.youtube.com/@${username}`,
      iconName: 'Youtube',
      status: isValid ? 'valid_format' : 'invalid_format',
      category: 'social',
    },
  ];
}

/**
 * Subnet calculator helper
 */
export function calculateSubnet(cidrStr: string): {
  networkAddress: string;
  broadcastAddress: string;
  usableHosts: number;
  netmask: string;
} {
  const parts = cidrStr.trim().split('/');
  const ip = parts[0] || '192.168.1.0';
  const prefix = parseInt(parts[1] || '24', 10);

  const usableHosts = prefix >= 31 ? 0 : Math.pow(2, 32 - prefix) - 2;

  // Approximate netmask
  let netmask = '255.255.255.0';
  if (prefix === 16) netmask = '255.255.0.0';
  if (prefix === 8) netmask = '255.0.0.0';
  if (prefix === 28) netmask = '255.255.255.240';
  if (prefix === 29) netmask = '255.255.255.248';
  if (prefix === 30) netmask = '255.255.255.252';

  const ipOctets = ip.split('.').map(Number);
  const network = `${ipOctets[0] || 192}.${ipOctets[1] || 168}.${ipOctets[2] || 1}.0`;
  const broadcast = `${ipOctets[0] || 192}.${ipOctets[1] || 168}.${ipOctets[2] || 1}.255`;

  return {
    networkAddress: network,
    broadcastAddress: broadcast,
    usableHosts,
    netmask,
  };
}
