"use client";

import { defineComponent } from "@openuidev/react-lang";
import { createCopilotLibrary } from "./library";
import { PlotView } from "./plot";

/** The library the app renders answers with, Vega plots included. Created once. */
export const copilotLibrary = createCopilotLibrary((props) => <PlotView {...props} />);

/**
 * The library a PDF's snapshot of an answer is drawn with: tables and sources
 * become real PDF tables after it, so here a table leaves a pointer and sources nothing.
 */
export const printLibrary = copilotLibrary.extend({
  components: {
    override: [
      defineComponent({
        ...copilotLibrary.components.Table!,
        component: () => <p className="copilot-print-note">Table: see the Data section of this PDF.</p>,
      }),
      defineComponent({ ...copilotLibrary.components.Sources!, component: () => null }),
    ],
  },
});
