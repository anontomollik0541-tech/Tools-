from __future__ import annotations

from typing import Any, Dict, List

from .models import FaultEvent, NetworkSnapshot


def build_demo_snapshot() -> Dict[str, Any]:
    return {
        "timestamp": "2026-10-23T12:00:00Z",
        "optical": [
            {
                "onu_id": "ONU-01",
                "port": "PON-1",
                "rx_dbm": -28.8,
                "tx_dbm": -6.2,
                "los_alarm": True,
                "crc_errors": 180,
                "drop_count": 7,
            },
            {
                "onu_id": "ONU-02",
                "port": "PON-1",
                "rx_dbm": -25.1,
                "tx_dbm": -5.9,
                "los_alarm": False,
                "crc_errors": 24,
                "drop_count": 2,
            },
            {
                "onu_id": "ONU-03",
                "port": "PON-2",
                "rx_dbm": -16.4,
                "tx_dbm": -4.7,
                "los_alarm": False,
                "crc_errors": 3,
                "drop_count": 0,
            },
        ],
        "wifi": [
            {
                "ssid": "HomeWiFi-5G",
                "channel": 44,
                "rssi_dbm": -76,
                "noise_dbm": -96,
                "snr_dbm": 18,
                "clients": 14,
                "channel_utilization": 75,
                "packet_loss_pct": 6.4,
            },
            {
                "ssid": "HomeWiFi-2G",
                "channel": 6,
                "rssi_dbm": -61,
                "noise_dbm": -90,
                "snr_dbm": 29,
                "clients": 9,
                "channel_utilization": 41,
                "packet_loss_pct": 1.6,
            },
        ],
        "routers": [
            {
                "device_name": "MikroTik-Core",
                "cpu_percent": 91,
                "memory_used_pct": 72,
                "uptime_hours": 420,
                "interface_errors": 230,
                "pppoe_flaps": 8,
                "dhcp_failures": 3,
                "route_flaps": 12,
            }
        ],
        "olt": [
            {
                "olt_name": "OLT-01",
                "port": "PON-1",
                "port_state": "down",
                "onu_count": 16,
                "alarms": ["LOS", "CRC"],
                "power_dbm": -29.2,
            },
            {
                "olt_name": "OLT-01",
                "port": "PON-2",
                "port_state": "up",
                "onu_count": 12,
                "alarms": [],
                "power_dbm": -17.8,
            },
        ],
    }


def summarize_network_health(snapshot: NetworkSnapshot) -> str:
    optical_bad = [item for item in snapshot.optical if item.rx_dbm < -26 or item.los_alarm]
    wifi_bad = [item for item in snapshot.wifi if item.rssi_dbm < -70 or item.snr_dbm < 20]
    router_bad = [item for item in snapshot.routers if item.cpu_percent > 80 or item.interface_errors > 100]
    return (
        f"Optical faults: {len(optical_bad)} | "
        f"WiFi faults: {len(wifi_bad)} | "
        f"Router faults: {len(router_bad)}"
    )
