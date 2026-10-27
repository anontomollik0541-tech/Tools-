import importlib.util
import json
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location("diagnostic", "ai_noc_diagnostic.py")
diagnostic = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(diagnostic)


class DiagnosticTests(unittest.TestCase):
    @patch.object(diagnostic, "check_command", return_value=False)
    @patch.object(diagnostic, "run_cmd", return_value=("", "tool missing"))
    def test_missing_tools_keep_telemetry_unknown(self, _run, _check):
        result = diagnostic.analyze_network()
        self.assertEqual(result["ওএলটি_ফাইবার_টেলিমেট্রি"]["অবস্থা"], "NOT TESTED")
        self.assertEqual(result["ওয়াইফাই_ও_লোকাল_নেটওয়ার্ক"]["মোবাইল_আইপি"], "অজানা")
        json.dumps(result, ensure_ascii=False)

    @patch.object(diagnostic, "check_command", return_value=True)
    @patch.object(diagnostic, "run_cmd")
    def test_wifi_rssi_string_does_not_crash(self, run, _check):
        run.side_effect = [
            ('{"ip":"192.168.1.9","rssi":"-45","ssid":"test"}', None),
            ("", "ping unavailable"),
        ]
        result = diagnostic.analyze_network()
        wifi = result["ওয়াইফাই_ও_লোকাল_নেটওয়ার্ক"]
        self.assertEqual(wifi["সিগন্যাল_dBm"], "-45")
        self.assertNotIn("সিগন্যাল_মূল্যায়ন", wifi)
        self.assertEqual(wifi["স্ক্যান_স্ট্যাটাস"], "SKIPPED")

    @patch.object(diagnostic, "check_command", return_value=True)
    @patch.object(diagnostic, "run_cmd")
    def test_ping_packet_loss_output_is_parsed(self, run, _check):
        ping_output = "3 packets transmitted, 0 received, 100% packet loss"
        run.side_effect = [
            ('{"ip":"192.168.1.9","rssi":-45}', None),
            (ping_output, "ping exited with status 1"),
        ]
        result = diagnostic.analyze_network()
        net = result["নেটওয়ার্ক_ড্রপ_ও_রুট_অ্যানালাইসিস"]
        self.assertEqual(net["স্ট্যাটাস"], "ALERT")
        self.assertEqual(net["প্যাকেট_ড্রপ_শতাংশ"], 100.0)

    @patch.object(diagnostic, "check_command", return_value=True)
    @patch.object(diagnostic, "run_cmd")
    def test_ping_busybox_received_format(self, run, _check):
        ping_output = "3 packets transmitted, 2 packets received, 33% packet loss\nrtt min/avg/max = 1.0/2.0/3.0 ms"
        run.side_effect = [
            ('{"ip":"192.168.1.9","rssi":-45}', None),
            (ping_output, "ping exited with status 1"),
        ]
        result = diagnostic.analyze_network()
        net = result["নেটওয়ার্ক_ড্রপ_ও_রুট_অ্যানালাইসিস"]
        self.assertEqual(net["স্ট্যাটাস"], "PASS")
        self.assertEqual(net["প্যাকেট_ড্রপ_শতাংশ"], 33.3)
        self.assertEqual(net["গড়_লেটেন্সি_ms"], 2.0)


if __name__ == "__main__":
    unittest.main()
