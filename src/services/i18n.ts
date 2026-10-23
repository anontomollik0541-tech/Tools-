import { Language } from '../types/network';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    title: 'Network Diagnostics App',
    report_title: 'Network Diagnostics Report',
    optical_faults: 'Optical faults',
    wifi_faults: 'WiFi faults',
    router_faults: 'Router faults',
    olt_faults: 'OLT faults',
    no_faults: 'No critical faults detected in the current snapshot.',
    recommended_action: 'Recommended action',
    optical_action: 'Inspect fiber connectors, clean patch panels, check splitter, verify OLT port optical levels, and test the line for attenuation.',
    wifi_action: 'Check RSSI/SNR trends, relocate access point, inspect interference, change channels, and verify client load.',
    router_action: 'Review CPU, interfaces, PPPoE session stability, DHCP health, and router logs; check for overload or failing link states.',
    olt_action: 'Check the shared OLT port, splitter, and service map; isolate whether the issue is port-level or ONU-local.',
    nominal: 'Nominal',
    critical: 'Critical',
    warning: 'Warning',
    status: 'System Status',
    terminal: 'Termux Terminal',
    metrics: 'NOC Telemetry',
    scenarios: 'Test Scenarios',
  },
  bn: {
    title: 'নেটওয়ার্ক ডায়াগনস্টিকস অ্যাপ',
    report_title: 'নেটওয়ার্ক ডায়াগনস্টিকস রিপোর্ট',
    optical_faults: 'অপটিক্যাল ত্রুটি',
    wifi_faults: 'ওয়াইফাই সমস্যা',
    router_faults: 'রাউটার সমস্যা',
    olt_faults: 'ওএলটি ত্রুটি',
    no_faults: 'বর্তমান স্ন্যাপশটে কোনো গুরুতর ত্রুটি পাওয়া যায়নি।',
    recommended_action: 'প্রস্তাবিত পদক্ষেপ',
    optical_action: 'ফাইবার কানেক্টর পরীক্ষা করুন, প্যাচ প্যানেল পরিষ্কার করুন, স্প্লিটার পরীক্ষা করুন, OLT পোর্টের অপটিক্যাল লেভেল যাচাই করুন এবং লাইনটি অ্যাটেনুয়েশন জন্য পরীক্ষা করুন।',
    wifi_action: 'RSSI/SNR ট্রেন্ড পরীক্ষা করুন, অ্যাক্সেস পয়েন্ট স্থানান্তর করুন, হস্তক্ষেপ পরীক্ষা করুন, চ্যানেল পরিবর্তন করুন এবং ক্লায়েন্ট লোড যাচাই করুন।',
    router_action: 'CPU, ইন্টারফেস, PPPoE সেশন স্থিতিশীলতা, DHCP স্বাস্থ্য এবং রাউটার লগ পর্যালোচনা করুন; ওভারলোড বা ব্যর্থ লিংক স্টেট পরীক্ষা করুন।',
    olt_action: 'শেয়ার করা OLT পোর্ট, স্প্লিটার এবং সার্ভিস ম্যাপ পরীক্ষা করুন; নির্ধারণ করুন সমস্যা পোর্ট-ভিত্তিক নাকি ONU-লোকাল।',
    nominal: 'স্বাভাবিক',
    critical: 'সংকটপূর্ণ',
    warning: 'সতর্কতা',
    status: 'সিস্টেম স্ট্যাটাস',
    terminal: 'টারমাক্স টার্মিনাল',
    metrics: 'এনওসি টেলিমেট্রি',
    scenarios: 'টেস্ট সিনারিও',
  },
};

export function t(key: string, language: Language = 'en'): string {
  return TRANSLATIONS[language]?.[key] ?? TRANSLATIONS['en'][key] ?? key;
}
