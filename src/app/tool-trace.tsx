"use client";

import type { ToolActivity } from "@openuidev/react-headless";
import { ToolCallTimeline, type TimelineStep } from "@openuidev/react-ui/ToolCall";
import { toolStatusMessage } from "@/lib/chat/tool-labels";

const friendly = (activity: ToolActivity): ToolActivity => {
  const statusMessage = toolStatusMessage(activity);
  return statusMessage ? { ...activity, statusMessage } : activity;
};

/** The shell's tool trace, with each call worded for a person ("Reading report MNT-0001-029"). */
export function CopilotToolTrace(props: {
  activities: ToolActivity[];
  steps: TimelineStep[];
  isLast: boolean;
  awaitingResponse: boolean;
}) {
  const steps = props.steps.map((step) => (step.type === "activity" ? { ...step, activity: friendly(step.activity) } : step));
  return <ToolCallTimeline {...props} activities={props.activities.map(friendly)} steps={steps} />;
}
