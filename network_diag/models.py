from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class OpticalStatus:
    onu_id: str
    port: str
    rx_dbm: float
    tx_dbm: float
    los_alarm: bool
    crc_errors: int
    drop_count: int = 0


@dataclass
class WiFiStatus:
    ssid: str
    channel: int
    rssi_dbm: float
    noise_dbm: float
    snr_dbm: float
    clients: int
    channel_utilization: float
    packet_loss_pct: float


@dataclass
class RouterStatus:
    device_name: str
    cpu_percent: float
    memory_used_pct: float
    uptime_hours: float
    interface_errors: int
    pppoe_flaps: int
    dhcp_failures: int
    route_flaps: int


@dataclass
class OltStatus:
    olt_name: str
    port: str
    port_state: str
    onu_count: int
    alarms: List[str] = field(default_factory=list)
    power_dbm: Optional[float] = None


@dataclass
class FaultEvent:
    category: str
    severity: str
    title: str
    detail: str
    evidence: Dict[str, Any]


@dataclass
class NetworkSnapshot:
    timestamp: str
    optical: List[OpticalStatus]
    wifi: List[WiFiStatus]
    routers: List[RouterStatus]
    olt: List[OltStatus]

    def as_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp,
            "optical": [
                {
                    "onu_id": item.onu_id,
                    "port": item.port,
                    "rx_dbm": item.rx_dbm,
                    "tx_dbm": item.tx_dbm,
                    "los_alarm": item.los_alarm,
                    "crc_errors": item.crc_errors,
                    "drop_count": item.drop_count,
                }
                for item in self.optical
            ],
            "wifi": [
                {
                    "ssid": item.ssid,
                    "channel": item.channel,
                    "rssi_dbm": item.rssi_dbm,
                    "noise_dbm": item.noise_dbm,
                    "snr_dbm": item.snr_dbm,
                    "clients": item.clients,
                    "channel_utilization": item.channel_utilization,
                    "packet_loss_pct": item.packet_loss_pct,
                }
                for item in self.wifi
            ],
            "routers": [
                {
                    "device_name": item.device_name,
                    "cpu_percent": item.cpu_percent,
                    "memory_used_pct": item.memory_used_pct,
                    "uptime_hours": item.uptime_hours,
                    "interface_errors": item.interface_errors,
                    "pppoe_flaps": item.pppoe_flaps,
                    "dhcp_failures": item.dhcp_failures,
                    "route_flaps": item.route_flaps,
                }
                for item in self.routers
            ],
            "olt": [
                {
                    "olt_name": item.olt_name,
                    "port": item.port,
                    "port_state": item.port_state,
                    "onu_count": item.onu_count,
                    "alarms": item.alarms,
                    "power_dbm": item.power_dbm,
                }
                for item in self.olt
            ],
        }
