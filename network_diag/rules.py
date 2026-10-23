from __future__ import annotations

from typing import Any, Dict, List

from .models import FaultEvent, NetworkSnapshot


def classify_faults(snapshot: Dict[str, Any] | NetworkSnapshot) -> List[FaultEvent]:
    if isinstance(snapshot, dict):
        snapshot_obj = NetworkSnapshot(
            timestamp=snapshot.get("timestamp", "unknown"),
            optical=[],
            wifi=[],
            routers=[],
            olt=[],
        )
        for item in snapshot.get("optical", []):
            from .models import OpticalStatus
            snapshot_obj.optical.append(
                OpticalStatus(
                    onu_id=item.get("onu_id", "unknown"),
                    port=item.get("port", "unknown"),
                    rx_dbm=float(item.get("rx_dbm", -30)),
                    tx_dbm=float(item.get("tx_dbm", -10)),
                    los_alarm=bool(item.get("los_alarm", False)),
                    crc_errors=int(item.get("crc_errors", 0)),
                    drop_count=int(item.get("drop_count", 0)),
                )
            )
        for item in snapshot.get("wifi", []):
            from .models import WiFiStatus
            snapshot_obj.wifi.append(
                WiFiStatus(
                    ssid=item.get("ssid", "unknown"),
                    channel=int(item.get("channel", 1)),
                    rssi_dbm=float(item.get("rssi_dbm", -80)),
                    noise_dbm=float(item.get("noise_dbm", -95)),
                    snr_dbm=float(item.get("snr_dbm", 15)),
                    clients=int(item.get("clients", 0)),
                    channel_utilization=float(item.get("channel_utilization", 0)),
                    packet_loss_pct=float(item.get("packet_loss_pct", 0)),
                )
            )
        for item in snapshot.get("routers", []):
            from .models import RouterStatus
            snapshot_obj.routers.append(
                RouterStatus(
                    device_name=item.get("device_name", "unknown"),
                    cpu_percent=float(item.get("cpu_percent", 0)),
                    memory_used_pct=float(item.get("memory_used_pct", 0)),
                    uptime_hours=float(item.get("uptime_hours", 0)),
                    interface_errors=int(item.get("interface_errors", 0)),
                    pppoe_flaps=int(item.get("pppoe_flaps", 0)),
                    dhcp_failures=int(item.get("dhcp_failures", 0)),
                    route_flaps=int(item.get("route_flaps", 0)),
                )
            )
        for item in snapshot.get("olt", []):
            from .models import OltStatus
            snapshot_obj.olt.append(
                OltStatus(
                    olt_name=item.get("olt_name", "unknown"),
                    port=item.get("port", "unknown"),
                    port_state=item.get("port_state", "up"),
                    onu_count=int(item.get("onu_count", 0)),
                    alarms=list(item.get("alarms", [])),
                    power_dbm=item.get("power_dbm"),
                )
            )
        snapshot = snapshot_obj

    issues: List[FaultEvent] = []

    for item in snapshot.optical:
        if item.los_alarm or item.rx_dbm < -28:
            issues.append(
                FaultEvent(
                    category="optical",
                    severity="high" if item.los_alarm else "medium",
                    title=f"Optical issue on {item.onu_id}",
                    detail="ONU RX power is too low or LOS is active, indicating fiber attenuation or connector loss.",
                    evidence={
                        "onu_id": item.onu_id,
                        "port": item.port,
                        "rx_dbm": item.rx_dbm,
                        "los_alarm": item.los_alarm,
                        "crc_errors": item.crc_errors,
                    },
                )
            )

    for item in snapshot.wifi:
        if item.rssi_dbm < -70 or item.snr_dbm < 20 or item.packet_loss_pct > 5:
            issues.append(
                FaultEvent(
                    category="wifi",
                    severity="medium",
                    title=f"WiFi quality weak on {item.ssid}",
                    detail="Signal quality is below healthy thresholds and may cause client disconnects or slow throughput.",
                    evidence={
                        "ssid": item.ssid,
                        "rssi_dbm": item.rssi_dbm,
                        "snr_dbm": item.snr_dbm,
                        "packet_loss_pct": item.packet_loss_pct,
                    },
                )
            )

    for item in snapshot.routers:
        if item.cpu_percent > 85 or item.interface_errors > 200 or item.pppoe_flaps > 5:
            issues.append(
                FaultEvent(
                    category="router",
                    severity="high" if item.cpu_percent > 85 else "medium",
                    title=f"Router instability on {item.device_name}",
                    detail="Router resource usage or interface instability suggests a routing or access-layer issue.",
                    evidence={
                        "device_name": item.device_name,
                        "cpu_percent": item.cpu_percent,
                        "interface_errors": item.interface_errors,
                        "pppoe_flaps": item.pppoe_flaps,
                    },
                )
            )

    by_port: Dict[str, List[str]] = {}
    for item in snapshot.optical:
        by_port.setdefault(item.port, []).append(item.onu_id)
    for port, onu_ids in by_port.items():
        if len(onu_ids) >= 2:
            for onu in onu_ids:
                issues.append(
                    FaultEvent(
                        category="olt",
                        severity="high",
                        title=f"Multiple ONU failures on port {port}",
                        detail="Several ONUs on the same optical port are failing together, suggesting a shared OLT or splitter issue.",
                        evidence={"port": port, "onu_ids": onu_ids},
                    )
                )

    return issues
