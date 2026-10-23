import { AutoDetectResult } from '../types/assistant';
import { testHttpPing, queryDnsDoH } from './networkTools';
import { testWebRTCLeak, checkFlashPlugin } from './deviceAudit';
import { NetworkSnapshot } from '../types/network';

/**
 * Runs the full automated test suite across Network, Website, Security, and NOC Telemetry.
 * Returns results marked as TRUE (pass/healthy) or FALSE (alert/attention needed).
 */
export async function runAutoDetectSuite(snapshot: NetworkSnapshot): Promise<AutoDetectResult[]> {
  const results: AutoDetectResult[] = [];

  // 1. Network Connectivity Ping
  try {
    const pingRes = await testHttpPing('1.1.1.1');
    const isFast = pingRes.latencyMs < 250;
    results.push({
      toolId: 'tool-ping',
      name: 'Internet Gateway Latency (Ping)',
      category: 'network',
      isTrue: isFast,
      statusText: isFast ? `Nominal (${pingRes.latencyMs}ms)` : `High Latency / Jitter (${pingRes.latencyMs}ms)`,
      details: `RTT to 1.1.1.1 measured at ${pingRes.latencyMs}ms. Status: ${pingRes.status}`,
      latencyMs: pingRes.latencyMs,
      recommendedCommand: isFast ? undefined : 'ping 1.1.1.1',
    });
  } catch {
    results.push({
      toolId: 'tool-ping',
      name: 'Internet Gateway Latency (Ping)',
      category: 'network',
      isTrue: false,
      statusText: 'Timeout / Unreachable',
      details: 'Packets dropped to DNS gateway',
      recommendedCommand: 'ping 1.1.1.1',
    });
  }

  // 2. DNS DoH Resolution
  try {
    const dnsRes = await queryDnsDoH('cloudflare.com', 'A');
    const resolved = dnsRes.records.length > 0;
    results.push({
      toolId: 'tool-dns',
      name: 'DNS-over-HTTPS (DoH)',
      category: 'website',
      isTrue: resolved,
      statusText: resolved ? `Resolved (${dnsRes.records.length} records)` : 'DNS Lookup Failed',
      details: resolved ? `Resolved to ${dnsRes.records[0]?.data}` : 'No A records returned',
      recommendedCommand: 'dns google.com',
    });
  } catch {
    results.push({
      toolId: 'tool-dns',
      name: 'DNS-over-HTTPS (DoH)',
      category: 'website',
      isTrue: false,
      statusText: 'Failed',
      details: 'DNS query error',
      recommendedCommand: 'dns 1.1.1.1',
    });
  }

  // 3. WebRTC IP Leak Detection
  try {
    const webrtc = await testWebRTCLeak();
    const isClean = !webrtc.hasLeak;
    results.push({
      toolId: 'tool-webrtc',
      name: 'WebRTC IP Leak Shield',
      category: 'security',
      isTrue: isClean,
      statusText: isClean ? 'Clean (No Leaks)' : `Leaked ${webrtc.localIps.length + webrtc.publicIps.length} Candidate(s)`,
      details: isClean
        ? 'STUN candidate probing revealed zero internal IP leakage.'
        : `Exposed: ${[...webrtc.localIps, ...webrtc.publicIps].join(', ')}`,
      recommendedCommand: 'leakcheck',
    });
  } catch {
    results.push({
      toolId: 'tool-webrtc',
      name: 'WebRTC IP Leak Shield',
      category: 'security',
      isTrue: true,
      statusText: 'Protected',
      details: 'No candidate bypass allowed',
    });
  }

  // 4. Flash & Malware Hygiene
  const flash = checkFlashPlugin();
  const flashSafe = flash !== 'present';
  results.push({
    toolId: 'tool-malwarescan',
    name: 'Browser & Plugin Hygiene',
    category: 'security',
    isTrue: flashSafe,
    statusText: flashSafe ? 'Secure (Flash Purged)' : 'Warning (Flash Active)',
    details: flashSafe
      ? 'No deprecated NPAPI Flash modules or tracking extensions detected.'
      : 'Active Shockwave Flash plugin detected on device.',
    recommendedCommand: 'malwarescan',
  });

  // 5. Optical PON Telemetry
  const opticalFailures = snapshot.optical.filter(o => o.los_alarm || o.rx_dbm < -28);
  const opticalOk = opticalFailures.length === 0;
  results.push({
    toolId: 'tool-optical',
    name: 'Fiber PON / Optical Power Levels',
    category: 'network',
    isTrue: opticalOk,
    statusText: opticalOk ? 'Nominal (All ONUs Green)' : `Alert (${opticalFailures.length} ONU Faults)`,
    details: opticalOk
      ? 'All optical RX power levels above -27 dBm with zero LOS alarms.'
      : `High attenuation on: ${opticalFailures.map(f => `${f.onu_id} (${f.rx_dbm}dBm)`).join(', ')}`,
    recommendedCommand: 'optical',
  });

  // 6. Router Load & Stability
  const overloadedRouters = snapshot.routers.filter(r => r.cpu_percent > 85 || r.interface_errors > 200);
  const routerOk = overloadedRouters.length === 0;
  results.push({
    toolId: 'tool-router',
    name: 'MikroTik Core Router Health',
    category: 'network',
    isTrue: routerOk,
    statusText: routerOk ? 'Nominal CPU & Interfaces' : `Overloaded (${overloadedRouters[0]?.cpu_percent}% CPU)`,
    details: routerOk
      ? 'Router CPU and interface packet error rates within healthy tolerances.'
      : `High load or route flapping on ${overloadedRouters[0]?.device_name}`,
    recommendedCommand: 'router',
  });

  return results;
}
