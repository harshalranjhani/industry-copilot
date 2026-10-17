# 05: Reports and compliance

**What to build:** A user can ask about rules and compliance and get answers that use facts found only in the free-text repair reports. Q9 lists WELL-0001's four breaches (SR-01, SR-02, SR-03, RC-04) with $5,000 in open fines, the open actions (flowline RCA, unrecorded shut-in), and that RC-02 was met. Q10 lists the SW-24 spills contained too late. To support this:
- The loader extracts containment hours and compliance-check rows from the reports, and indexes them for full-text search.
- The agent gets `read_report` and `search_reports`.
- The views gain spill compliance and RCA candidates.

**Blocked by:** 03 — Whole fleet

**Status:** ready-for-agent

- [ ] Reports are resolved only through each repair's `report_file` field (including the non-standard names). Containment hours and every compliance-check row (protocol, result, detail) are extracted, and the full text is indexed for search
- [ ] Rules parsed from the SOPs: spill class bounds, SR-01 deadlines (standard and major), the SR-02 containment limit, the SR-03 verification window, RC-01, the RC-04 response window and RC-02 cadence. Missing rules fail the load
- [ ] The spill-compliance view, per real spill: discovery time; whether reporting was required (from the effective class) and the deadline; the filed report and its hours; SR-01 status; containment hours and SR-02 status; SR-03 due date and status; a flag when the report's stated class disagrees with the effective class
- [ ] The RCA-candidates view: corrective repairs per well and equipment kind in the 12 months before `AS_OF`, compared with the effective escalation count, recording which rule source applied
- [ ] The `read_report` (by repair ID) and `search_reports` (full text) tools are available
- [ ] Golden checks pass for:
  - Q9: SR-01 41 h against 24 h; SR-02 about 7 h against 4 h; SR-03 due 10 Aug 2026 and still open; RC-04 response due 30 Jul 2026 with none recorded; $5,000 open; RC-02 met on 7 Mar 2026
  - Q10: WELL-0082 at about 7.1 h, WELL-0100 at about 8.1 h
  - Q14 part 1: WELL-0108, 0121 and 0138
- [ ] In the UI, Q9 separates breaches from open actions, and cites the reports, regulator events and SOP protocols
