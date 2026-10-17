# 03: Whole fleet: all records, views and the query tool

**What to build:** A user can ask any data question across the fleet and get a correct, cited answer with the right built-in visual: Q2 as a table, Q3 as a line chart with non-producing readings marked, Q4 as a table, Q5 as a short answer, Q6 as a bar chart, and the Q11 cost figures. To support this:
- The loader covers every record type and merges multiple dataset roots by ID.
- Dataset notes become knowledge entries (dataset corrections remove spills).
- The Fleet Views cover downtime, spills, repairs and notes.
- The agent gets a read-only `query` tool over the documented views.
- `well_snapshot` now includes open repairs and valid notes, which completes Q1's reason (CTX-0001-003).

**Blocked by:** 02 — One well, grounded

**Status:** ready-for-agent

- [ ] The loader reads repairs, regulator events and notes for every well. Records are upserted by ID across multiple `DATA_DIRS` roots, with later roots winning
- [ ] Dataset notes are imported into a durable knowledge store (separate file, origin `dataset`), and a reload replaces only dataset-origin entries. Correction notes become `spill_detected = false` overrides on their inspection. Inspection IDs named in note text are extracted and linked
- [ ] The effective-inspections view applies knowledge overrides, keeping original and effective values, and adds is-spill, effective volume and spill class (from parsed SOP bounds)
- [ ] There are views for: downtime (7 days per non-producing effective inspection, filterable by period); real spills, with area name, month and location; repairs, with open/closed state relative to `AS_OF`, period by start date and cost total; and notes valid at a date
- [ ] The `query` tool runs read-only SQL against the views only, caps rows, and returns errors the model can recover from. The views and their columns are documented in the system prompt
- [ ] `well_snapshot` includes open repairs and notes valid at `AS_OF`
- [ ] Golden checks pass for:
  - Q2: WELL-0164, 0170, 0172 and 0175, with their deltas
  - Q3: 13 readings, non-producing on 8 and 15 Oct
  - Q4: 6 spills, 15.1 bbl, INS-0001-0070 excluded
  - Q5: 21 days
  - Q6: WELL-0121 49, WELL-0138 42, WELL-0107 42, next WELL-0119 28; this settles where relative-period boundaries fall
  - Q7 data: 4 NE-08 spills in 90 days
  - Q8 data: area totals 35, 43, 37, 26
  - Q11: costs 25,794, 46,942 and 5,176
- [ ] In the UI: Q2 renders a Table and says plainly when no reason is recorded; Q3 renders a LineChart; Q6 renders a BarChart. Each cites its records
