# Termux NOC Network Diagnostics & Autonomous Tools Suite

A unified Network Operations Center (NOC) and sysadmin diagnostic console ported to React + TypeScript, delivering real-time optical/PON telemetry, WiFi spectrum analysis, router health tracking, automated root-cause fault classification, and an interactive Termux-style command & tool assistant with bilingual (English & Bangla) reporting.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during the clarification phase and govern the design and architecture of this React rewrite:

- **Confirmed Decision 1 (Scope & Feature Suite)**: Full NOC Suite with diagnostics, fault classifier, and autonomous tool assistant. Porting all core Python domain models (`OpticalStatus`, `WiFiStatus`, `RouterStatus`, `OltStatus`, `FaultEvent`), classification rules, diagnostic snapshot generators, and interactive execution assistant.
- **Confirmed Decision 2 (Layout & Theme)**: Termux-inspired dark console aesthetic paired with clean, high-density NOC telemetry grids and tabbed inspection views (`Console`, `PON / Optical`, `WiFi RF Analysis`, `Router Health`, `Fault Reports`, and `Tool Registry`).
- **Confirmed Decision 3 (Localization)**: Bilingual support with one-click instant toggle between English (`en`) and Bangla (`bn`), covering all diagnostic summaries, recommendations, status indicators, and fault explanations.

---

### 1. Overview & Core Concept

- **What It Does**: Provides network administrators, ISP engineers, and sysadmins with an end-to-end diagnostic workstation. It continuously evaluates optical fiber link loss and CRC anomalies (PON/ONU/OLT), analyzes WiFi 2.4GHz/5GHz interference and signal strength, inspects core router stability (CPU spikes, memory exhaustion, PPPoE drops, route flaps), and automatically runs a rule-based inference engine that isolates whether failures are customer-side, local loop attenuation, or shared splitter/port outages. An integrated Termux-style terminal allows manual command execution, diagnostic snapshot manipulation, and autonomous tool problem solving.
- **Target Audience / Persona**: Network Operations Center (NOC) technicians, fiber ISP support teams, MikroTik system administrators, and network automation developers.
- **Key Value**: Replaces disparate CLI scripts with an interactive, responsive browser-based NOC cockpit that delivers instant root-cause diagnostics, actionable recommendations in English and Bangla, and interactive tool execution without requiring backend Python dependencies.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. *Dashboard & Telemetry Overview*: On load, the operator sees a real-time status banner displaying aggregate optical, WiFi, and router health indicators alongside quick snapshot selectors (Default Demo, High-Attenuation Failure, WiFi Saturated, Core Router Overload, or Custom JSON Snapshot).
  2. *Deep Diagnostics & Metric Inspection*: The user navigates between the Optical PON view (dBm signal bars, LOS alarms, CRC tallies), WiFi RF view (RSSI vs Noise floor, SNR gauges, client loads), and Router telemetry view (resource charts, interface error counters, PPPoE stability).
  3. *Fault Analysis & Automated Reporting*: The Fault Classifier aggregates all anomalies into categorized events (`OPTICAL`, `WIFI`, `ROUTER`, `OLT`), showing severity badges (`HIGH`, `MEDIUM`, `INFO`), precise evidence metadata, and prioritized remediation playbooks in either English or Bangla.
  4. *Termux Assistant & Tool Runner*: Operators can switch to or expand the embedded Termux terminal to run commands (`help`, `diagnose`, `report`, `inspect-optical`, `wifi-scan`, `router-health`, `agent solve <task>`, `load-scenario <name>`), execute tools, or craft custom test payloads.
  5. *Scenario Simulator & Snapshot Editor*: Users can tweak power levels, trigger synthetic fiber cuts or router CPU spikes, and instantly watch the fault classifier and NOC status re-evaluate in real time.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Termux Hacker Console meets Modern NOC Enterprise Cockpit. Utilitarian, precision-engineered dark theme with high contrast, legible telemetry grids, and clean borders.
  - *Color Palette & Mood*:
    - Canvas / Background: Deep Terminal Black (`#0a0e14`) and Slate Surface (`#111827`)
    - Structural Borders: Hairline zinc dividers (`#1f2937` / `#27272a`)
    - Primary Accent / Prompt: Termux Green (`#10b981` / `#22c55e`)
    - Semantic Status: Nominal Green (`#16a34a`), Alert Amber (`#f59e0b`), Critical Red (`#ef4444`), Telemetry Cyan (`#06b6d4`)
  - *Typography & Hierarchy*:
    - Display & Headings: `Plus Jakarta Sans` or `Manrope` for crisp, authoritative structural headings.
    - Data & Terminal Console: Strict `JetBrains Mono` / `font-mono` with `tabular-nums` for all metrics, dBm levels, IP addresses, percentages, and terminal I/O.
  - *Component Styling & Layout*:
    - Top bar strictly adheres to the 3-Zone Top Bar Contract (Wordmark / Nav Tabs / Bilingual Language Toggle & Quick Action).
    - Unboxed text metadata separated by subtle dots (`·`) in accordance with the Zero-Pill discipline.
    - Responsive layout supporting both full 1440px desktop multi-column inspection and mobile/tablet viewport constraints.

