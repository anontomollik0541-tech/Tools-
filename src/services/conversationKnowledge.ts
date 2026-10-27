/**
 * Local Conversation AI Knowledge helpers for Tools-.
 *
 * - Browser-local knowledge notes and opt-in memory.
 * - Bangla/Banglish/English text cue hints.
 * - No network requests, microphone/call access, or command execution.
 * - Emotion labels are uncertain text cues, never mind-reading.
 */

export type KnowledgeNote = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
};

export type ApprovedMemory = {
  id: string;
  text: string;
  createdAt: number;
};

export type MessageAnalysis = {
  languageHint: 'bangla_or_mixed' | 'possible_banglish' | 'english_or_other';
  intentHints: string[];
  emotionCueHints: string[];
  disclaimer: string;
};

type StoredKnowledge = {
  version: 1;
  notes: KnowledgeNote[];
  memories: ApprovedMemory[];
};

const STORAGE_KEY = 'tools_conversation_ai_knowledge_v1';

const INTENT_CUES: Record<string, string[]> = {
  help: ['help', 'সাহায্য', 'কি করব', 'ki korbo'],
  explain: ['explain', 'মানে', 'bujhao', 'বুঝিয়ে', 'কীভাবে কাজ করে'],
  troubleshoot: ['error', 'problem', 'কাজ করছে না', 'হচ্ছে না', 'fix', 'সমাধান'],
  create: ['make', 'create', 'বানাও', 'তৈরি কর', 'add', 'যোগ কর'],
};

const EMOTION_CUES: Record<string, string[]> = {
  possibly_frustrated: ['angry', 'frustrated', 'annoyed', 'রাগ', 'বিরক্ত', 'ঝামেলা'],
  possibly_sad: ['sad', 'upset', 'মন খারাপ', 'কষ্ট', 'দুঃখ'],
  possibly_happy: ['happy', 'excited', 'খুশি', 'ভালো লাগছে', 'দারুণ'],
  possibly_anxious: ['worried', 'anxious', 'ভয়', 'চিন্তা হচ্ছে', 'টেনশন'],
};

function normalize(value: string): string {
  return String(value ?? '').trim().toLocaleLowerCase();
}

function readStore(): StoredKnowledge {
  if (typeof window === 'undefined') {
    return { version: 1, notes: [], memories: [] };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, notes: [], memories: [] };
    const parsed = JSON.parse(raw) as Partial<StoredKnowledge>;
    return {
      version: 1,
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      memories: Array.isArray(parsed.memories) ? parsed.memories : [],
    };
  } catch {
    return { version: 1, notes: [], memories: [] };
  }
}

function writeStore(store: StoredKnowledge): void {
  if (typeof window === 'undefined') {
    throw new Error('Local browser storage is unavailable in this environment.');
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function tokens(value: string): string[] {
  return normalize(value).match(/[\w\u0980-\u09FF]+/g)?.filter((word) => word.length > 1) ?? [];
}

export function analyseConversationMessage(message: string): MessageAnalysis {
  const text = normalize(message);
  const languageHint = /[\u0980-\u09FF]/.test(message)
    ? 'bangla_or_mixed'
    : /\b(ki|kano|korbo|hobe|ache|nai|bujhi|amar|tumi)\b/.test(text)
      ? 'possible_banglish'
      : 'english_or_other';

  return {
    languageHint,
    intentHints: Object.entries(INTENT_CUES)
      .filter(([, cues]) => cues.some((cue) => text.includes(normalize(cue))))
      .map(([label]) => label),
    emotionCueHints: Object.entries(EMOTION_CUES)
      .filter(([, cues]) => cues.some((cue) => text.includes(normalize(cue))))
      .map(([label]) => label),
    disclaimer:
      'Text-only hints may be wrong. They are not verified emotions, diagnoses, or access to private thoughts.',
  };
}

/** Save a knowledge note when the user explicitly chooses to add it. */
export function addKnowledgeNote(
  title: string,
  content: string,
  tags: string[] = [],
): KnowledgeNote {
  if (!title.trim() || !content.trim()) {
    throw new Error('A title and note content are required.');
  }
  const store = readStore();
  const note: KnowledgeNote = {
    id: globalThis.crypto?.randomUUID?.() ?? `note-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: title.trim(),
    content: content.trim(),
    tags: tags.map((tag) => tag.trim()).filter(Boolean),
    createdAt: Date.now(),
  };
  store.notes.push(note);
  writeStore(store);
  return note;
}

/** List saved knowledge notes stored only in this browser. */
export function listKnowledgeNotes(): KnowledgeNote[] {
  return [...readStore().notes].sort((a, b) => b.createdAt - a.createdAt);
}

/** Search locally saved notes. Results are source notes, not generated facts. */
export function searchKnowledge(query: string, limit = 5): Array<KnowledgeNote & { matchScore: number }> {
  const queryTokens = [...new Set(tokens(query))];
  if (!queryTokens.length) return [];

  return readStore().notes
    .map((note) => {
      const haystack = normalize(`${note.title} ${note.content} ${note.tags.join(' ')}`);
      return {
        ...note,
        matchScore: queryTokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0),
      };
    })
    .filter((note) => note.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, Math.max(1, Math.min(20, Math.floor(limit))));
}

/** Memory is opt-in: the caller must pass explicit confirmation. */
export function saveConversationMemory(text: string, userApproved: boolean): ApprovedMemory {
  if (!userApproved) throw new Error('Memory was not saved: explicit user approval is required.');
  if (!text.trim()) throw new Error('Memory text is required.');

  const store = readStore();
  const memory: ApprovedMemory = {
    id: globalThis.crypto?.randomUUID?.() ?? `memory-${Date.now()}`,
    text: text.trim(),
    createdAt: Date.now(),
  };
  store.memories.push(memory);
  writeStore(store);
  return memory;
}

export function listConversationMemories(): ApprovedMemory[] {
  return [...readStore().memories];
}

/** Clearing memory also requires explicit confirmation. */
export function clearConversationMemories(userApproved: boolean): number {
  if (!userApproved) throw new Error('Memory was not cleared: explicit user approval is required.');
  const store = readStore();
  const count = store.memories.length;
  store.memories = [];
  writeStore(store);
  return count;
}

/** Build a compact context packet for the existing chat engine to consume. */
export function buildConversationContext(message: string, maxNotes = 3) {
  const queryTokens = [...new Set(tokens(message))];
  const relevantMemories = readStore().memories
    .map((memory) => ({
      ...memory,
      matchScore: queryTokens.reduce(
        (score, token) => score + (normalize(memory.text).includes(token) ? 1 : 0),
        0,
      ),
    }))
    .filter((memory) => memory.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, Math.max(1, Math.min(5, Math.floor(maxNotes))));

  return {
    analysis: analyseConversationMessage(message),
    relevantKnowledge: searchKnowledge(message, maxNotes),
    relevantMemories,
    guidance:
      'Treat retrieved notes and memories as user-provided context, not guaranteed truth. If they do not answer the question, say so. Never claim to read minds or infer emotions with certainty.',
  };
}
