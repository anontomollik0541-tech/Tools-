import { ChatMessage, SupportedLanguage, ToolItem, AutoDetectResult } from '../types/assistant';

export interface AnalysisResponse {
  text: string;
  suggestedCommand?: string;
  isErrorAnalysis?: boolean;
}

/**
 * Intelligent pattern analysis for pasted terminal logs and user questions.
 * Handles English, Bangla, and Banglish.
 */
export function analyzeUserInputOrLog(
  input: string,
  language: SupportedLanguage = 'en',
  activeTools: ToolItem[] = []
): AnalysisResponse {
  const lower = input.toLowerCase().trim();

  // 1. Detect pasted error logs from Termux / Linux commands
  if (
    lower.includes('command not found') ||
    lower.includes('not found') ||
    lower.includes('e: unable to locate package')
  ) {
    const pkgMatch = input.match(/(?:command\s+'([^']+)'\s+not\s+found|package\s+([a-zA-Z0-9_\-]+))/i);
    const missingPkg = pkgMatch ? pkgMatch[1] || pkgMatch[2] : 'nmap';

    if (language === 'bn') {
      return {
        text: `কমান্ডটি টারম্যাক্সে ইনস্টল নেই: "${missingPkg}"। এটি ঠিক করতে প্যাকেজ ম্যানেজার আপডেট করে ইনস্টল করুন।`,
        suggestedCommand: `pkg update && pkg install -y ${missingPkg}`,
        isErrorAnalysis: true,
      };
    } else if (language === 'banglish') {
      return {
        text: `Terminal e "${missingPkg}" command ta install kora nai. Package update kore install korle thik hobe:`,
        suggestedCommand: `pkg update && pkg install -y ${missingPkg}`,
        isErrorAnalysis: true,
      };
    } else {
      return {
        text: `Detected missing command: "${missingPkg}". In Termux/Linux environments, update your repository lists and install the binary package:`,
        suggestedCommand: `pkg update && pkg install -y ${missingPkg}`,
        isErrorAnalysis: true,
      };
    }
  }

  if (lower.includes('permission denied') || lower.includes('eacces') || lower.includes('operation not permitted')) {
    if (language === 'bn') {
      return {
        text: `পারমিশন ত্রুটি শনাক্ত হয়েছে। ফাইল এক্সিকিউশন অনুমতি বা টারম্যাক্স স্টোরেজ অ্যাক্সেস প্রয়োজন। নিচের কমান্ডটি দিয়ে অনুমতি দিন:`,
        suggestedCommand: `termux-setup-storage && chmod +x *`,
        isErrorAnalysis: true,
      };
    } else if (language === 'banglish') {
      return {
        text: `Permission denied error dhora porse! Termux storage access ba execute permission dorkar. Nicher command run koro:`,
        suggestedCommand: `termux-setup-storage && chmod +x *`,
        isErrorAnalysis: true,
      };
    } else {
      return {
        text: `Permission denied detected. Termux requires granting internal shared storage access and executable permissions on scripts:`,
        suggestedCommand: `termux-setup-storage && chmod +x *`,
        isErrorAnalysis: true,
      };
    }
  }

  if (
    lower.includes('could not resolve host') ||
    lower.includes('unknown host') ||
    lower.includes('name or service not known') ||
    lower.includes('dns_probe_finished_nxdomain')
  ) {
    if (language === 'bn') {
      return {
        text: `ডিএনএস সমস্যা: হোস্টের নাম সমাধান করা যায়নি। ক্লাউডফ্লেয়ার ডিএনএস (1.1.1.1) বা গুগল ডিএনএস দিয়ে কানেকশন যাচাই করুন:`,
        suggestedCommand: `dns google.com`,
        isErrorAnalysis: true,
      };
    } else if (language === 'banglish') {
      return {
        text: `DNS error: Domain ba host name resolve hocche na. Cloudflare DoH test kore dekho:`,
        suggestedCommand: `dns google.com`,
        isErrorAnalysis: true,
      };
    } else {
      return {
        text: `DNS Resolution failure detected. Query upstream DNS-over-HTTPS resolvers to verify domain records:`,
        suggestedCommand: `dns google.com`,
        isErrorAnalysis: true,
      };
    }
  }

  if (lower.includes('connection timed out') || lower.includes('network is unreachable') || lower.includes('100% packet loss')) {
    if (language === 'bn') {
      return {
        text: `নেটওয়ার্ক টাইমআউট শনাক্ত হয়েছে। প্যাকেট লস এবং ইন্টারনেট গেটওয়ে রেসপন্স যাচাই করার জন্য পিং চালান:`,
        suggestedCommand: `ping 1.1.1.1`,
        isErrorAnalysis: true,
      };
    } else if (language === 'banglish') {
      return {
        text: `Network timeout ba packet loss hocche! 1.1.1.1 e ping diye check koro connection thik ache kina:`,
        suggestedCommand: `ping 1.1.1.1`,
        isErrorAnalysis: true,
      };
    } else {
      return {
        text: `Network latency timeout / unreachable host detected. Run an ICMP latency probe to diagnose connection state:`,
        suggestedCommand: `ping 1.1.1.1`,
        isErrorAnalysis: true,
      };
    }
  }

  if (lower.includes('los alarm') || lower.includes('los_alarm') || lower.includes('rx_dbm: -3')) {
    if (language === 'bn') {
      return {
        text: `[অপটিক্যাল সতর্কতা] অপটিক্যাল ফাইবারে সিগন্যাল লস (LOS Alarm) শনাক্ত হয়েছে। ফাইবার কেবল ভাঁজ পড়েছে বা সংযোগ বিচ্ছিন্ন। অপটিক্যাল স্ট্যাটাস রান করুন:`,
        suggestedCommand: `optical`,
        isErrorAnalysis: true,
      };
    } else if (language === 'banglish') {
      return {
        text: `[Optical Fiber Alert] LOS alarm on ache! Fiber cable kata ba attenuate hoise. Optical check run koro:`,
        suggestedCommand: `optical`,
        isErrorAnalysis: true,
      };
    } else {
      return {
        text: `[Critical Fiber Alarm] Loss of Signal (LOS) detected on PON link. Verify fiber patch-cord physical integrity:`,
        suggestedCommand: `optical`,
        isErrorAnalysis: true,
      };
    }
  }

  // 1.5. Intent: Device Audit Problem & Solution queries (e.g. WebRTC leak, Flash, Permissions, Storage)
  if (
    lower.includes('webrtc') ||
    lower.includes('ip leak') ||
    lower.includes('আইপি লিক') ||
    lower.includes('device audit') ||
    lower.includes('hygiene') ||
    lower.includes('vulnerability') ||
    lower.includes('সমাধান') ||
    lower.includes('solution')
  ) {
    if (lower.includes('webrtc') || lower.includes('stun') || lower.includes('ip leak') || lower.includes('leak')) {
      if (language === 'bn') {
        return {
          text: `🛡️ [WebRTC IP Leak সমস্যা ও পূর্ণাঙ্গ সমাধান]\n\n` +
            `• কারণ: ব্রাউজারের WebRTC এসটিইউএন (STUN) রিকোয়েস্ট ভিপিএন চ্যানেল বাইপাস করে আপনার আসল আইএসপি আইপি বা লোকাল রাউটার আইপি (192.168.x.x) এক্সপোজ করে দিচ্ছে।\n\n` +
            `• সমাধান পদক্ষেপ:\n` +
            `  ১. Chrome / Brave ব্রাউজারে: uBlock Origin এক্সটেনশন ইনস্টল করে সেটিংসে "Prevent WebRTC from leaking local IP addresses" চালু করুন।\n` +
            `  ২. Firefox ব্রাউজারে: অ্যাড্রেস বারে 'about:config' লিখে 'media.peerconnection.enabled' খুঁজে বের করে 'false' করে দিন।\n` +
            `  ৩. Termux এ ট্র্যাফিক মাস্ক করতে: 'pkg install tor' করে 'torsocks' দিয়ে রান করুন।\n` +
            `  ৪. টার্মিনালে এখনই 'leakcheck' কমান্ডটি চালিয়ে লিক প্রটেকশন টেস্ট করুন:`,
          suggestedCommand: `leakcheck`,
          isErrorAnalysis: true,
        };
      } else if (language === 'banglish') {
        return {
          text: `🛡️ [WebRTC IP Leak Solution Suggestion]\n\n` +
            `• Karon: WebRTC STUN request VPN thaka shotteo bypass kore tomar real public IP & local IP expose kore felche.\n\n` +
            `• Kivabe solve korba:\n` +
            `  1. Chrome / Brave e uBlock Origin extension e "Prevent WebRTC from leaking local IP addresses" option check koro.\n` +
            `  2. Firefox e 'about:config' giye 'media.peerconnection.enabled' ke 'false' koro.\n` +
            `  3. Termux e traffic secure korte 'torsocks' use koro.\n` +
            `  4. Shell e 'leakcheck' command run kore verify koro:`,
          suggestedCommand: `leakcheck`,
          isErrorAnalysis: true,
        };
      } else {
        return {
          text: `🛡️ [WebRTC IP Leak Root Cause & Remediation Steps]\n\n` +
            `• Root Cause: WebRTC STUN requests send out-of-band UDP packets that bypass active VPN or SOCKS tunnels, directly leaking your true local gateway (192.168.x.x) or ISP public IP.\n\n` +
            `• Step-by-Step Fix:\n` +
            `  1. Chrome/Brave/Edge: Install uBlock Origin > Settings > Enable "Prevent WebRTC from leaking local IP addresses", or set WebRTC UDP policy to disable non-proxied UDP.\n` +
            `  2. Firefox: Navigate to 'about:config' > set 'media.peerconnection.enabled' to 'false'.\n` +
            `  3. Termux/Linux: Route traffic through Tor SOCKS5 using 'torsocks' or configure a strict WireGuard kill-switch.\n` +
            `  4. Verify with the following diagnostic command:`,
          suggestedCommand: `leakcheck`,
          isErrorAnalysis: true,
        };
      }
    }

    if (lower.includes('flash') || lower.includes('plugin') || lower.includes('malware') || lower.includes('virus')) {
      if (language === 'bn') {
        return {
          text: `🛡️ [ডিভাইস ম্যালওয়্যার ও ফ্ল্যাশ প্লাগইন সমাধান]\n\n` +
            `• কারণ: ফ্ল্যাশ প্লাগইন চরম নিরাপত্তা ঝুঁকিপূর্ণ এবং ২০২০ সালে আনুষ্ঠানিকভাবে বন্ধ হয়ে গেছে।\n` +
            `• সমাধান: অপারেটিং সিস্টেম ও ব্রাউজার থেকে সমস্ত NPAPI/Flash ফাইল অবিলম্বে আনইনস্টল করুন এবং টারম্যাক্সে 'malwarescan' রান করুন:`,
          suggestedCommand: `malwarescan`,
          isErrorAnalysis: true,
        };
      } else if (language === 'banglish') {
        return {
          text: `🛡️ [Flash & Malware Hygiene Solution]\n\n` +
            `• Karon: Adobe Flash discontinued ebong critical security exploits ache.\n` +
            `• Solution: Flash purge koro ebong Termux e 'malwarescan' run kore device permissions verify koro:`,
          suggestedCommand: `malwarescan`,
          isErrorAnalysis: true,
        };
      } else {
        return {
          text: `🛡️ [Plugin & Device Malware Hygiene Solution]\n\n` +
            `• Root Cause: Deprecated Flash plugins and unauthorized background processes introduce remote code execution risks.\n` +
            `• Solution: Purge legacy NPAPI modules, revoke background hardware permissions, and execute the device hygiene auditor:`,
          suggestedCommand: `malwarescan`,
          isErrorAnalysis: true,
        };
      }
    }
  }

  // 1.8. Intent: AI NOC Diagnostic Script (ai_noc_diagnostic.py) and Bangla Report Analysis
  if (
    lower.includes('ai_noc_diagnostic') ||
    lower.includes('ওএলটি_ফাইবার') ||
    lower.includes('অপটিক্যাল_পাওয়ার') ||
    lower.includes('noc_zone') ||
    lower.includes('noc diagnostic') ||
    lower.includes('ফাইবার পাওয়ার') ||
    lower.includes('onu power')
  ) {
    if (language === 'bn') {
      return {
        text: `📊 [AI NOC ডায়াগনস্টিকস অ্যানালাইসিস সম্পন্ন]\n\n` +
          `• অপটিক্যাল স্টেটাস: ONU পাওয়ার লেভেল ড্রপ করেছে (-২৬.২ dBm বা তার নিচে)।\n` +
          `• মূল কারণ: ফাইবার প্যাচ কর্ডে ধুলোবালি, স্প্লাইসিং লস বা স্প্লিটার আউটপুটে অতিরিক্ত অ্যাটেনুয়েশন।\n\n` +
          `• টেকনিশিয়ান অ্যাকশন প্ল্যান:\n` +
          `  ১. কাস্টমার প্রান্তের SC/UPC ফাইবার কানেক্টর অ্যালকোহল ওয়াইপ দিয়ে পরিষ্কার করুন।\n` +
          `  ২. টিজেবি (TJB) স্প্লিটার বক্সের ইনপুট/আউটপুট সিগন্যাল অপটিক্যাল পাওয়ার মিটার (OPM) দিয়ে যাচাই করুন।\n` +
          `  ৩. টার্মিনাল থেকে স্ক্রিপ্টটি পুনরায় রান করে পাওয়ার রিডিং আপডেট করুন:`,
        suggestedCommand: `python3 ai_noc_diagnostic.py 10.10.20.5 vsol 1 12`,
        isErrorAnalysis: true,
      };
    } else if (language === 'banglish') {
      return {
        text: `📊 [AI NOC Diagnostics Result Analysis]\n\n` +
          `• Optical Status: ONU Power level drop hoise (-26.2 dBm ba kom), jeta weak signal indicator.\n` +
          `• Problem: Fibre cable e bending ba patch cord e loss hocche.\n\n` +
          `• Next Steps:\n` +
          `  1. SC/UPC connector clean koro.\n` +
          `  2. Splitter box e input power OPM meter diye check koro.\n` +
          `  3. Termux theke ai_noc_diagnostic.py run kore update status dekho:`,
        suggestedCommand: `python3 ai_noc_diagnostic.py 10.10.20.5 vsol 1 12`,
        isErrorAnalysis: true,
      };
    } else {
      return {
        text: `📊 [AI NOC Telemetry Analysis & Technician Guidance]\n\n` +
          `• Optical Telemetry: ONU RX level dropped to marginal range (< -26.0 dBm).\n` +
          `• Root Cause: High optical attenuation on patch-cord, dirty SC connector, or excessive splitter loss.\n\n` +
          `• Remediation Plan:\n` +
          `  1. Inspect and clean SC/UPC ferrule at the subscriber optical drop.\n` +
          `  2. Verify distribution box (TJB) splitter loss with an optical power meter.\n` +
          `  3. Re-execute the automated diagnostic tool in Termux shell:`,
        suggestedCommand: `python3 ai_noc_diagnostic.py 10.10.20.5 vsol 1 12`,
        isErrorAnalysis: true,
      };
    }
  }

  // 2. Intent: User asking what tool to use / "ki doroner tools lagbe" / "ki korbo"
  if (
    lower.includes('tools lagbe') ||
    lower.includes('ki lagbe') ||
    lower.includes('ki korbo') ||
    lower.includes('what tools') ||
    lower.includes('which tool') ||
    lower.includes('suggest tool')
  ) {
    if (lower.includes('wifi') || lower.includes('slow') || lower.includes('speed')) {
      if (language === 'bn') {
        return {
          text: `ওয়াইফাই সমস্যা ও ইন্টারনেটের গতি পর্যবেক্ষণের জন্য:\n1. 'ping 1.1.1.1' দিয়ে লেটেন্সি ও ড্রপ চেক করুন।\n2. 'wifi' কমান্ড দিয়ে চ্যানেল ভিড় ও সিগন্যাল (SNR) দেখুন।`,
          suggestedCommand: `wifi`,
        };
      } else if (language === 'banglish') {
        return {
          text: `WiFi slow hole prothome:\n1. 'ping 1.1.1.1' diye ping check koro.\n2. 'wifi' command diye channel congestion ebong RSSI check koro.`,
          suggestedCommand: `wifi`,
        };
      } else {
        return {
          text: `For WiFi and network degradation troubleshooting:\n1. Run 'ping 1.1.1.1' to test packet jitter.\n2. Run 'wifi' to inspect RF spectrum, channel noise, and SNR.`,
          suggestedCommand: `wifi`,
        };
      }
    }

    if (lower.includes('website') || lower.includes('web') || lower.includes('site') || lower.includes('security')) {
      if (language === 'bn') {
        return {
          text: `ওয়েবসাইট ও সাইট সিকিউরিটি অডিটের জন্য:\n1. 'dns <ডোমেইন>' - ডিএনএস রেকর্ড দেখুন।\n2. 'curl -I <লিংক>' - সিকিউরিটি হেডার (HSTS, CSP) পরীক্ষা করুন।\n3. 'whois <ডোমেইন>' - ডোমেইন রেজিস্ট্রেশন দেখুন।`,
          suggestedCommand: `dns cloudflare.com`,
        };
      } else if (language === 'banglish') {
        return {
          text: `Website audit er jonno:\n1. 'dns <domain>' - DNS records check korte parbe.\n2. 'curl -I <url>' - HSTS, CSP security headers audit koro.\n3. 'whois <domain>' - WHOIS info paoa jabe.`,
          suggestedCommand: `dns cloudflare.com`,
        };
      } else {
        return {
          text: `For website & server auditing:\n1. 'dns <domain>' - inspect DoH records (A, MX, TXT).\n2. 'curl -I <url>' - inspect TLS and security headers.\n3. 'whois <domain>' - check registrar details.`,
          suggestedCommand: `dns cloudflare.com`,
        };
      }
    }

    if (lower.includes('leak') || lower.includes('malware') || lower.includes('virus') || lower.includes('device')) {
      if (language === 'bn') {
        return {
          text: `ডিভাইস সিকিউরিটি ও লিক পরীক্ষার জন্য:\n1. 'leakcheck' - WebRTC দিয়ে আসল আইপি লিক হচ্ছে কিনা দেখুন।\n2. 'malwarescan' - ক্ষতিকারক ফ্ল্যাশ প্লাগইন ও পারমিশন পরীক্ষা করুন।`,
          suggestedCommand: `leakcheck`,
        };
      } else if (language === 'banglish') {
        return {
          text: `Device leak ebong malware hygiene check korte:\n1. 'leakcheck' run koro (WebRTC IP leak test).\n2. 'malwarescan' run koro (Flash & permission audit).`,
          suggestedCommand: `leakcheck`,
        };
      } else {
        return {
          text: `For device & leak security auditing:\n1. 'leakcheck' - tests real WebRTC STUN candidate exposure.\n2. 'malwarescan' - audits browser permissions, Flash plugin risk, and tracking vectors.`,
          suggestedCommand: `leakcheck`,
        };
      }
    }

    // General tools suggestion
    const toolNames = activeTools.slice(0, 5).map(t => t.name).join(', ');
    if (language === 'bn') {
      return {
        text: `আপনার জন্য উপলব্ধ প্রধান টুলসমূহ: ${toolNames}। একসাথে সব টুল পরীক্ষা করতে 'autorun' চাপুন!`,
        suggestedCommand: `autorun`,
      };
    } else if (language === 'banglish') {
      return {
        text: `Available tools: ${toolNames}. Shobgula tool ekshathe test korte 'autorun' run koro!`,
        suggestedCommand: `autorun`,
      };
    } else {
      return {
        text: `Primary available diagnostic tools: ${toolNames}. You can execute 'autorun' to verify all tools in parallel!`,
        suggestedCommand: `autorun`,
      };
    }
  }

  // 3. User asking for next command specifically
  if (lower.includes('next command') || lower.includes('porer command') || lower.includes('next ki dibo')) {
    if (language === 'bn') {
      return {
        text: `সিস্টেমের সামগ্রিক স্ট্যাটাস দেখতে 'diagnose' অথবা সমস্ত টুল স্বয়ংক্রিয়ভাবে চালাতে 'autorun' ব্যবহার করুন:`,
        suggestedCommand: `diagnose`,
      };
    } else if (language === 'banglish') {
      return {
        text: `Next command hishabe 'diagnose' ba 'autorun' run korte paro shob snapshot check korar jonno:`,
        suggestedCommand: `diagnose`,
      };
    } else {
      return {
        text: `Recommended next command: execute 'diagnose' to classify faults or 'autorun' for automated cross-tool telemetry:`,
        suggestedCommand: `diagnose`,
      };
    }
  }

  // 4. Default conversational response
  if (language === 'bn') {
    return {
      text: `আমি আপনার টারম্যাক্স, নেটওয়ার্ক ও সিকিউরিটি সহকারী।\n• কোনো কমান্ডের আউটপুট কপি করে পেস্ট করলে আমি পরবর্তী কমান্ড বলে দেব।\n• কি টুল লাগবে তা জিজ্ঞেস করতে পারেন (যেমন: 'আমার ওয়াইফাই স্লো কি করব?')।\n• ডিভাইস বা আইপি লিক টেস্টের জন্য 'leakcheck' চালান।`,
      suggestedCommand: `autorun`,
    };
  } else if (language === 'banglish') {
    return {
      text: `Ami tomar Termux & Network AI Assistant.\n• Terminal er kono output ba error paste korle ami pore ki command dite hobe bolbo.\n• Kono issue thakle bolo (e.g. 'wifi slow ki korbo?', 'website security check').\n• Shob tools check korte 'autorun' run koro.`,
      suggestedCommand: `autorun`,
    };
  } else {
    return {
      text: `I am your Termux, Network & Security Assistant.\n• Paste any terminal execution output or error log here; I will analyze it and provide the exact next command.\n• Inquire about which tool to use for network, website, or social footprint analysis.\n• Execute 'autorun' to evaluate all tools with True/False telemetry.`,
      suggestedCommand: `autorun`,
    };
  }
}

