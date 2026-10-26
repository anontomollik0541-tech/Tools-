import { NetworkSnapshot } from '../types/network';

export const DEMO_SNAPSHOT: NetworkSnapshot = {
  timestamp: '2026-10-23T12:00:00Z',
  optical: [
    {
      onu_id: 'ONU-01',
      port: 'PON-1',
      rx_dbm: -28.8,
      tx_dbm: -6.2,
      los_alarm: true,
      crc_errors: 180,
      drop_count: 7,
    },
    {
      onu_id: 'ONU-02',
      port: 'PON-1',
      rx_dbm: -25.1,
      tx_dbm: -5.9,
      los_alarm: false,
      crc_errors: 24,
      drop_count: 2,
    },
    {
      onu_id: 'ONU-03',
      port: 'PON-2',
      rx_dbm: -16.4,
      tx_dbm: -4.7,
      los_alarm: false,
      crc_errors: 3,
      drop_count: 0,
    },
  ],
  wifi: [
    {
      ssid: 'HomeWiFi-5G',
      channel: 44,
      rssi_dbm: -76,
      noise_dbm: -96,
      snr_dbm: 18,
      clients: 14,
      channel_utilization: 75,
      packet_loss_pct: 6.4,
    },
    {
      ssid: 'HomeWiFi-2G',
      channel: 6,
      rssi_dbm: -61,
      noise_dbm: -90,
      snr_dbm: 29,
      clients: 9,
      channel_utilization: 41,
      packet_loss_pct: 1.6,
    },
  ],
  routers: [
    {
      device_name: 'MikroTik-Core',
      cpu_percent: 91,
      memory_used_pct: 72,
      uptime_hours: 420,
      interface_errors: 230,
      pppoe_flaps: 8,
      dhcp_failures: 3,
      route_flaps: 12,
    },
  ],
  olt: [
    {
      olt_name: 'OLT-01',
      port: 'PON-1',
      port_state: 'down',
      onu_count: 16,
      alarms: ['LOS', 'CRC'],
      power_dbm: -29.2,
    },
    {
      olt_name: 'OLT-01',
      port: 'PON-2',
      port_state: 'up',
      onu_count: 12,
      alarms: [],
      power_dbm: -17.8,
    },
  ],
};

