export type Severity = 'high' | 'medium' | 'info' | 'low';
export type FaultCategory = 'optical' | 'wifi' | 'router' | 'olt';
export type Language = 'en' | 'bn';

export interface OpticalStatus {
  onu_id: string;
  port: string;
  rx_dbm: number;
  tx_dbm: number;
  los_alarm: boolean;
  crc_errors: number;
  drop_count: number;
}

export interface WiFiStatus {
  ssid: string;
  channel: number;
  rssi_dbm: number;
  noise_dbm: number;
  snr_dbm: number;
  clients: number;
  channel_utilization: number;
  packet_loss_pct: number;
}

export interface RouterStatus {
  device_name: string;
  cpu_percent: number;
  memory_used_pct: number;
  uptime_hours: number;
  interface_errors: number;
  pppoe_flaps: number;
  dhcp_failures: number;
  route_flaps: number;
}

export interface OltStatus {
  olt_name: string;
  port: string;
  port_state: 'up' | 'down';
  onu_count: number;
  alarms: string[];
  power_dbm?: number;
}

export interface FaultEvent {
  category: FaultCategory;
  severity: Severity;
  title: string;
  detail: string;
  evidence: Record<string, string | number | boolean | string[]>;
}

export interface NetworkSnapshot {
  timestamp: string;
  optical: OpticalStatus[];
  wifi: WiFiStatus[];
  routers: RouterStatus[];
  olt: OltStatus[];
}

export interface TerminalEntry {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'system' | 'table';
  content?: string;
  tableData?: {
    headers: string[];
    rows: (string | number)[][];
  };
  timestamp?: string;
}
