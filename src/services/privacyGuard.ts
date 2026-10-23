import { PrivacySettings } from '../types/assistant';

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  enabled: true,
  redactIps: true,
  redactMacs: true,
  redactTokens: true,
  redactUsernames: true,
};

// Regex patterns for sensitive telemetry and credential detection
const IPV4_REGEX = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g;
const MAC_REGEX = /\b(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})\b/g;
const TOKEN_REGEX = /(?:bearer\s+[A-Za-z0-9_\-\.]+)|(?:api[_-]?key[:=]\s*['"]?[A-Za-z0-9_\-]{16,}['"]?)|(?:password[:=]\s*['"]?[^'"\s]{4,}['"]?)/gi;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;

export interface RedactionStats {
  redactedIps: number;
  redactedMacs: number;
  redactedTokens: number;
  redactedEmails: number;
  totalRedacted: number;
}

/**
 * Sanitizes text according to user privacy settings before exporting or copying.
 */
export function sanitizePrivacyData(
  text: string,
  settings: PrivacySettings = DEFAULT_PRIVACY_SETTINGS
): { sanitized: string; stats: RedactionStats } {
  if (!settings.enabled) {
    return {
      sanitized: text,
      stats: { redactedIps: 0, redactedMacs: 0, redactedTokens: 0, redactedEmails: 0, totalRedacted: 0 },
    };
  }

  let sanitized = text;
  let redactedIps = 0;
  let redactedMacs = 0;
  let redactedTokens = 0;
  let redactedEmails = 0;

  if (settings.redactIps) {
    sanitized = sanitized.replace(IPV4_REGEX, (match) => {
      // Don't mask common local loopbacks if user wants to see 127.0.0.1 or standard gateway 0.0.0.0
      if (match === '127.0.0.1' || match === '0.0.0.0') return match;
      redactedIps++;
      const parts = match.split('.');
      return `${parts[0]}.${parts[1]}.***.***[SAFE_IP]`;
    });
  }

  if (settings.redactMacs) {
    sanitized = sanitized.replace(MAC_REGEX, () => {
      redactedMacs++;
      return 'XX:XX:XX:XX:XX:XX[SAFE_MAC]';
    });
  }

  if (settings.redactTokens) {
    sanitized = sanitized.replace(TOKEN_REGEX, (match) => {
      redactedTokens++;
      if (match.toLowerCase().startsWith('bearer')) {
        return 'Bearer [REDACTED_SECRET_TOKEN]';
      }
      return '[REDACTED_CREDENTIAL]';
    });
  }

  if (settings.redactUsernames) {
    sanitized = sanitized.replace(EMAIL_REGEX, (email) => {
      redactedEmails++;
      const [user, domain] = email.split('@');
      return `${user.substring(0, 2)}***@${domain}`;
    });
  }

  const totalRedacted = redactedIps + redactedMacs + redactedTokens + redactedEmails;

  return {
    sanitized,
    stats: {
      redactedIps,
      redactedMacs,
      redactedTokens,
      redactedEmails,
      totalRedacted,
    },
  };
}

/**
 * Clean an object or snapshot recursively before JSON export
 */
export function sanitizeObject<T>(obj: T, settings: PrivacySettings = DEFAULT_PRIVACY_SETTINGS): T {
  if (!settings.enabled) return obj;
  const jsonStr = JSON.stringify(obj, null, 2);
  const { sanitized } = sanitizePrivacyData(jsonStr, settings);
  try {
    return JSON.parse(sanitized) as T;
  } catch {
    return obj;
  }
}
