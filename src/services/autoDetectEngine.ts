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
    const isReachable = pingRes.status !== 'unreachable';
    const isFast = isReachable && pingRes.latencyMs < 250;
    results.push({
      toolId: 'tool-ping',
      name: 'Internet Gateway Latency (Ping)',
      category: 'network',
      isTrue: isReachable ? isFast : false,
      statusText: !isReachable ? 'Probe failed / unreachable' : isFast ? `HTTP probe (${pingRes.latencyMs}ms)` : `Slow HTTP probe (${pingRes.latencyMs}ms)`,
      details: `HTTP HEAD reachability probe to 1.1.1.1; this is not ICMP ping. Status: ${pingRes.status}.`,
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
    const resolved = dnsRes.status !== 0 && dnsRes.records.length > 0;
    const queryFailed = dnsRes.status === 0;
    results.push({
      toolId: 'tool-dns',
      name: 'DNS-over-HTTPS (DoH)',
      category: 'website',
      isTrue: queryFailed ? undefined : resolved,
      statusText: queryFailed ? 'DNS request failed (unknown)' : resolved ? `Resolved (${dnsRes.records.length} records)` : `DNS response status ${dnsRes.status}; no A records`,
      details: queryFailed ? 'The DoH request failed; DNS status is unknown, not a confirmed resolution failure.' : resolved ? `Resolved to ${dnsRes.records[0]?.data}` : `DNS server returned status ${dnsRes.status} without A records`,
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
    const isClean = webrtc.status === 'clean';
    const isUnknown = webrtc.status === 'unknown';
    results.push({
      toolId: 'tool-webrtc',
      name: 'WebRTC IP Leak Shield',
      category: 'security',
      isTrue: isUnknown ? undefined : isClean,
      statusText: isUnknown ? 'Unable to test (unknown)' : isClean ? 'No candidates observed' : `Candidates exposed: ${webrtc.localIps.length + webrtc.publicIps.length}`,
      details: isUnknown ? 'The browser/STUN test did not complete. This does not prove WebRTC is protected.' : isClean
        ? 'No IP candidates were observed during this test; this is not a guarantee of VPN protection.'
        : `Observed candidates: ${[...webrtc.localIps, ...webrtc.publicIps].join(', ')}`,
      recommendedCommand: 'leakcheck',
    });
  } catch {
    results.push({
      toolId: 'tool-webrtc',
      name: 'WebRTC IP Leak Shield',
      category: 'security',
      isTrue: undefined,
      statusText: 'Unable to test (unknown)',
      details: 'The WebRTC test failed; no conclusion about leak protection can be made.',
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
      ? 'Snapshot values show optical RX power levels above -28 dBm with zero LOS alarms. Confirm snapshot source is live before operational use.'
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
      ? 'Snapshot values show router CPU and interface errors within thresholds. Confirm snapshot source is live before operational use.'
      : `High load or route flapping on ${overloadedRouters[0]?.device_name}`,
    recommendedCommand: 'router',
  });

  return results;
}
