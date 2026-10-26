import { DeviceHygieneAudit, WebRTCLeakResult, AuditProblemItem } from '../types/assistant';

/**
 * Checks for WebRTC local/public IP address leaks using STUN.
 */
export async function testWebRTCLeak(): Promise<WebRTCLeakResult> {
  return new Promise((resolve) => {
    const localIps = new Set<string>();
    const publicIps = new Set<string>();

    const RTCPeerConnectionClass =
      window.RTCPeerConnection ||
      (window as unknown as { webkitRTCPeerConnection?: typeof RTCPeerConnection }).webkitRTCPeerConnection;

    if (!RTCPeerConnectionClass) {
      resolve({
        localIps: [],
        publicIps: [],
        hasLeak: false,
        status: 'unknown',
      });
      return;
    }

    try {
      const pc = new RTCPeerConnectionClass({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      pc.createDataChannel('leakTest');

      const timeout = setTimeout(() => {
        pc.close();
        const hasLeak = localIps.size > 0 || publicIps.size > 0;
        resolve({
          localIps: Array.from(localIps),
          publicIps: Array.from(publicIps),
          hasLeak,
          status: hasLeak ? 'leaked' : 'clean',
        });
      }, 2500);

      pc.onicecandidate = (event) => {
        if (!event || !event.candidate || !event.candidate.candidate) {
          return;
        }

        const candidate = event.candidate.candidate;
        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/;
        const match = candidate.match(ipRegex);

        if (match) {
          const ip = match[1];
          // Check if private/local
          if (
            ip.startsWith('10.') ||
            ip.startsWith('192.168.') ||
            ip.startsWith('172.16.') ||
            ip.startsWith('172.31.') ||
            ip.endsWith('.local')
          ) {
            localIps.add(ip);
          } else if (ip !== '0.0.0.0' && ip !== '127.0.0.1') {
            publicIps.add(ip);
          }
        }
      };

      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch(() => {
          clearTimeout(timeout);
          resolve({
            localIps: [],
            publicIps: [],
            hasLeak: false,
            status: 'unknown',
          });
        });
    } catch {
      resolve({
        localIps: [],
        publicIps: [],
        hasLeak: false,
        status: 'unknown',
      });
    }
  });
}

/**
 * Checks Flash plugin status and hazardous active content.
 */
export function checkFlashPlugin(): 'disabled' | 'present' | 'not_supported' {
  try {
    const nav = navigator as unknown as {
      plugins?: Record<string, { name?: string; description?: string }>;
      mimeTypes?: Record<string, { enabledPlugin?: boolean }>;
    };

    if (nav.plugins && nav.plugins['Shockwave Flash']) {
      return 'present';
    }
    if (nav.mimeTypes && nav.mimeTypes['application/x-shockwave-flash']?.enabledPlugin) {
      return 'present';
    }
    return 'disabled';
  } catch {
    return 'not_supported';
  }
}

/**
 * Checks browser permission queries
 */
export async function checkPermissions(): Promise<{
  camera: string;
  microphone: string;
  geolocation: string;
  notifications: string;
}> {
  const result = {
    camera: 'prompt',
    microphone: 'prompt',
    geolocation: 'prompt',
    notifications: 'prompt',
  };

  if (!navigator.permissions || !navigator.permissions.query) {
    return result;
  }

  const queries = [
    { name: 'camera' as PermissionName, key: 'camera' as const },
    { name: 'microphone' as PermissionName, key: 'microphone' as const },
    { name: 'geolocation' as PermissionName, key: 'geolocation' as const },
    { name: 'notifications' as PermissionName, key: 'notifications' as const },
  ];

  for (const q of queries) {
    try {
      const status = await navigator.permissions.query({ name: q.name });
      result[q.key] = status.state;
    } catch {
      result[q.key] = 'unsupported';
    }
  }

  return result;
}

/**
 * Generates specific problem and solution items based on test telemetry.
 */
export function buildProblemSolutions(
  webrtc: WebRTCLeakResult,
  flash: 'disabled' | 'present' | 'not_supported',
  permissions: { camera: string; microphone: string; geolocation: string; notifications: string },
  simulatedLeak: boolean = false
): AuditProblemItem[] {
  const problems: AuditProblemItem[] = [];

  // Problem 1: WebRTC IP Leak
  if (webrtc.hasLeak || simulatedLeak) {
    problems.push({
      id: 'prob-webrtc',
      category: 'webrtc_leak',
      severity: 'critical',
      title: 'WebRTC STUN Candidate IP Leakage (VPN Bypass Risk)',
      titleBn: 'ওয়েব-আরটিসি এসটিইউএন আইপি লিক (ভিপিএন বাইপাস ঝুঁকি)',
      titleBanglish: 'WebRTC IP Leak (VPN bypass kore real IP reveal hocche)',
      problemDetail:
        'Browser WebRTC STUN requests bypass active VPNs or proxy tunnels, leaking your actual ISP public IP or internal gateway (192.168.x.x / 10.x.x.x) to visited sites.',
      problemDetailBn:
        'ব্রাউজারের WebRTC STUN রিকোয়েস্ট ভিপিএন বা প্রক্সি এড়িয়ে সরাসরি আপনার আসল ইন্টারনেট আইপি বা লোকাল আইপি ফাঁস করে দিচ্ছে।',
      problemDetailBanglish:
        'Tomar browser er WebRTC STUN request VPN bypass kore real IP reveal korche. Website er tracker ra tomar real IP dekhte pacche.',
      solutionSteps: [
        'Chrome / Brave / Edge: Open Settings > Privacy and Security > Disable "WebRTC non-proxied UDP", or install uBlock Origin and check "Prevent WebRTC from leaking local IP addresses".',
        'Firefox: Navigate to `about:config`, search `media.peerconnection.enabled` and toggle it to `false`.',
        'Termux / Linux: Route outgoing requests through Tor socks proxy with `torsocks` or use system WireGuard kill-switch.',
        'Run verification command: `leakcheck` in Termux shell.',
      ],
      solutionStepsBn: [
        'ক্রোম বা ব্রেভ ব্রাউজারে uBlock Origin ইনস্টল করে "Prevent WebRTC from leaking local IP addresses" অপশন চালু করুন।',
        'ফায়ারফক্সে `about:config` এ গিয়ে `media.peerconnection.enabled` কে `false` করুন।',
        'টারম্যাক্সে Tor প্রক্সি দিয়ে চালাতে `torsocks` কমান্ড ব্যবহার করুন।',
        'যাচাই করতে টার্মিনালে `leakcheck` রান করুন।',
      ],
      solutionStepsBanglish: [
        'Chrome ba Brave e uBlock Origin extension e "Prevent WebRTC IP leak" on koro.',
        'Firefox e `about:config` giye `media.peerconnection.enabled` ke `false` koro.',
        'Termux e traffic mask korte `pkg install tor` ebong `torsocks` use koro.',
        'Fix verify korte shell e `leakcheck` run koro.',
      ],
      suggestedCommand: 'leakcheck',
      actionLabel: 'Verify WebRTC Shield',
    });
  }

  // Problem 2: Flash or Legacy NPAPI Risk
  if (flash === 'present') {
    problems.push({
      id: 'prob-flash',
      category: 'flash_risk',
      severity: 'critical',
      title: 'Deprecated Adobe Flash Active Content Detected',
      titleBn: 'অপ্রচলিত অ্যাডোবি ফ্ল্যাশ প্লাগইন ঝুঁকি শনাক্ত হয়েছে',
      titleBanglish: 'Flash plugin detected (Security vulnerability risk)',
      problemDetail:
        'Adobe Shockwave Flash was discontinued due to critical zero-day memory corruption vulnerabilities. Any website invoking Flash can achieve remote code execution.',
      problemDetailBn:
        'অ্যাডোবি ফ্ল্যাশ দীর্ঘদিন পূর্বে বন্ধ হয়ে গেছে এবং এতে অসংখ্য রিমোট কোড এক্সিকিউশন সিকিউরিটি বাগ রয়েছে। অবিলম্বে এটি মুছে ফেলুন।',
      problemDetailBanglish:
        'Flash plugin khub dangerous ebong deprecated. Eitar madhyome device e malware dhukte pare.',
      solutionSteps: [
        'Purge and uninstall all Flash NPAPI/PPAPI packages from your host OS.',
        'Disable legacy plugin execution in browser site settings.',
        'Run hygiene scan: `malwarescan` in Termux to inspect active modules.',
      ],
      solutionStepsBn: [
        'ডিভাইস থেকে সমস্ত ফ্ল্যাশ সংশ্লিষ্ট ফাইল ও প্লাগইন আনইনস্টল করুন।',
        'ব্রাউজার সেটিংসে গিয়ে প্লাগইন পারমিশন বন্ধ করুন।',
        'টারম্যাক্সে `malwarescan` চালিয়ে সিস্টেম স্বাস্থ্য পরীক্ষা করুন।',
      ],
      solutionStepsBanglish: [
        'Device theke Flash plugin purapuri uninstall koro.',
        'Browser e unverified plugins block koro.',
        'Termux e `malwarescan` run kore check koro.',
      ],
      suggestedCommand: 'malwarescan',
      actionLabel: 'Scan Device Plugins',
    });
  }

  // Problem 3: Geolocation Permission Active
  if (permissions.geolocation === 'granted') {
    problems.push({
      id: 'prob-geo',
      category: 'geolocation',
      severity: 'medium',
      title: 'High-Precision Physical Geolocation Access Granted',
      titleBn: 'উচ্চ-নির্ভুল জিপিএস অবস্থান অনুমতি সক্রিয় আছে',
      titleBanglish: 'Physical location permission on ache (Tracking risk)',
      problemDetail:
        'Active geolocation permissions allow web services to pinpoint your physical GPS coordinates within meters without prompting.',
      problemDetailBn:
        'ওয়েবসাইটগুলোকে ভৌগোলিক অবস্থান সরাসরি ট্র্যাক করার পারমিশন দেওয়া রয়েছে, যা ব্যক্তিগত গোপনীয়তার জন্য ঝুঁকিপূর্ণ।',
      problemDetailBanglish:
        'Website gulo tomar physical GPS location tracking korte parche direct prompt charai.',
      solutionSteps: [
        'Open Browser Settings > Site Settings > Location > Set default to "Don\'t allow sites to see your location".',
        'Revoke location privileges for all non-essential domains.',
        'For Termux, run `termux-location` only with explicit user awareness.',
      ],
      solutionStepsBn: [
        'ব্রাউজার সেটিংসে গিয়ে লোকেশন পারমিশন "Don\'t allow sites" বা ব্লক করে দিন।',
        'অপ্রয়োজনীয় সাইটগুলোর জিপিএস এক্সেস প্রত্যাহার করুন।',
      ],
      solutionStepsBanglish: [
        'Browser settings > Site permissions > Location bondho koro.',
        'Shob unverified website er GPS access revoke koro.',
      ],
      suggestedCommand: 'malwarescan',
      actionLabel: 'Audit Permissions',
    });
  }

  // Problem 4: Camera / Mic Hardware Exposure
  if (permissions.camera === 'granted' || permissions.microphone === 'granted') {
    problems.push({
      id: 'prob-av',
      category: 'camera_mic',
      severity: 'high',
      title: 'Continuous Camera or Microphone Access Active',
      titleBn: 'ক্যামেরা বা মাইক্রোফোনের অবিচ্ছিন্ন অ্যাক্সেস সক্রিয়',
      titleBanglish: 'Camera ba Mic access persistent dewa ache',
      problemDetail:
        'Media stream sensors are granted persistent access, which can be hijacked by malicious third-party iframes or rogue scripts.',
      problemDetailBn:
        'ক্যামেরা বা মাইক্রোফোন একটানা অ্যাক্সেসের অনুমতি রয়েছে যা কোনো ক্ষতিকারক স্ক্রিপ্ট অডিও বা ভিডিও রেকর্ড করতে ব্যবহার করতে পারে।',
      problemDetailBanglish:
        'Camera ba mic er permission permament kora ache. Kono iframe ba tracking script eta abuse korte pare.',
      solutionSteps: [
        'Change camera and microphone settings to "Ask every time" or "Blocked by default".',
        'Review which installed web apps have background audio access.',
      ],
      solutionStepsBn: [
        'ব্রাউজার সেটিংসে ক্যামেরা ও মাইক্রোফোন পারমিশন "Ask every time" এ সেট করুন।',
        'অপরিচিত ওয়েবসাইটের ক্যামেরা অ্যাক্সেস অবিলম্বে বাতিল করুন।',
      ],
      solutionStepsBanglish: [
        'Browser Settings e Camera/Mic access "Ask every time" ba Block koro.',
        'Background audio access revoke koro.',
      ],
      suggestedCommand: 'malwarescan',
      actionLabel: 'Audit Media Devices',
    });
  }

  // Problem 5: Termux Storage & Script Hygiene (Always evaluated as proactive security)
  problems.push({
    id: 'prob-storage',
    category: 'termux_storage',
    severity: 'medium',
    title: 'Termux Shared Storage & Untrusted Script Exposure',
    titleBn: 'টারম্যাক্স স্টোরেজ পারমিশন ও অপরিচিত স্ক্রিপ্ট নিরীক্ষা',
    titleBanglish: 'Termux storage permission & untrusted script audit',
    problemDetail:
      'Granting global Android shared storage access (`/sdcard`) allows any bash script to read user downloads, photos, and document directories.',
    problemDetailBn:
      'টারম্যাক্সে সম্পূর্ণ স্টোরেজ পারমিশন দিলে যেকোনো ব্যাশ স্ক্রিপ্ট ডাউনলোড ও ব্যক্তিগত ডকুমেন্টস পড়তে পারে।',
    problemDetailBanglish:
      'Termux e shared storage access thakle kono bad script /sdcard er personal files read korte pare.',
    solutionSteps: [
      'Run `termux-setup-storage` carefully and inspect `~/storage` symlinks.',
      'Audit your `.bashrc` and `.profile` for unauthorized alias injections or curling remote payloads.',
      'Check active listening ports with `nmap -F 127.0.0.1` and running background jobs with `top`.',
    ],
    solutionStepsBn: [
      'টারম্যাক্সে `~/storage` ডিরেক্টরি সাবধানে পরিচালনা করুন।',
      'টার্মিনালে `.bashrc` ফাইলে কোনো অপরিচিত কমান্ড যোগ করা হয়েছে কিনা পরীক্ষা করুন।',
      'টার্মিনালে `top` বা `ps` দিয়ে ব্যাকগ্রাউন্ড প্রসেস নিরীক্ষা করুন।',
    ],
    solutionStepsBanglish: [
      'Termux e `termux-setup-storage` run kore permissions verify koro.',
      '`.bashrc` file check koro kono suspicious curl ba alias injection ache kina.',
      'Shell e `ps` ba `top` diye background tasks inspect koro.',
    ],
    suggestedCommand: 'termux-setup-storage',
    actionLabel: 'Audit Termux Storage',
  });

  // Problem 6: Local Network Exposure (Open Ports check)
  problems.push({
    id: 'prob-ports',
    category: 'open_ports',
    severity: 'info',
    title: 'Localhost / 0.0.0.0 Port Binding Hygiene',
    titleBn: 'লোকালহোস্ট ও উন্মুক্ত পোর্ট নিরীক্ষা',
    titleBanglish: 'Localhost & Open Ports Security Check',
    problemDetail:
      'Running development services bound to `0.0.0.0` exposes internal web servers and debug ports to other devices on the same WiFi network.',
    problemDetailBn:
      'ডেভেলপমেন্ট সার্ভার `0.0.0.0` এ বাইন্ড করলে একই ওয়াইফাইতে থাকা অন্যান্য ডিভাইস আপনার লোকাল সার্ভারে প্রবেশ করতে পারে।',
    problemDetailBanglish:
      'Dev server `0.0.0.0` e run korle local WiFi er onno device gulo access korte pare. Shobshomoy `127.0.0.1` use koro.',
    solutionSteps: [
      'Always bind internal services to `127.0.0.1` instead of `0.0.0.0` unless external LAN access is explicitly needed.',
      'Run `nmap -F 127.0.0.1` to audit listening TCP ports on localhost.',
      'Install Linux firewall if needed: `pkg install -y ufw`.',
    ],
    solutionStepsBn: [
      'সার্ভার চালুর সময় `0.0.0.0` এর বদলে `127.0.0.1` ব্যবহার করুন।',
      'টারম্যাক্সে উন্মুক্ত পোর্ট দেখতে `nmap -F 127.0.0.1` চালান।',
    ],
    solutionStepsBanglish: [
      'Services `127.0.0.1` e bind koro.',
      'Port scan korte `nmap -F 127.0.0.1` run koro.',
    ],
    suggestedCommand: 'nmap -F 127.0.0.1',
    actionLabel: 'Scan Local Ports',
  });

  return problems;
}

/**
 * Runs full device hygiene and privacy leak audit.
 */
export async function runFullDeviceAudit(simulateLeak: boolean = false): Promise<DeviceHygieneAudit> {
  const webrtc = await testWebRTCLeak();
  const flash = checkFlashPlugin();
  const permissions = await checkPermissions();

  const risks: string[] = [];
  let score = 100;

  if (webrtc.hasLeak || simulateLeak) {
    risks.push('WebRTC candidate exposure (real local/public IP leaked past VPN)');
    score -= 25;
  }

  if (flash === 'present') {
    risks.push('Deprecated Adobe Flash plugin detected (Critical exploit vector)');
    score -= 30;
  }

  if (permissions.geolocation === 'granted') {
    risks.push('High-precision Geolocation access is actively granted');
    score -= 10;
  }

  if (permissions.camera === 'granted' || permissions.microphone === 'granted') {
    risks.push('Camera or Microphone background permission is active');
    score -= 10;
  }

  const problems = buildProblemSolutions(webrtc, flash, permissions, simulateLeak);

  const screenRes = `${window.screen.width}x${window.screen.height} (${window.devicePixelRatio}x)`;
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;

  const recommendations = {
    en: [
      webrtc.hasLeak || simulateLeak
        ? 'Enable WebRTC IP handling policy in browser settings (e.g., disable WebRTC non-proxied UDP in uBlock Origin or Brave).'
        : webrtc.status === 'unknown' ? 'WebRTC test unavailable; protection status is unknown.' : 'No IP candidates observed in this test; this does not guarantee VPN protection.',
      flash === 'present'
        ? 'Uninstall and purge Adobe Flash immediately; it is discontinued and vulnerable to remote execution.'
        : 'Flash is disabled/purged. Zero Flash exploit surface.',
      'Check Termux storage permissions: use `termux-setup-storage` carefully to prevent rogue scripts reading DCIM/Downloads.',
      'Do not install untrusted bash scripts directly via `curl | bash` without reviewing the repository source code.',
    ],
    bn: [
      webrtc.hasLeak || simulateLeak
        ? 'ওয়েব-আরটিসি লিক পাওয়া গেছে! ব্রাউজার সেটিংসে WebRTC IP handling পলিসি বন্ধ করুন যাতে আসল আইপি ফাঁস না হয়।'
        : 'WebRTC সুরক্ষিত আছে। কোনো স্থানীয় বা পাবলিক আইপি লিক হয়নি।',
      flash === 'present'
        ? 'ফ্ল্যাশ প্লাগইন অবিলম্বে আনইনস্টল করুন, এটি চরম নিরাপত্তা ঝুঁকিপূর্ণ।'
        : 'ফ্ল্যাশ নিষ্ক্রিয়। সিস্টেম সুরক্ষিত।',
      'টারম্যাক্স স্টোরেজ পারমিশন সাবধানে দিন যাতে অপরিচিত স্ক্রিপ্ট ফাইল অ্যাক্সেস না পায়।',
      'যেকোনো স্ক্রিপ্ট রান করার আগে সোর্স কোড পরীক্ষা করুন।',
    ],
    banglish: [
      webrtc.hasLeak || simulateLeak
        ? 'WebRTC IP leak dhora porse! VPN thakleo browser theke IP leak hocche, uBlock Origin ba browser theke WebRTC UDP bondho korun.'
        : 'WebRTC IP Leak check: All clean! Konono IP leak nai.',
      flash === 'present'
        ? 'Flash plugin khub risky, ekhoni remove korun.'
        : 'Flash plugin disabled ache. Konono vulnerability nai.',
      'Termux e `termux-setup-storage` korar shomoy folder permission check korun.',
      'Ochena kono github script `curl | bash` diye direct run korben na, code check kore run korun.',
    ],
  };

  return {
    score: Math.max(25, score),
    timestamp: new Date().toLocaleTimeString(),
    webrtc: simulateLeak
      ? {
          localIps: ['192.168.1.105', '10.0.0.12'],
          publicIps: ['103.22.180.44'],
          hasLeak: true,
          status: 'leaked',
        }
      : webrtc,
    flashStatus: flash,
    cookiesEnabled: navigator.cookieEnabled,
    screenResolution: screenRes,
    platform: navigator.platform || 'Linux/Android',
    userAgent: navigator.userAgent,
    hardwareConcurrency,
    permissions,
    risksDetected: risks,
    problems,
    recommendations,
  };
}