export const SCENARIOS: Record<string, { label: string; description: string; snapshot: NetworkSnapshot }> = {
  demo: {
    label: 'Standard Demo (Mixed Faults)',
    description: 'SIMULATED DEMO DATA only: optical attenuation on PON-1, 5G WiFi interference, and MikroTik CPU load. Not connected to live hardware.',
    snapshot: DEMO_SNAPSHOT,
  },
  fiber_cut: {
    label: 'Fiber Sever / Port Outage',
    description: 'Critical LOS loss on multiple ONUs along PON-1 due to mainline fiber cut.',
    snapshot: {
      timestamp: new Date().toISOString(),
      optical: [
        { onu_id: 'ONU-01', port: 'PON-1', rx_dbm: -35.2, tx_dbm: -12.0, los_alarm: true, crc_errors: 980, drop_count: 48 },
        { onu_id: 'ONU-02', port: 'PON-1', rx_dbm: -33.9, tx_dbm: -11.5, los_alarm: true, crc_errors: 650, drop_count: 36 },
        { onu_id: 'ONU-03', port: 'PON-2', rx_dbm: -18.2, tx_dbm: -5.1, los_alarm: false, crc_errors: 1, drop_count: 0 },
      ],
      wifi: [
        { ssid: 'NOC-Staff-5G', channel: 36, rssi_dbm: -58, noise_dbm: -95, snr_dbm: 37, clients: 6, channel_utilization: 24, packet_loss_pct: 0.2 },
      ],
      routers: [
        { device_name: 'MikroTik-Core', cpu_percent: 42, memory_used_pct: 48, uptime_hours: 612, interface_errors: 412, pppoe_flaps: 64, dhcp_failures: 8, route_flaps: 16 },
      ],
      olt: [
        { olt_name: 'OLT-01', port: 'PON-1', port_state: 'down', onu_count: 16, alarms: ['LOS', 'DOWNTIME_CRITICAL'], power_dbm: -38.0 },
        { olt_name: 'OLT-01', port: 'PON-2', port_state: 'up', onu_count: 12, alarms: [], power_dbm: -17.8 },
      ],
    },
  },
  wifi_congested: {
    label: 'WiFi RF Interference & Saturation',
    description: 'Overcrowded 2.4GHz & 5GHz channels with high noise floor and 14% packet drops.',
    snapshot: {
      timestamp: new Date().toISOString(),
      optical: [
        { onu_id: 'ONU-01', port: 'PON-1', rx_dbm: -19.4, tx_dbm: -5.5, los_alarm: false, crc_errors: 2, drop_count: 0 },
        { onu_id: 'ONU-02', port: 'PON-1', rx_dbm: -18.9, tx_dbm: -5.4, los_alarm: false, crc_errors: 0, drop_count: 0 },
      ],
      wifi: [
        { ssid: 'OfficeWiFi-2.4G', channel: 6, rssi_dbm: -79, noise_dbm: -82, snr_dbm: 3, clients: 38, channel_utilization: 94, packet_loss_pct: 14.8 },
        { ssid: 'OfficeWiFi-5G', channel: 149, rssi_dbm: -74, noise_dbm: -88, snr_dbm: 14, clients: 26, channel_utilization: 82, packet_loss_pct: 7.2 },
      ],
      routers: [
        { device_name: 'MikroTik-Core', cpu_percent: 54, memory_used_pct: 61, uptime_hours: 890, interface_errors: 45, pppoe_flaps: 0, dhcp_failures: 12, route_flaps: 2 },
      ],
      olt: [
        { olt_name: 'OLT-01', port: 'PON-1', port_state: 'up', onu_count: 16, alarms: [], power_dbm: -18.2 },
      ],
    },
  },
  router_spike: {
    label: 'MikroTik High CPU & Route Flapping',
    description: 'Core router CPU at 96% with interface packet drops and BGP/PPPoE instability.',
    snapshot: {
      timestamp: new Date().toISOString(),
      optical: [
        { onu_id: 'ONU-01', port: 'PON-1', rx_dbm: -19.2, tx_dbm: -5.1, los_alarm: false, crc_errors: 4, drop_count: 0 },
      ],
      wifi: [
        { ssid: 'BranchWiFi-5G', channel: 40, rssi_dbm: -62, noise_dbm: -92, snr_dbm: 30, clients: 8, channel_utilization: 32, packet_loss_pct: 0.8 },
      ],
      routers: [
        { device_name: 'MikroTik-Core-CCR', cpu_percent: 96, memory_used_pct: 88, uptime_hours: 124, interface_errors: 1450, pppoe_flaps: 32, dhcp_failures: 19, route_flaps: 74 },
      ],
      olt: [
        { olt_name: 'OLT-01', port: 'PON-1', port_state: 'up', onu_count: 24, alarms: [], power_dbm: -18.0 },
      ],
    },
  },
  nominal: {
    label: 'Nominal Health (All Green)',
    description: 'Clean optical signal, quiet RF spectrum, and nominal router load.',
    snapshot: {
      timestamp: new Date().toISOString(),
      optical: [
        { onu_id: 'ONU-01', port: 'PON-1', rx_dbm: -18.2, tx_dbm: -5.0, los_alarm: false, crc_errors: 0, drop_count: 0 },
        { onu_id: 'ONU-02', port: 'PON-1', rx_dbm: -17.8, tx_dbm: -4.8, los_alarm: false, crc_errors: 0, drop_count: 0 },
        { onu_id: 'ONU-03', port: 'PON-2', rx_dbm: -19.1, tx_dbm: -5.2, los_alarm: false, crc_errors: 0, drop_count: 0 },
      ],
      wifi: [
        { ssid: 'FiberNet-5G', channel: 44, rssi_dbm: -55, noise_dbm: -95, snr_dbm: 40, clients: 11, channel_utilization: 28, packet_loss_pct: 0.1 },
        { ssid: 'FiberNet-2G', channel: 1, rssi_dbm: -52, noise_dbm: -92, snr_dbm: 40, clients: 5, channel_utilization: 22, packet_loss_pct: 0.0 },
      ],
      routers: [
        { device_name: 'MikroTik-Core', cpu_percent: 24, memory_used_pct: 38, uptime_hours: 1250, interface_errors: 0, pppoe_flaps: 0, dhcp_failures: 0, route_flaps: 0 },
      ],
      olt: [
        { olt_name: 'OLT-01', port: 'PON-1', port_state: 'up', onu_count: 16, alarms: [], power_dbm: -17.5 },
        { olt_name: 'OLT-01', port: 'PON-2', port_state: 'up', onu_count: 12, alarms: [], power_dbm: -17.2 },
      ],
    },
  },
};