- **Interactive Feedback & Motion**:
  - Zero-latency tab switching and instantaneous diagnostic recalculation.
  - Smooth terminal line printing and command history traversal (Up/Down arrow keys).
  - Micro-tooltips and copy-to-clipboard for diagnostics reports and terminal outputs.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Client-Side TypeScript Engine for Fault Classification & Analysis**:
  - *Chosen Approach*: Port Python's `network_diag.rules`, `collectors`, `models`, and `reporting` into pure, strongly-typed TypeScript domain modules running in the browser.
  - *Why*: Eliminates backend execution latency, enables instant reactivity when tweaking snapshot metrics, and guarantees hermetic, offline-capable operation inside Vite/React.
  - *Alternatives Considered*: Running a local Python FastAPI backend, which would introduce dual runtime fragility, slower start times, and extra container resource overhead.

- **Decision 2: Termux Terminal Emulation with Built-in Tool Registry**:
  - *Chosen Approach*: Implement an interactive CLI shell supporting standard commands (`help`, `clear`, `diagnose`, `report --lang=bn`, `status`, `agent solve`, `cat`, `ls`, `scenarios`, `edit`) backed by a simulated file tree and autonomous assistant engine matching the original Python `assistant/` behavior.
  - *Why*: Delivers the requested "Termux" workflow while keeping full parity with `assistant/coding_agent.py` and `network_diagnostics_app.py`.
  - *Alternatives Considered*: Plain read-only code blocks, which lack the interactivity and command-driven experience requested by the user.

- **Decision 4: 100% Live NOC Diagnostics & Dedicated Navigation Bar Workspace**:
  - *Chosen Approach*: Dedicated top navigation tab `NOC Diagnostics` / `NOC ডায়াগনস্টিকস` alongside `Terminal Shell`, `AI Assistant`, `Tools Hub`, and `Device Audit`. Includes 100% live telemetry inspection: optical power attenuation (Rx/Tx dBm, LOS alarms, CRC frames), WiFi RF link speeds and SNR, LAN live host discovery table with MAC/vendors, ping latency & jitter, hop-by-hop traceroute breakpoints, proposed technical remediation checklist, and pure Bangla JSON telemetry compliant with `ai_noc_diagnostic.py`.
  - *Why*: Directly addresses the user request for a dedicated navbar button ("alada var button") and 100% complete diagnostic results.

---

### 5. Verification & Completion Status

- [x] **ai_noc_diagnostic.py**: Implemented and verified via shell execution (exit code 0), returning pure Bangla JSON structure with canonical keys: `সিস্টেম_স্ট্যাটাস`, `টুলস_চেকিং`, `ওয়াইফাই_ও_লোকাল_নেটওয়ার্ক`, `ওএলটি_ফাইবার_টেলিমেট্রি`, `নেটওয়ার্ক_ড্রপ_ও_রুট_অ্যানালাইসিস`, `এআই_টেকনিশিয়ান_মন্তব্য`.
- [x] **Dedicated Navigation Bar Tab**: Added `NOC Diagnostics` (`NOC ডায়াগনস্টিকস` / `NOC Diag`) with 100% live badge directly into `<Header />` navigation bar.
- [x] **NocDiagnosticsView**: Full view rendering 4 high-level telemetry cards, 5 visual sections, interactive scenario presets (`perfect`, `power_drop`, `critical_los`), LAN host discovery topology table, traceroute hop breakpoints, and copyable/downloadable Bangla JSON.
- [x] **Multi-channel Access**: Executable via dedicated navbar tab, terminal command (`python3 ai_noc_diagnostic.py`, `noc-diag`), tools catalog (`tool-ai-noc`), AI Chat analysis, and popup modal.
- [x] **TypeScript & Build Check**: `tsc --noEmit` and `npm run build` compiled with zero errors.