/**
 * Builds an AI chat summary after automated tool run completes
 */
export function buildAutoDetectReportMessage(
  results: AutoDetectResult[],
  language: SupportedLanguage = 'en'
): ChatMessage {
  const trueCount = results.filter(r => r.isTrue).length;
  const falseCount = results.filter(r => !r.isTrue).length;

  let text = '';
  let suggestedCommand = 'diagnose';

  if (language === 'bn') {
    text = `📊 [অটো-ডিটেক্ট টুল রিপোর্ট সম্পন্ন]\n` +
      `মোট টুলস: ${results.length} | উত্তীর্ণ (TRUE): ${trueCount} | সতর্কতা (FALSE): ${falseCount}\n\n`;
    for (const res of results) {
      const icon = res.isTrue ? '✅ [TRUE / স্বাভাবিক]' : '⚠️ [FALSE / সমস্যা]';
      text += `${icon} ${res.name}: ${res.statusText}\n`;
    }
    if (falseCount > 0) {
      text += `\nপরামর্শ: চিহ্নিত সমস্যাগুলো বিশদভাবে দেখতে 'diagnose' চালান।`;
    } else {
      text += `\nসব টুল সফলভাবে উত্তীর্ণ হয়েছে! সিস্টেম সম্পূর্ণ সুরক্ষিত।`;
    }
  } else if (language === 'banglish') {
    text = `📊 [Auto Detect Tools Result]\n` +
      `Total Tools: ${results.length} | Pass (TRUE): ${trueCount} | Issue (FALSE): ${falseCount}\n\n`;
    for (const res of results) {
      const icon = res.isTrue ? '✅ [TRUE / Pass]' : '⚠️ [FALSE / Attention]';
      text += `${icon} ${res.name}: ${res.statusText}\n`;
    }
    if (falseCount > 0) {
      text += `\nSuggestion: False thaka tool gulo fix korte 'diagnose' ba suggested command run koro.`;
    } else {
      text += `\nShob tool pass hoise! Konono leak ba network issue nai.`;
    }
  } else {
    text = `📊 [Automated Tools Telemetry Report]\n` +
      `Total Tools Evaluated: ${results.length} | PASS (TRUE): ${trueCount} | ANOMALIES (FALSE): ${falseCount}\n\n`;
    for (const res of results) {
      const icon = res.isTrue ? '✅ [TRUE / NOMINAL]' : '⚠️ [FALSE / ALERT]';
      text += `${icon} ${res.name}: ${res.statusText}\n`;
    }
    if (falseCount > 0) {
      text += `\nRecommendation: Run 'diagnose' or 'report' to generate root-cause remediation steps.`;
    } else {
      text += `\nAll evaluated telemetry is nominal and secure. Zero leaks detected.`;
    }
  }

  return {
    id: `auto-${Date.now()}`,
    sender: 'ai',
    text,
    timestamp: new Date().toLocaleTimeString(),
    language,
    suggestedCommand,
  };
}
