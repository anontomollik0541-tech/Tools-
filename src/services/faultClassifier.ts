import { FaultEvent, NetworkSnapshot, Language } from '../types/network';
import { t } from './i18n';

export function classifyFaults(snapshot: NetworkSnapshot): FaultEvent[] {
  const issues: FaultEvent[] = [];

  // 1. Optical / PON classification
  for (const item of snapshot.optical) {
    if (item.los_alarm || item.rx_dbm < -28) {
      issues.push({
        category: 'optical',
        severity: item.los_alarm ? 'high' : 'medium',
        title: `Optical issue on ${item.onu_id}`,
        detail: 'ONU RX power is too low or LOS is active, indicating fiber attenuation or connector loss.',
        evidence: {
          onu_id: item.onu_id,
          port: item.port,
          rx_dbm: `${item.rx_dbm} dBm`,
          los_alarm: item.los_alarm,
          crc_errors: item.crc_errors,
        },
      });
    }
  }

  // 2. WiFi quality & interference
  for (const item of snapshot.wifi) {
    if (item.rssi_dbm < -70 || item.snr_dbm < 20 || item.packet_loss_pct > 5) {
      issues.push({
        category: 'wifi',
        severity: 'medium',
        title: `WiFi quality weak on ${item.ssid}`,
        detail: 'Signal quality is below healthy thresholds and may cause client disconnects or slow throughput.',
        evidence: {
          ssid: item.ssid,
          rssi_dbm: `${item.rssi_dbm} dBm`,
          snr_dbm: `${item.snr_dbm} dB`,
          packet_loss_pct: `${item.packet_loss_pct}%`,
        },
      });
    }
  }

  // 3. Router instability
  for (const item of snapshot.routers) {
    if (item.cpu_percent > 85 || item.interface_errors > 200 || item.pppoe_flaps > 5) {
      issues.push({
        category: 'router',
        severity: item.cpu_percent > 85 ? 'high' : 'medium',
        title: `Router instability on ${item.device_name}`,
        detail: 'Router resource usage or interface instability suggests a routing or access-layer issue.',
        evidence: {
          device_name: item.device_name,
          cpu_percent: `${item.cpu_percent}%`,
          interface_errors: item.interface_errors,
          pppoe_flaps: item.pppoe_flaps,
        },
      });
    }
  }

  // 4. OLT / Shared Splitter correlation
  const failingByPort: Record<string, string[]> = {};
  for (const item of snapshot.optical) {
    if (item.los_alarm || item.rx_dbm < -28) {
      if (!failingByPort[item.port]) {
        failingByPort[item.port] = [];
      }
      failingByPort[item.port].push(item.onu_id);
    }
  }

  for (const [port, onuIds] of Object.entries(failingByPort)) {
    if (onuIds.length >= 2) {
      issues.push({
        category: 'olt',
        severity: 'high',
        title: `Multiple ONU failures on port ${port}`,
        detail: 'Several ONUs on the same optical port are failing together, suggesting a shared OLT or splitter issue.',
        evidence: {
          port,
          failing_onus: onuIds,
          count: onuIds.length,
        },
      });
    }
  }

  return issues;
}

export function summarizeNetworkHealth(snapshot: NetworkSnapshot, language: Language = 'en'): string {
  const opticalBad = snapshot.optical.filter(item => item.rx_dbm < -26 || item.los_alarm);
  const wifiBad = snapshot.wifi.filter(item => item.rssi_dbm < -70 || item.snr_dbm < 20);
  const routerBad = snapshot.routers.filter(item => item.cpu_percent > 80 || item.interface_errors > 100);

  return (
    `${t('optical_faults', language)}: ${opticalBad.length} | ` +
    `${t('wifi_faults', language)}: ${wifiBad.length} | ` +
    `${t('router_faults', language)}: ${routerBad.length}`
  );
}
