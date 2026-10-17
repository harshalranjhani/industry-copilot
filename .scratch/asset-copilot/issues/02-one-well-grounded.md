# 02: One well, grounded: "Is WELL-0001 producing oil right now?"

**What to build:** A user asks Q1 and gets a status card that says WELL-0001 is not producing oil. The card shows its latest inspection (INS-0001-0203, 15 Oct 2026, drone, Ryan Brooks), a delta of 3.2 °C against the T200 threshold of 15 °C, and that the recorded status "active" is out of date. It ends with a Sources block. This is the first grounded slice through every layer:
- a Dataset Loader for the fleet files, well metadata and inspections;
- Rules parsed from the well-type manuals;
- an effective-inspections view;
- the `well_snapshot` tool;
- the agent prompt;
- the golden-check harness.

(Q1's shut-in note CTX-0001-003 arrives in ticket 03.)

**Blocked by:** 01 — Chat skeleton

**Status:** ready-for-agent

- [ ] A load command reads the `DATA_DIRS` roots (fleet areas and users, and well metadata and inspections) into a SQLite data store, rebuilding it from scratch
- [ ] Rules are parsed from the manuals for each well type and stored with value, unit, document and section: producing threshold, temperature alarm, spill shut-in %, RCA count and window, and escalation days. T350 inherits from T200 any rule its manual defers. A missing required rule fails the load and names the document
- [ ] The effective-inspections view gives, per inspection, the delta above ambient and a producing flag computed with the well type's threshold. A latest-inspection-per-well view includes recorded status and a mismatch flag
- [ ] The `well_snapshot` tool returns the latest effective inspection, the inspector's name, recorded status and mismatch, well type, area name and location
- [ ] The system prompt includes the user identity placeholder, `AS_OF` (default 2026-10-17), the "right now = latest inspection" convention, the domain glossary, the parsed-rules summary, full manual and SOP text, and the answer rules (always cite, never invent a cause)
- [ ] A golden-check command exists and passes for Q1's data facts: INS-0001-0203, delta 3.2, not producing, recorded status mismatch
- [ ] Asking Q1 in the UI renders a Card with these facts and a Sources block citing the inspection, the metadata and T200 manual section 9.3
