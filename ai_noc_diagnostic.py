#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Truthful network diagnostics for Termux/Linux. Unknown data stays unknown."""
import ipaddress
import json
import os
import re
import shutil
import subprocess
import sys


def run_cmd(args, timeout=8):
    """Return (stdout, error); never substitute invented telemetry."""
    if not shutil.which(args[0]):
        return "", f"টুল ইনস্টল নেই: {args[0]}"
    try:
        p = subprocess.run(args, capture_output=True, text=True, timeout=timeout, check=False)
        output = (p.stdout or "").strip()
        if p.returncode != 0:
            detail = (p.stderr or output or f"exit code {p.returncode}").strip()
            return output, detail[:300]
        return output, None
    except subprocess.TimeoutExpired:
        return "", f"টাইমআউট: {args[0]}"
    except OSError as exc:
        return "", str(exc)


def check_command(cmd):
    return shutil.which(cmd) is not None


def analyze_network(olt_ip=None, brand=None, port=None, onu=None):
    result = {
        "সিস্টেম_স্ট্যাটাস": "চলমান",
        "টুলস_চেকিং": {},
        "ওয়াইফাই_ও_লোকাল_নেটওয়ার্ক": {},
        "ওএলটি_ফাইবার_টেলিমেট্রি": {},
        "নেটওয়ার্ক_ড্রপ_ও_রুট_অ্যানালাইসিস": {},
        "এআই_টেকনিশিয়ান_মন্তব্য": ""
    }
    tools = ["ping", "nmap", "traceroute", "termux-wifi-connectioninfo", "snmpget"]
    result["টুলস_চেকিং"] = {
        "অবস্থা": "টুল উপস্থিতি পরীক্ষা সম্পন্ন",
        "উপস্থিত_টুলস": [t for t in tools if check_command(t)],
        "অনুপস্থিত_টুলস": [t for t in tools if not check_command(t)]
    }

    # Wi-Fi telemetry: only values actually returned by Android/Termux.
    wifi, wifi_err = run_cmd(["termux-wifi-connectioninfo"])
    ip_value = None
    if wifi:
        try:
            data = json.loads(wifi)
            ip_value = data.get("ip")
            wifi_info = {"ডেটার_উৎস": "termux-wifi-connectioninfo"}
            for key, label in (("ssid", "ওয়াইফাই_নাম"), ("rssi", "সিগন্যাল_dBm"),
                               ("link_speed_mbps", "লিংক_স্পিড_Mbps"),
                               ("frequency_mhz", "ফ্রিকোয়েন্সি_MHz")):
                value = data.get(key)
                if value is not None and value != "":
                    wifi_info[label] = value
            if ip_value:
                wifi_info["মোবাইল_আইপি"] = ip_value
            else:
                wifi_info["মোবাইল_আইপি"] = "অজানা: API IP দেয়নি"
            if data.get("rssi") is not None:
                rssi = data["rssi"]
                wifi_info["সিগন্যাল_মূল্যায়ন"] = (
                    "ভালো" if rssi >= -60 else "মাঝারি" if rssi >= -70 else "দুর্বল"
                )
            result["ওয়াইফাই_ও_লোকাল_নেটওয়ার্ক"] = wifi_info
        except (ValueError, TypeError):
            result["ওয়াইফাই_ও_লোকাল_নেটওয়ার্ক"] = {
                "অবস্থা": "Wi-Fi API ডেটা JSON হিসেবে পড়া যায়নি",
                "ত্রুটি": "invalid JSON"
            }
    else:
        result["ওয়াইফাই_ও_লোকাল_নেটওয়ার্ক"] = {
            "অবস্থা": "Wi-Fi telemetry পাওয়া যায়নি",
            "কারণ": wifi_err or "কোনো ডেটা ফেরত আসেনি",
            "মোবাইল_আইপি": "অজানা"
        }

    # Scan only the subnet derived from a real IP. Never invent a device count.
    if ip_value:
        try:
            addr = ipaddress.ip_address(ip_value)
            if addr.version == 4 and not addr.is_unspecified:
                subnet = str(ipaddress.ip_network(f"{addr}/24", strict=False))
                scan, scan_err = run_cmd(["nmap", "-sn", subnet], timeout=30)
                if scan and scan_err is None:
                    hosts = re.findall(r"\bNmap scan report for\b", scan)
                    result["ওয়াইফাই_ও_লোকাল_নেটওয়ার্ক"]["স্ক্যান_সাবনেট"] = subnet
                    result["ওয়াইফাই_ও_লোকাল_নেটওয়ার্ক"]["লাইভ_ডিভাইস_সংখ্যা"] = len(hosts)
                    result["ওয়াইফাই_ও_লোকাল_নেটওয়ার্ক"]["স্ক্যান_স্ট্যাটাস"] = "সম্পন্ন"
                else:
                    result["ওয়াইফাই_ও_লোকাল_নেটওয়ার্ক"]["স্ক্যান_স্ট্যাটাস"] = "পরীক্ষা করা যায়নি"
                    result["ওয়াইফাই_ও_লোকাল_নেটওয়ার্ক"]["স্ক্যান_কারণ"] = scan_err or "কোনো ফলাফল নেই"
            else:
                result["ওয়াইফাই_ও_লোকাল_নেটওয়ার্ক"]["স্ক্যান_স্ট্যাটাস"] = "উপযুক্ত IPv4 নেই"
        except ValueError:
            result["ওয়াইফাই_ও_লোকাল_নেটওয়ার্ক"]["স্ক্যান_স্ট্যাটাস"] = "প্রাপ্ত IP অবৈধ"
    else:
        result["ওয়াইফাই_ও_লোকাল_নেটওয়ার্ক"]["স্ক্যান_স্ট্যাটাস"] = "IP না পাওয়ায় স্ক্যান করা হয়নি"

    # Optical power requires explicit target details, SNMP access and vendor-correct OID.
    optical = {"অবস্থা": "NOT TESTED", "কারণ": "OLT IP, brand, PON port ও ONU ID দিতে হবে"}
    if olt_ip and brand and port is not None and onu is not None:
        optical["ওএলটি_আইপি"] = olt_ip
        optical["পোর্ট_ও_ওএনইউ"] = f"PON {port} -> ONU {onu}"
        oid_map = {
            "vsol": f"1.3.6.1.4.1.3320.101.108.1.1.2.{port}.{onu}",
            "cdata": f"1.3.6.1.4.1.34592.1.5.1.1.2.1.1.3.{port}.{onu}",
            "bdcom": f"1.3.6.1.4.1.3320.9.183.1.1.4.{port}.{onu}",
            "huawei": f"1.3.6.1.4.1.2011.6.128.1.1.2.51.1.4.{port}.{onu}",
            "zte": f"1.3.6.1.4.1.3902.1012.3.50.12.1.1.10.{port}.{onu}"
        }
        key = brand.strip().lower()
        community = os.environ.get("SNMP_COMMUNITY")
        oid = oid_map.get(key)
        if not oid:
            optical.update({"অবস্থা": "NOT TESTED", "কারণ": "এই ব্র্যান্ডের OID ম্যাপ নেই"})
        elif not community:
            optical.update({"অবস্থা": "NOT TESTED", "কারণ": "SNMP_COMMUNITY environment variable সেট করা নেই"})
        else:
            raw, err = run_cmd(["snmpget", "-v", "2c", "-c", community, "-t", "3", "-r", "1",
                                f"{olt_ip}:161", oid], timeout=6)
            if err or not raw or "No Such" in raw or "Timeout" in raw:
                optical.update({"অবস্থা": "FAILED", "কারণ": err or raw or "SNMP response নেই"})
            else:
                # Only accept a numeric SNMP value; do not guess scaling without vendor MIB.
                match = re.search(r"(?i)(?:INTEGER|GAUGE|INTEGER32|Counter32|OCTET STRING)\s*:\s*[\"']?(-?\d+(?:\.\d+)?)", raw)
                if match:
                    optical.update({
                        "অবস্থা": "RESPONSE_RECEIVED — RX dBm NOT VERIFIED",
                        "SNMP_র_কাঁচা_মান": match.group(1),
                        "কারণ": "সঠিক vendor MIB/scaling যাচাই ছাড়া raw মানকে dBm বলা নিরাপদ নয়"
                    })
                else:
                    optical.update({"অবস্থা": "FAILED", "কারণ": "SNMP response থেকে numeric value পড়া যায়নি",
                                    "SNMP_response": raw[:300]})
    result["ওএলটি_ফাইবার_টেলিমেট্রি"] = optical

    # Internet test: success, packet loss, and unknown are separate states.
    ping, ping_err = run_cmd(["ping", "-c", "3", "-W", "2", "8.8.8.8"], timeout=10)
    net = {"পরীক্ষার_লক্ষ্য": "8.8.8.8"}
    if ping and ping_err is None:
        sent = re.search(r"(\d+) packets transmitted", ping)
        received = re.search(r"(\d+) (?:packets )?received", ping)
        avg = re.search(r"=\s*[\d.]+/([\d.]+)/[\d.]+", ping)
        if sent and received:
            sent_n, recv_n = int(sent.group(1)), int(received.group(1))
            net["ইন্টারনেট_সংযোগ"] = "সচল (ping reply এসেছে)" if recv_n else "PING_REPLY নেই"
            net["প্যাকেট_ড্রপ_শতাংশ"] = round((sent_n - recv_n) * 100 / sent_n, 1) if sent_n else None
            if avg:
                net["গড়_লেটেন্সি_ms"] = float(avg.group(1))
            net["স্ট্যাটাস"] = "PASS" if recv_n else "ALERT"
        else:
            net.update({"স্ট্যাটাস": "UNKNOWN", "কারণ": "ping output বোঝা যায়নি"})
    else:
        net.update({"স্ট্যাটাস": "UNKNOWN", "কারণ": ping_err or "ping কোনো output দেয়নি"})
    result["নেটওয়ার্ক_ড্রপ_ও_রুট_অ্যানালাইসিস"] = net

    issues = []
    if not ip_value:
        issues.append("Wi-Fi IP পড়া যায়নি")
    if net.get("স্ট্যাটাস") == "ALERT":
        issues.append("8.8.8.8 থেকে ping reply আসেনি")
    elif net.get("স্ট্যাটাস") == "UNKNOWN":
        issues.append("ইন্টারনেট পরীক্ষা নিশ্চিত করা যায়নি")
    if optical.get("অবস্থা") != "RESPONSE_RECEIVED — RX dBm NOT VERIFIED":
        issues.append("ONU RX optical power যাচাই হয়নি")
    result["সিস্টেম_স্ট্যাটাস"] = "সতর্কতা" if issues else "পরীক্ষা সম্পন্ন"
    result["এআই_টেকনিশিয়ান_মন্তব্য"] = (
        "যাচাইযোগ্য ফলাফল: " + ("; ".join(issues) if issues else "নির্বাচিত পরীক্ষাগুলো সম্পন্ন।")
        + " কোনো অনুপস্থিত telemetry অনুমান করে পূরণ করা হয়নি।"
    )
    return result


if __name__ == "__main__":
    args = sys.argv[1:]
    if "--demo" in args:
        print(json.dumps({"সিস্টেম_স্ট্যাটাস": "DEMO", "নোট": "এটি simulated data নয়; লাইভ পরীক্ষা চালাতে --demo বাদ দিন।"}, ensure_ascii=False, indent=2))
    else:
        values = [a for a in args if not a.startswith("--")]
        if values and len(values) < 4:
            print("ব্যবহার: python ai_noc_diagnostic.py <OLT_IP> <BRAND> <PORT> <ONU_ID>", file=sys.stderr)
            sys.exit(2)
        res = analyze_network(*values[:4]) if len(values) >= 4 else analyze_network()
        print(json.dumps(res, ensure_ascii=False, indent=2))
