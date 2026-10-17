# 08: Users and private memory

**What to build:** A user picks who they are from the fleet's users and sees only their own conversations, which they can resume.
- **Q11:** Michael Turner asks Q6. In a new chat, "the three wells we discussed yesterday" resolves to WELL-0121, WELL-0138 and WELL-0107, and he gets this year's repair costs.
- **Q16, second part:** Jessica Reed asks the same thing and is told she has no such earlier conversation. Michael Turner's history is never used.

This delivers the Conversation Store, the user picker, the per-user digest in new chats, and the `recall_my_conversations` tool.

**Blocked by:** 03 — Whole fleet

**Status:** ready-for-agent

- [ ] A user picker in the header lists the users from the fleet file (name and role); the selected user is the identity in every request and in the system prompt
- [ ] Conversations persist durably per user: title, model, Pi transcript, created and updated times. The sidebar lists only the selected user's conversations, and selecting one resumes it
- [ ] After each answer, a digest entry stores the question, the wells, areas and record IDs named in the answer, and a one-line summary
- [ ] A new conversation's system prompt includes the selected user's recent digest, newest first. "Yesterday" means the user's previous conversations
- [ ] `recall_my_conversations` searches only the current user's history; no code path reads another user's conversations
- [ ] In the UI, Q11 and the second part of Q16 behave as the example answers describe
