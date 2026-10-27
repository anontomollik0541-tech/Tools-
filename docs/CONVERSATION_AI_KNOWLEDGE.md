# Conversation AI Knowledge (new module)

Branch: `feature/conversation-ai-knowledge`

## Added file
- `src/services/conversationKnowledge.ts`: browser-local knowledge notes, lexical search, explicit opt-in memory, multilingual intent/emotion-cue hints, and a compact context packet.

## Privacy and limits
- Data stays in this browser's `localStorage`; it is not sent to a server by this module.
- The user must explicitly choose to add notes.
- Memory save and clear functions require an explicit `userApproved` boolean.
- No command is executed and no microphone, SIM, or call audio is accessed.
- Emotion/intent detection is heuristic and may be wrong. This is not mind-reading.

## Integration point
The current `src/App.tsx` chat path calls `analyzeUserInputOrLog(text, language, tools)` in `src/services/aiEngine.ts`. This module is intentionally standalone and does not change the existing chat flow. To activate it, add a user-facing Knowledge/Memory panel and merge `buildConversationContext(text)` into the chat analysis path after reviewing the current UI and privacy requirements.

## Quick usage
```ts
import {
  addKnowledgeNote,
  buildConversationContext,
  saveConversationMemory,
} from './services/conversationKnowledge';

addKnowledgeNote('Router notes', 'My router model is ...', ['network']);
const context = buildConversationContext('router issue');
// Save only after the user confirms:
saveConversationMemory('User-approved preference', true);
```

## Verification
This repository uses TypeScript/Vite. After adding the module to the working tree, run:
- `npm run lint`
- `npm run build`

The module has no new dependencies. It has not yet been wired into the visible dashboard or chat response pipeline.
