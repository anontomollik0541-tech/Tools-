from __future__ import annotations

from typing import Any, Dict, List

from .i18n import t


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


def summarize_network_health(snapshot: Any, language: str = "en") -> str:
    optical_bad = [item for item in snapshot.get("optical", []) if item.get("rx_dbm", -100) < -26 or item.get("los_alarm", False)]
    wifi_bad = [item for item in snapshot.get("wifi", []) if item.get("rssi_dbm", -100) < -70 or item.get("snr_dbm", 0) < 20]
    router_bad = [item for item in snapshot.get("routers", []) if item.get("cpu_percent", 0) > 80 or item.get("interface_errors", 0) > 100]

    return (
        f"{t('optical_faults', language)}: {len(optical_bad)} | "
        f"{t('wifi_faults', language)}: {len(wifi_bad)} | "
        f"{t('router_faults', language)}: {len(router_bad)}"
    )
