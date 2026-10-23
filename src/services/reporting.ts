import { FaultEvent, NetworkSnapshot, Language } from '../types/network';
import { t } from './i18n';

export function generateReport(
  snapshot: NetworkSnapshot,
  issues: FaultEvent[],
  language: Language = 'en'
): string {
  const lines: string[] = [];
  lines.push(`${t('report_title', language)} — ${snapshot.timestamp}`);
  lines.push('='.repeat(60));

  if (issues.length === 0) {
    lines.push(t('no_faults', language));
    return lines.join('\n');
  }

  for (let idx = 0; idx < issues.length; idx++) {
    const issue = issues[idx];
    lines.push(`${idx + 1}. [${issue.category.toUpperCase()} | ${issue.severity.toUpperCase()}] ${issue.title}`);
    lines.push(`   - ${issue.detail}`);
    if (issue.evidence && Object.keys(issue.evidence).length > 0) {
      const evidenceStr = Object.entries(issue.evidence)
        .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(',') : v}`)
        .join(', ');
      lines.push(`   - Evidence: ${evidenceStr}`);
    }
  }

  lines.push('');
  lines.push(t('recommended_action', language) + ':');

  const categories = new Set(issues.map(i => i.category));
  if (categories.has('optical')) {
    lines.push(`  - ${t('optical_action', language)}`);
  }
  if (categories.has('wifi')) {
    lines.push(`  - ${t('wifi_action', language)}`);
  }
  if (categories.has('router')) {
    lines.push(`  - ${t('router_action', language)}`);
  }
  if (categories.has('olt')) {
    lines.push(`  - ${t('olt_action', language)}`);
  }

  return lines.join('\n');
}
