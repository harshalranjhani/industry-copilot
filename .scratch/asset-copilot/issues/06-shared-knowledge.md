# 06: Shared knowledge: corrections, claims, disputes

**What to build:** Users can teach the copilot, and everyone benefits.
- **Q12:** Michael Turner corrects WELL-0164's 15 Oct reading to 41.0 °C. The copilot records it with the original 24.0 °C, who made it and why, and flags the conflicting "Pump jack not moving." remark. Q2 now lists three wells and explains why.
- **Q15, first part:** Jessica Reed then sees WELL-0164 as producing, attributed to Michael Turner.
- **Q16, first part:** Jake Morales shares a planned shut-in for WELL-0007, and Michael Turner sees it later.
- **Q17:** contradicted claims are recorded as unconfirmed and answered with the inspection evidence.
- **Q18:** disputed notes are shown, and the detection still stands.

This slice delivers the Knowledge Store's recording interface and the `record_knowledge` tool, and shows the knowledge markers in answers.

**Blocked by:** 03 — Whole fleet

**Status:** ready-for-agent

- [ ] Knowledge entries have a kind (note, correction, claim, rule_override), a scope (inspection field, well, well type), value and original value, text, reason, author, valid from and to, a status (accepted, unconfirmed, disputed) and an origin. Chat-origin entries survive a data reload
- [ ] `record_knowledge` checks that the target exists, stores the entry, and returns the effect (before and after values for derived results such as producing status) and the conflicts (inspector remarks or notes on the same target that disagree; for claims, the latest inspection when it contradicts the claim)
- [ ] Corrections to `wellhead_temp_c`, `ambient_temp_c`, `spill_detected` and `spill_est_volume_bbl` apply in the effective-inspections view for all users, and keep their attribution
- [ ] A claim contradicted by the data is stored as unconfirmed and changes no derived value. Notes shared about a well appear in `well_snapshot` for every user
- [ ] An inspection with disagreeing non-correction notes is marked disputed; it still counts as a spill unless formally corrected
- [ ] The system prompt tells the agent to record user-stated facts in the same turn, surface conflicts and ask for confirmation, and render "corrected by <name>", "unconfirmed claim" or "disputed" markers
- [ ] Overlay golden checks pass:
  - Q12: WELL-0164 is producing after the correction, and Q2's list drops to 0170, 0172 and 0175
  - Q17: Tyler Hughes's claim on WELL-0175 is unconfirmed and the well is still not producing
  - Q18: INS-0101-0197 is disputed and still a spill
- [ ] In the UI, Q12, Q15 (first part), Q16 (first part), Q17 and Q18 behave as the example answers describe
