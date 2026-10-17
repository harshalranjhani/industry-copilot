/** A conversation starter: the short chip text and the full question it sends. */
export interface Starter {
  displayText: string;
  prompt: string;
}

const GENERAL: Starter[] = [
  { displayText: "Is WELL-0001 producing?", prompt: "Is WELL-0001 producing oil right now? When was it last inspected, and by whom?" },
  { displayText: "What can you do?", prompt: "What can you help me with?" },
];

const BY_ROLE: Record<string, Starter[]> = {
  production_supervisor: [
    {
      displayText: "Not producing in an area",
      prompt: "Which wells in Northeast Block 8 are not producing oil right now, and why? Show them in a table.",
    },
    {
      displayText: "Most downtime, last 4 months",
      prompt: "Which 3 wells in Northeast Block 7 had the most downtime in the last 4 months? Show a bar chart.",
    },
    { displayText: "WELL-0001 downtime in 2025", prompt: "How many days was WELL-0001 down in 2025?" },
  ],
  field_operator: [
    { displayText: "Is WELL-0001 producing?", prompt: "Is WELL-0001 producing oil right now? When was it last inspected, and by whom?" },
    {
      displayText: "Wellhead vs air, 13 weeks",
      prompt: "Show a line chart of WELL-0001's wellhead temperature against air temperature for the last 13 weeks, and mark when it was not producing oil.",
    },
    {
      displayText: "Why is a well stopped?",
      prompt: "Which wells in Northeast Block 8 are not producing oil right now, and why? Show them in a table.",
    },
  ],
  field_inspector: [
    { displayText: "Last inspection of WELL-0001", prompt: "When was WELL-0001 last inspected, by whom and how, and what did it find?" },
    {
      displayText: "Recent spills on a map",
      prompt: "Show on a map every well in Northeast Block 8 with a real spill in the last 90 days.",
    },
    {
      displayText: "Stale recorded status",
      prompt: "Which wells in Northeast Block 8 have a recorded status that is out of date compared with their latest inspection?",
    },
  ],
  maintenance_lead: [
    {
      displayText: "Spills over the SOP limit",
      prompt: "In Southwest Block 24, which spills in the last 90 days were not contained within the SOP time limit?",
    },
    { displayText: "Open repairs and actions", prompt: "What repairs and actions are still open for WELL-0001?" },
    {
      displayText: "Spills by area and month",
      prompt: "Show a heatmap of 2026 spills by geographic area and month.",
    },
  ],
  maintenance_technician: [
    { displayText: "Open repairs on WELL-0001", prompt: "What repairs are still open for WELL-0001, and what do their reports say?" },
    { displayText: "WELL-0001 spill history", prompt: "How many oil spills has WELL-0001 had in the last 4 years, and how much oil in total? List them in a table." },
    {
      displayText: "Notes on a stopped well",
      prompt: "Is WELL-0001 producing oil right now? If not, what notes explain why?",
    },
  ],
  hse_officer: [
    { displayText: "Rules WELL-0001 broke", prompt: "Which rules has WELL-0001 broken in the last 12 months, and what is still open?" },
    {
      displayText: "Late spill containment",
      prompt: "In Southwest Block 24, which spills in the last 90 days were not contained within the SOP time limit?",
    },
    {
      displayText: "Spills by area and month",
      prompt: "Show a heatmap of 2026 spills by geographic area and month.",
    },
  ],
};

/** The starters for a user's role; a role the copilot has no starters for gets the general ones. */
export function starterQuestions(role: string): Starter[] {
  return BY_ROLE[role] ?? GENERAL;
}
