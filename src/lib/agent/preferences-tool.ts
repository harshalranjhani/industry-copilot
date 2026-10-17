import type { AgentTool } from "@earendil-works/pi-agent-core";
import { Type } from "typebox";
import type { CopilotUser } from "@/lib/conversations/identity";
import type { UserConversations } from "@/lib/conversations/store";

const PreferencesParams = Type.Object({
  action: Type.Union([Type.Literal("save"), Type.Literal("remove"), Type.Literal("list")], {
    description: "save a new standing preference, remove one by ID, or list them",
  }),
  text: Type.Optional(
    Type.String({ description: 'save: the preference in the user\'s words, as a rule, e.g. "Draw wellhead temperature in red and air temperature in blue"' }),
  ),
  preference_id: Type.Optional(Type.String({ description: 'remove: the ID to drop, e.g. "PREF-3"' })),
  replaces: Type.Optional(Type.String({ description: "save: the ID of an older preference this one replaces (it is removed)" })),
});

/**
 * The current user's standing presentation preferences (chart colours and types,
 * map style, units, level of detail). Built from a user-bound history handle, so
 * it can never read or change anyone else's.
 */
export function myPreferencesTool(user: CopilotUser, history: UserConversations): AgentTool<typeof PreferencesParams> {
  return {
    name: "my_preferences",
    label: "My preferences",
    description: `Save, remove or list ${user.name}'s own standing preferences for how answers look: chart colours, chart types and orientation, map basemap and pin colours, units, level of detail. Save one when the user says how they want answers from now on ("always", "from now on", "I prefer"); a one-off request ("make this one red") is not a preference. Preferences are private to ${user.name} and apply to their later answers only. Facts about wells, readings or rules are not preferences: record those with record_knowledge.`,
    parameters: PreferencesParams,
    executionMode: "sequential",
    execute: async (_toolCallId, params) => {
      let result: unknown;
      if (params.action === "save") {
        if (!params.text?.trim()) result = { error: "text is required to save a preference." };
        else {
          const replaced = params.replaces ? history.removePreference(params.replaces) : undefined;
          const saved = history.addPreference(params.text);
          result = { saved, ...(params.replaces && { replaced: replaced ? params.replaces : `${params.replaces} not found` }) };
        }
      } else if (params.action === "remove") {
        result = params.preference_id
          ? { removed: history.removePreference(params.preference_id) ? params.preference_id : `${params.preference_id} not found` }
          : { error: "preference_id is required to remove a preference." };
      }
      result = { ...(result as object), user: user.name, preferences: history.preferences() };
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], details: undefined };
    },
  };
}