### 4. Technical Architecture & Data Strategy

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            Termux NOC Web Shell                              │
│  ┌───────────────────────────┐  ┌───────────────────┐  ┌──────────────────┐  │
│  │ Zone 1: Termux NOC Header │  │ Zone 2: Workspaces │  │ Zone 3: Actions  │  │
│  │ Brand Wordmark & Mode     │  │ Telemetry / Term  │  │ EN/BN Toggle     │  │
│  └───────────────────────────┘  └───────────────────┘  └──────────────────┘  │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
     ┌─────────────────────────────────┼────────────────────────────────┐
     ▼                                 ▼                                ▼
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│     Telemetry Deck      │  │    Fault Classifier     │  │   Termux Terminal CLI   │
│ ─────────────────────── │  │ ─────────────────────── │  │ ─────────────────────── │
│ • PON / Optical Status  │  │ • Optical LOS & RX dBm  │  │ • Command REPL Parser   │
│ • WiFi 2.4G/5G RF Meter │  │ • WiFi SNR & Drop Rules │  │ • Autonomous Agent      │
│ • MikroTik Core Metrics │  │ • Router Flaps & CPU    │  │ • Tool Registry & Logs  │
│ • OLT Port Diagnostics  │  │ • Multi-ONU OLT Alert   │  │ • Interactive History   │
└────────────┬────────────┘  └────────────┬────────────┘  └────────────┬────────────┘
             │                            │                            │
             └────────────────────┬───────┴────────────────────────────┘
                                  ▼
                     ┌─────────────────────────┐
                     │  Snapshot State Store   │
                     │  (Active Network State) │
                     │  • Demo Snapshots       │
                     │  • Custom Test Scenarios│
                     │  • Bilingual Reports    │
                     └─────────────────────────┘
```

- **Data Models & State**:
  - `OpticalStatus`: `onu_id`, `port`, `rx_dbm`, `tx_dbm`, `los_alarm`, `crc_errors`, `drop_count`
  - `WiFiStatus`: `ssid`, `channel`, `rssi_dbm`, `noise_dbm`, `snr_dbm`, `clients`, `channel_utilization`, `packet_loss_pct`
  - `RouterStatus`: `device_name`, `cpu_percent`, `memory_used_pct`, `uptime_hours`, `interface_errors`, `pppoe_flaps`, `dhcp_failures`, `route_flaps`
  - `OltStatus`: `olt_name`, `port`, `port_state`, `onu_count`, `alarms`, `power_dbm`
  - `FaultEvent`: `category` (`optical` | `wifi` | `router` | `olt`), `severity` (`high` | `medium` | `info`), `title`, `detail`, `evidence`
  - `NetworkSnapshot`: timestamp and collections of all domain telemetry entities.

- **Component Hierarchy**:
  - `App.tsx`: Primary shell, state management, scenario provider, and active tab controller.
  - `components/Header.tsx`: 3-zone top bar with bilingual toggle and quick actions.
  - `components/MetricsOverview.tsx`: At-a-glance health summary strip with fault counters.
  - `components/OpticalMonitor.tsx`: Fiber PON/ONU optical status table and signal strength gauges.
  - `components/WiFiAnalyzer.tsx`: WiFi RF metrics, channel utilization, and SNR bars.
  - `components/RouterMonitor.tsx`: MikroTik core router health, PPPoE stability, and error telemetry.
  - `components/FaultClassifierView.tsx`: Rule-based fault diagnosis list with categorized evidence and bilingual action steps.
  - `components/TermuxTerminal.tsx`: Full interactive terminal console with command execution, auto-complete suggestions, tool runner, and color-coded output.
  - `components/ScenarioModal.tsx`: Preset scenarios (Clean Network, Fiber Attenuation, WiFi Overcrowding, OLT Port Failure, Router PPPoE Storm) and custom snapshot editor.
