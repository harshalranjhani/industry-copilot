# 07: Corrections that ripple through compliance, and well-type rule overrides

**What to build:**
- **Q13:** Michael Turner corrects the WELL-0151 spill from the AI's 4.5 bbl to a measured 5.4 bbl. The copilot keeps the AI estimate and reclassifies the spill as reportable. It flags a possible SR-01 breach (no written notice within 24 h of 24 Sep 15:30) and notes that report MNT-0151-025's "moderate" classification no longer holds, alongside the existing SR-02 breach. It says SR-03 verification is now due by 23 Nov 2026.
- **Q15, second part:** Laura Simmons sees WELL-0151 as the only NE-08 spill needing a report.
- **Q14, second part:** "pump jack RCA after 2 repairs for all T350 wells" adds WELL-0120 but not WELL-0102, which is T200. The answer cites Michael Turner's rule, not the manual.

**Blocked by:** 05 — Reports and compliance; 06 — Shared knowledge

**Status:** ready-for-agent

- [ ] A volume correction re-derives the spill class in the spill-compliance view: reporting required, SR-01 deadline and status, the SR-03 due date, and the stale-report flag
- [ ] A well-type rule override is stored with its scope and applied by the RCA-candidates view to wells of that type only, recording "user rule by <name>" as the source
- [ ] `record_knowledge` returns the compliance and RCA effects of these entries (before and after)
- [ ] Overlay golden checks pass:
  - Q13: class reportable; SR-01 overdue; SR-03 due 2026-11-23; report class flagged stale
  - Q14 part 2: WELL-0108, 0120, 0121 and 0138, with WELL-0102 excluded
  - Q15 part 2: only WELL-0151 needs a report
- [ ] In the UI, Q13, Q14 (asked again in a new chat) and Q15 (second part) behave as the example answers describe
