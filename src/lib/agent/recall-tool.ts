import type { AgentTool } from "@earendil-works/pi-agent-core";
import { Type } from "typebox";
import { transcriptText } from "@/lib/conversations/memory";
import type { CopilotUser } from "@/lib/conversations/identity";
import type { UserConversations } from "@/lib/conversations/store";

const MAX_TEXT = 4000;

const RecallParams = Type.Object({
  text: Type.Optional(
    Type.String({ description: 'Words to look for in the user\'s earlier questions, answers, wells, areas and record IDs, e.g. "WELL-0001" or "downtime". Omit for the most recent ones' }),
  ),
  conversation_id: Type.Optional(Type.String({ description: "Read one earlier conversation back (its questions and answers) by the ID a previous result gave" })),
});

/**
 * Searches the current user's own earlier conversations. It is built from a
 * user-bound history handle, so it has no way to read anyone else's.
 */
export function recallMyConversationsTool(
  user: CopilotUser,
  history: UserConversations,
  currentConversationId: string,
): AgentTool<typeof RecallParams> {
  return {
    name: "recall_my_conversations",
    label: "Recall my conversations",
    description: `Look up ${user.name}'s own earlier conversations with you, for references such as "the wells we discussed yesterday" or "what you told me last time". Only this user's history is searched: nobody else's is ever available. Give text to search, or omit it for the most recent answers; each hit has the question, the wells, areas and record IDs the answer named, a one-line summary and the conversation ID. Use conversation_id to read one conversation back. When nothing matches, say plainly that you have no such earlier conversation with ${user.name}; never guess and never describe anyone else's conversations.`,
    parameters: RecallParams,
    execute: async (_toolCallId, params) => {
      let result: unknown;
      if (params.conversation_id) {
        const conversation = history.get(params.conversation_id);
        result = conversation
          ? {
              conversation: { id: conversation.id, title: conversation.title, startedAt: conversation.createdAt },
              messages: transcriptText(conversation.transcript).map((m) => ({ role: m.role, text: m.text.slice(0, MAX_TEXT) })),
            }
          : { error: `${user.name} has no earlier conversation ${params.conversation_id}.` };
      } else {
        const options = { excludeConversationId: currentConversationId };
        const entries = params.text?.trim() ? history.searchDigest(params.text, options) : history.recentDigest(options);
        result = {
          user: user.name,
          entries,
          ...(entries.length === 0 && { note: `${user.name} has no earlier conversation that matches. Say so plainly.` }),
        };
      }
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], details: undefined };
    },
  };
}
