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

## Integration
The feature is wired into the current chat UI and response path:
- Open **Knowledge / Memory** in the chat header to add a local knowledge note or manage opt-in memories.
- Notes and memories are saved to this browser's `localStorage`.
- A saved note or approved memory is appended to the existing rule-based response only when its text matches the current query.
- Memory save requires checking the explicit approval box; clearing all memories requires a confirmation prompt.
- Clearing chat history does not clear saved Knowledge or Memory.

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
This repository uses TypeScript/Vite. GitHub Actions runs the branch type-check and production build. Confirm the **Branch build verification** workflow passes before merging. The module adds no dependencies.

## Limits
The current response engine remains rule-based. This feature retrieves matching saved context; it does not turn the application into a hosted or local large language model. Emotion and intent cues are heuristic and may be wrong.
