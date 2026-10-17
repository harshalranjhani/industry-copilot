# Final question answers

GPT-6 Luna · Test dataset as of 15 January 2027

## Q1. Reservoir pressure

**Michael Turner**

### Reservoir pressure map

Pressure readings are not available in the provided well data.

I can’t map reservoir pressure from the available records: they contain wellhead and ambient temperatures, not reservoir-pressure measurements. Because those are different measurements, I won’t use them as a substitute. If you can provide pressure readings with well IDs and measurement dates, I can map them across the field.

**No pressure data to map**

The available latest-inspection readings include temperatures and temperature deltas, but no reservoir-pressure field.

### Sources

- **Available fleet views**: Latest-inspection data includes temperatures; no reservoir-pressure measurement is available

---

## Q2. Best producer

**Robert Hayes**

**Oil production volumes aren't recorded**

I can't identify which well produced the most oil in 2026: the available records contain inspection-based producing flags, not oil-volume measurements.

As a different measure, 52 wells tied for the most producing inspection readings: each was producing on all 53 inspections in 2026. WELL-0008 is the first by ID among the tied wells—not a unique winner for oil volume. The next well by this proxy is WELL-0016, also with 53 producing readings. The window is 1 Jan–31 Dec 2026.

Producing-reading ties are ordered by well ID; this proxy does not establish how much oil any well produced.

### Sources

- **2026 effective inspections**: 2026 producing-reading comparison; includes WELL-0008 and tied wells
- **OM-T200 §9.3; OM-T350 §3; OM-T500 §3**: Production is derived from temperature above ambient, not measured oil volume

---

## Q3. Gas reports

**Laura Simmons**

### Gas reports and field-response deadlines

1 Nov 2026–15 Jan 2027 · 23 operator-note reports

Under OPS-1, an in-time response is a maintenance job or a manual inspection after the report: within 24 hours for reports before 1 Jan 2027, and within 12 hours from 1 Jan 2027. Of the 23 reports, 12 have an in-time response recorded; 11 are missed or have no qualifying response recorded. Hours are elapsed from the operator note to the first qualifying response; “none” means no later qualifying response is in the records.

| Well | Area | Reported at (UTC) | Response (record ID and time, UTC) | Hours to response | Deadline | Met / Missed |
| --- | --- | --- | --- | --- | --- | --- |
| WELL-0163 | Northeast Block 8 | 3 Nov 2026 20:55 | MNT-0163-019 · 14 Nov 2026 08:00 | 251.08 | 24 h | Missed |
| WELL-0149 | Northeast Block 7 | 6 Nov 2026 18:20 | MNT-0149-029 · 7 Nov 2026 08:00 | 13.67 | 24 h | Met |
| WELL-0165 | Northeast Block 8 | 13 Nov 2026 20:35 | MNT-0165-031 · 14 Nov 2026 08:00 | 11.42 | 24 h | Met |
| WELL-0341 | Northwest Block 12 | 19 Nov 2026 07:40 | None |  | 24 h | Missed |
| WELL-0091 | Southwest Block 24 | 27 Nov 2026 22:25 | MNT-0091-019 · 28 Nov 2026 08:00 | 9.58 | 24 h | Met |
| WELL-0423 | Northwest Block 12 | 3 Dec 2026 05:25 | INS-0423-0213 · 3 Dec 2026 09:15 | 3.83 | 24 h | Met |
| WELL-0059 | Southwest Block 24 | 3 Dec 2026 06:10 | INS-0059-0213 · 3 Dec 2026 12:15 | 6.08 | 24 h | Met |
| WELL-0332 | Northwest Block 12 | 3 Dec 2026 12:10 | None |  | 24 h | Missed |
| WELL-0401 | Northwest Block 12 | 5 Dec 2026 13:50 | MNT-0401-033 · 11 Dec 2026 08:00 | 138.17 | 24 h | Missed |
| WELL-0189 | Northeast Block 8 | 10 Dec 2026 12:35 | MNT-0189-037 · 11 Dec 2026 08:00 | 19.42 | 24 h | Met |
| WELL-0403 | Northwest Block 12 | 10 Dec 2026 21:15 | MNT-0403-024 · 11 Dec 2026 08:00 | 10.75 | 24 h | Met |
| WELL-0244 | Southeast Block 31 | 11 Dec 2026 05:25 | MNT-0244-026 · 11 Dec 2026 08:00 | 2.58 | 24 h | Met |
| WELL-0040 | Southwest Block 23 | 12 Dec 2026 01:55 | MNT-0040-029 · 12 Dec 2026 08:00 | 6.08 | 24 h | Met |
| WELL-0052 | Southwest Block 24 | 18 Dec 2026 06:45 | None |  | 24 h | Missed |
| WELL-0370 | Northwest Block 12 | 21 Dec 2026 12:45 | MNT-0370-028 · 22 Dec 2026 08:00 | 19.25 | 24 h | Met |
| WELL-0362 | Northwest Block 12 | 24 Dec 2026 00:15 | MNT-0362-030 · 25 Dec 2026 08:00 | 31.75 | 24 h | Missed |
| WELL-0324 | Northwest Block 12 | 1 Jan 2027 22:40 | MNT-0324-036 · 2 Jan 2027 08:00 | 9.33 | 12 h | Met |
| WELL-0330 | Northwest Block 12 | 2 Jan 2027 21:40 | MNT-0330-030 · 3 Jan 2027 08:00 | 10.33 | 12 h | Met |
| WELL-0599 | Southeast Block 32 | 6 Jan 2027 17:20 | INS-0599-0196 · 7 Jan 2027 09:45 | 16.42 | 12 h | Missed |
| WELL-0516 | Southeast Block 32 | 6 Jan 2027 21:15 | INS-0516-0215 · 7 Jan 2027 12:15 | 15 | 12 h | Missed |
| WELL-0425 | Northwest Block 12 | 7 Jan 2027 05:20 | INS-0425-0218 · 7 Jan 2027 09:00 | 3.67 | 12 h | Met |
| WELL-0465 | Southeast Block 32 | 8 Jan 2027 23:35 | MNT-0465-031 · 9 Jan 2027 08:00 | 8.42 | 12 h | Met |
| WELL-0137 | Northeast Block 7 | 10 Jan 2027 23:30 | MNT-0137-032 · 11 Jan 2027 08:00 | 8.5 | 12 h | Met |

An inspection only qualifies when it is manual; drone inspections do not satisfy OPS-1. All listed responses meet that rule when within the applicable deadline. None means no qualifying response was found in the records, not proof that no one attended. Response IDs are maintenance IDs or manual-inspection IDs, as applicable.

### Sources

- **CTX-0163-002**: WELL-0163 gas/H2S operator note
- **CTX-0149-004**: WELL-0149 gas-odor operator note
- **CTX-0165-001**: WELL-0165 gas-odor operator note
- **CTX-0341-002**: WELL-0341 H2S operator note
- **CTX-0091-001**: WELL-0091 H2S operator note
- **CTX-0423-002**: WELL-0423 gas-odor operator note
- **CTX-0059-002**: WELL-0059 gas-odor operator note
- **CTX-0332-004**: WELL-0332 gas-odor operator note
- **CTX-0401-002**: WELL-0401 H2S operator note
- **CTX-0189-003**: WELL-0189 H2S operator note
- **CTX-0403-004**: WELL-0403 gas-odor operator note
- **CTX-0244-002**: WELL-0244 gas-odor operator note
- **CTX-0040-002**: WELL-0040 gas-odor operator note
- **CTX-0052-003**: WELL-0052 gas-odor operator note
- **CTX-0370-005**: WELL-0370 gas-odor operator note
- **CTX-0362-002**: WELL-0362 gas-odor operator note
- **CTX-0324-001**: WELL-0324 gas-odor operator note
- **CTX-0330-003**: WELL-0330 H2S operator note
- **CTX-0599-003**: WELL-0599 gas-odor operator note
- **CTX-0516-002**: WELL-0516 gas-odor operator note
- **CTX-0425-006**: WELL-0425 gas-odor operator note
- **CTX-0465-005**: WELL-0465 gas-odor operator note
- **CTX-0137-004**: WELL-0137 gas-odor operator note
- **SOP-OPS §3 OPS-1**: Gas odor response requirements and response window

---

## Q4. Temporary flowline bypasses

**Chris Dalton**

### Temporary flowline bypasses

Across all areas; current as of 15 Jan 2027

There are 2 bypasses recorded as still in place: WELL-0013 is allowed under MOC-2026-044; WELL-0248 is still in place after its approval expired. The table also lists completed bypass intervals that were not approved or remained in after approval expired.

| Well | Area | Bypass in (date) | Bypass out (date, or "still in") | Approval (memo ID, or none) | Approval valid until | Status (Allowed / Expired / Not approved) |
| --- | --- | --- | --- | --- | --- | --- |
| WELL-0013 | Southwest Block 23 | 2026-11-10 | 2027-01-08 | MOC-2026-044 (extension of MOC-2026-031) | 2027-02-28 | Allowed |
| WELL-0248 | Southeast Block 31 | 2026-11-05 | still in | MOC-2026-031 | 2027-02-28 | Expired |
| WELL-0062 | Southwest Block 24 | 2026-11-02 | 2026-11-27 | MOC-2026-031 | 2027-02-28 | Allowed |
| WELL-0087 | Southwest Block 24 | 2026-12-02 | 2027-01-06 | MOC-2026-036 | 2026-12-15 | Expired |
| WELL-0158 | Northeast Block 8 | 2026-11-20 | 2026-12-28 | MOC-2026-036 | 2026-12-15 | Allowed |
| WELL-0249 | Southeast Block 31 | 2026-11-25 | still in | MOC-2026-036 | 2026-12-15 | Expired |
| WELL-0284 | Southwest Block 24 | 2026-11-12 | 2026-12-10 | MOC-2026-036 | 2026-12-15 | Allowed |
| WELL-0356 | Northwest Block 12 | 2026-11-18 | 2026-12-05 | MOC-2026-036 | 2026-12-15 | Allowed |
| WELL-0405 | Northwest Block 12 | 2026-12-20 | still in | none | none | Not approved |
| WELL-0461 | Southeast Block 32 | 2026-11-14 | 2026-12-12 | MOC-2026-036 | 2026-12-15 | Allowed |
| WELL-0476 | Southeast Block 32 | 2026-10-22 | 2026-11-18 | MOC-2026-031 | 2027-02-28 | Allowed |
| WELL-0561 | Southeast Block 32 | 2026-12-08 | 2026-12-19 | none | none | Not approved |

Expired approval cases: WELL-0248 remains in place after MOC-2026-031 expired on 30 Nov 2026; MOC-2026-044 later extended that approval for this named well, so it is currently allowed through 28 Feb 2027. WELL-0087 was removed on 6 Jan 2027, after MOC-2026-036 expired on 15 Dec 2026. WELL-0158 was removed on 28 Dec 2026, after MOC-2026-036 expired. WELL-0013's approval was extended by MOC-2026-044 before the original expiry. WELL-0405 and WELL-0561 have no approval recorded in the listed MOCs. Other completed rows were removed within the approval period.

### Sources

- **CTX-0013-002**: WELL-0013 bypass put in
- **CTX-0013-005**: WELL-0013 bypass removed
- **CTX-0248-002**: WELL-0248 bypass put in; remains in
- **CTX-0062-002**: WELL-0062 bypass put in
- **CTX-0062-005**: WELL-0062 bypass removed
- **CTX-0087-001**: WELL-0087 bypass put in
- **CTX-0087-004**: WELL-0087 bypass removed
- **CTX-0158-003**: WELL-0158 bypass put in
- **CTX-0158-005**: WELL-0158 bypass removed
- **CTX-0249-002**: WELL-0249 bypass put in; remains in
- **CTX-0284-002**: WELL-0284 bypass put in
- **CTX-0284-003**: WELL-0284 bypass removed
- **CTX-0356-002**: WELL-0356 bypass put in
- **CTX-0356-003**: WELL-0356 bypass removed
- **CTX-0405-003**: WELL-0405 bypass put in; remains in
- **CTX-0461-002**: WELL-0461 bypass put in
- **CTX-0461-003**: WELL-0461 bypass removed
- **CTX-0476-002**: WELL-0476 bypass put in
- **CTX-0476-003**: WELL-0476 bypass removed
- **CTX-0561-004**: WELL-0561 bypass put in
- **CTX-0561-005**: WELL-0561 bypass removed
- **MOC-2026-031; MOC-2026-044**: Temporary bypass approval and extension; named wells and expiry 28 Feb 2027
- **MOC-2026-036**: Winter valve program bypass approval; named wells, effective 10 Nov–15 Dec 2026

---

## Q5. The regulator's letter

**Michael Turner**

### Commission letter: covered spills and compliance

The 20 Nov 2026 letter covers reportable spills discovered since 1 Jun 2026 in Northeast Block 7 and Northeast Block 8.

Covered spills: 6. The letter requires soil samples during clean-up and lab results submitted by 15 Jan 2027. HSE’s internal instruction says the clean-up report must contain the exact sentence “Soil samples sent to the lab.”

| Well | Area | Inspection (ID and date) | Volume (bbl) | Clean-up job | Compliant? (Yes / No, with reason) |
| --- | --- | --- | --- | --- | --- |
| WELL-0168 | Northeast Block 8 | INS-0168-0190 — 2026-06-11 | 5.6 | MNT-0168-024 — started 2026-06-12 | No — not compliant: report MNT-0168-024 says “Soil samples sent to the lab,” but samples were not recorded as submitted by the letter’s 2027-01-15 deadline. SR-01 was also late: 18 h vs the 24 h deadline; SR-03 verification was late (verified 2026-08-25, due 2026-08-10). |
| WELL-0123 | Northeast Block 7 | INS-0123-0093 — 2026-09-24 | 6 | MNT-0123-014 — started 2026-09-25 | Yes — report MNT-0123-014 records “Soil samples sent to the lab”; no evidence of non-compliance with the letter. SR-01 met at 4 h (24 h limit); SR-03 verified 2026-11-15, before 2026-11-23 due date. |
| WELL-0277 | Northeast Block 7 | INS-0277-0205 — 2026-10-01 | 6.2 | MNT-0277-031 — started 2026-10-02 | Yes — report MNT-0277-031 records “Soil samples sent to the lab”; no evidence of non-compliance with the letter. SR-01 was late at 38 h (24 h limit); SR-03 verified 2026-11-10, before 2026-11-30 due date. |
| WELL-0119 | Northeast Block 7 | INS-0119-0209 — 2026-11-05 | 6 | MNT-0119-029 — started 2026-11-06 | Yes — report MNT-0119-029 records “Soil samples sent to the lab”; no evidence of non-compliance with the letter. SR-01 met at 7 h (24 h limit); SR-03 verified 2026-12-20, before 2027-01-04 due date. |
| WELL-0182 | Northeast Block 8 | INS-0182-0208 — 2026-12-03 | 5.2 | MNT-0182-028 — started 2026-12-04 | No — not compliant: report MNT-0182-028 records four soil samples and a clean-up result, but does not state that soil samples were sent to the lab; the letter’s 2027-01-15 deadline has passed. SR-01 was also late at 50 h (24 h limit); SR-03 verified 2027-01-12, before 2027-02-01 due date. |
| WELL-0262 | Northeast Block 8 | INS-0262-0218 — 2027-01-07 | 6.1 | MNT-0262-029 — started 2027-01-08 | No — not compliant: report MNT-0262-029 records four samples and a clean-up result, but does not state that soil samples were sent to the lab; deadline 2027-01-15. SR-01 was late at 17 h vs 12 h; SR-02 containment took 6.4 h vs 4 h. SR-03 remains pending, due 2027-03-08. |

Assessment is against the letter’s soil-sampling and lab-submission requirement. For WELL-0168, the report states samples were sent to the lab, but the evidence retrieved does not establish that results were submitted to the Commission by the deadline; confirm submission. Wells marked No have missing/late required evidence, not a finding that no clean-up occurred.

### Sources

- **regulator-letter-2026-11-20**: Commission letter: reportable spills in Northeast Blocks 7 and 8 since 1 Jun 2026; lab results due 15 Jan 2027
- **regulator-letter-2026-11-20**: Internal HSE instruction: report sentence required for lab samples
- **SOP-SR §3; §4 SR-01, SR-02, SR-03**: Reportable threshold and spill response deadlines
- **INS-0168-0190**: WELL-0168 spill, 11 Jun 2026, 5.6 bbl
- **INS-0123-0093**: WELL-0123 spill, 24 Sep 2026, 6.0 bbl
- **INS-0277-0205**: WELL-0277 spill, 1 Oct 2026, 6.2 bbl
- **INS-0119-0209**: WELL-0119 spill, 5 Nov 2026, 6.0 bbl
- **INS-0182-0208**: WELL-0182 spill, 3 Dec 2026, 5.2 bbl
- **INS-0262-0218**: WELL-0262 spill, 7 Jan 2027, 6.1 bbl
- **MNT-0168-024**: WELL-0168 spill clean-up report
- **MNT-0123-014**: WELL-0123 spill clean-up report
- **MNT-0277-031**: WELL-0277 spill clean-up report
- **MNT-0119-029**: WELL-0119 spill clean-up report
- **MNT-0182-028**: WELL-0182 spill clean-up report
- **MNT-0262-029**: WELL-0262 spill clean-up report
- **REG-0168-009; REG-0168-010**: WELL-0168 spill notice and SR-03 verification
- **REG-0123-001; REG-0123-002**: WELL-0123 spill notice and SR-03 verification
- **REG-0277-001; REG-0277-004**: WELL-0277 spill notice and SR-03 verification
- **REG-0119-001; REG-0119-002**: WELL-0119 spill notice and SR-03 verification
- **REG-0182-003; REG-0182-005**: WELL-0182 spill notice and SR-03 verification
- **REG-0262-001**: WELL-0262 spill notice

---

## Q6. Which status is right?

**Nathan Pierce**

### Wells where latest inspection and operator notes disagree

Whole field · current as of 15 Jan 2027

The inspection shows the well’s temperature-based producing result. A later explicit shut-in or restart note takes precedence for current status under OPS-3. Times below are UTC.

| Well | Area | Latest inspection (ID, date, what it shows) | Latest operator note (date, time, what it says) | Status now |
| --- | --- | --- | --- | --- |
| WELL-0010 | Southwest Block 23 | INS-0010-0219 · 14 Jan · not producing: T350 delta 17.5 °C, below 20 °C | 14 Jan, 16:50 · Ryan Brooks: “Heard fluid pound on WELL-0010, unit still running.” This describes the unit running, but does not explicitly say the well is producing oil. | Not producing oil |
| WELL-0033 | Southwest Block 23 | INS-0033-0222 · 14 Jan · not producing: T350 delta 10.0 °C, below 20 °C | 15 Jan, 10:25 · Jake Morales: “Restarted WELL-0033, unit running smooth.” | Producing oil (unconfirmed) |
| WELL-0044 | Southwest Block 23 | INS-0044-0218 · 14 Jan · producing: T200 delta 23.7 °C, at least 15 °C | 14 Jan, 13:05 · Ryan Brooks: “Shut in WELL-0044 at the wellhead, flowline leak suspected.” | Not producing oil |
| WELL-0323 | Northwest Block 12 | INS-0323-0219 · 14 Jan · producing: T200 delta 24.5 °C, at least 15 °C | 14 Jan, 19:20 · Austin Kemp: “Shut-in WELL-0323 after the pumper reported a stuffing box leak.” | Not producing oil |
| WELL-0422 | Northwest Block 12 | INS-0422-0215 · 14 Jan · producing: T350 delta 27.7 °C, at least 20 °C | 14 Jan, 21:35 · Austin Kemp: “Shut in WELL-0422 for the night, high pressure alarm on the separator.” | Not producing oil |
| WELL-0481 | Southeast Block 32 | INS-0481-0220 · 14 Jan · producing: T200 delta 22.4 °C, at least 15 °C | 14 Jan, 18:50 · Derek Walsh: “Shut in WELL-0481 for the night, high pressure alarm on the separator.” | Not producing oil |

Why: WELL-0010’s latest note says the unit is running, but does not explicitly report a restart or oil production; the inspection remains the status evidence. WELL-0033’s restart note is newer than the non-producing inspection, so it is producing oil (unconfirmed) pending inspection confirmation. For WELL-0044, WELL-0323, WELL-0422 and WELL-0481, the explicit shut-in notes are newer than producing inspections, so each is not producing oil now. The suspected flowline leak and reported stuffing-box leak/high-pressure alarms are the operators’ stated reasons, not independently verified causes. WELL-0033 has an open repair, MNT-0033-033, for walking beam bearing wear, started 9 Jan 2027; it was triggered by an earlier inspection, not the latest one.

### Sources

- **SOP-OPS §OPS-3**: Inspection and operator-note status precedence
- **OM-T200 §9.3**: T200 producing threshold
- **OM-T350 §3**: T350 producing threshold
- **INS-0010-0219**: WELL-0010 latest inspection
- **INS-0033-0222**: WELL-0033 latest inspection
- **INS-0044-0218**: WELL-0044 latest inspection
- **INS-0323-0219**: WELL-0323 latest inspection
- **INS-0422-0215**: WELL-0422 latest inspection
- **INS-0481-0220**: WELL-0481 latest inspection
- **CTX-0010-007**: WELL-0010 operator note
- **CTX-0033-003**: WELL-0033 restart note
- **CTX-0044-008**: WELL-0044 shut-in note
- **CTX-0323-002**: WELL-0323 shut-in note
- **CTX-0422-003**: WELL-0422 shut-in note
- **CTX-0481-006**: WELL-0481 shut-in note
- **MNT-0033-033**: WELL-0033 open walking beam bearing wear repair

---

## Q7. What the operators are hearing

### Turn 1 — Robert Hayes

#### Top 10 operator-noted warning wells without a subsequent repair

Ranked judgement for repair need over the next 90 days; spill clean-up excluded

Lookback: 15 Dec 2026–15 Jan 2027. I interpreted “sound or behave wrong” as operator notes describing drive tripping, and included only wells with no repair started since their latest qualifying note. Ranking is a maintenance-priority judgement—not a calibrated probability—weighted toward repeat trips, recent non-producing inspections, and repair history.

**How to read the ranking**

Recent T500 readings below threshold and repair-report details strengthen priority where noted. Repeated trips alone are warning evidence, not a confirmed diagnosis.

| Rank | Well | Area | Operator-note evidence (date and quote) | Other warning signs in the data | Last repair on the well |
| --- | --- | --- | --- | --- | --- |
| 1 | WELL-0249 | Southeast Block 31 | 13 Jan — Marcus Lee: “WELL-0249 drive tripping on underload, restarted from the panel.” | Open corrective ESP motor-burnout repair MNT-0249-018 (9 Jan); the 7 and 14 Jan inspections were non-producing, with deltas 2.6 and 5.9 °C against the 25 °C T500 threshold. Report says failed motor windings; expected shut-in about 22 extra days for rig availability; RCA required before next repair closure. | MNT-0249-018 — ESP motor burnout; started 9 Jan 2027; still open. |
| 2 | WELL-0498 | Southeast Block 32 | 12 Jan — Derek Walsh: “WELL-0498 drive tripping on underload, restarted from the panel.” (also similar notes 9 and 11 Jan) | Three drive-trip notes in this lookback. Latest inspection producing; prior 31 Dec and 7 Jan inspections were non-producing (deltas 6.5 and 8.8 °C vs 25 °C); 7 Jan remark: “Drive panel dark.” MNT-0498-031 fixed a separator level-controller failure; report says about 8 extra shut-in days waiting for contractor, then returned to production. | MNT-0498-031 — separator level-controller fault; started 3 Jan 2027; closed 13 Jan. |
| 3 | WELL-0430 | Northwest Block 12 | 8 Jan — Rachel Dunn: “WELL-0430 drive tripping on and off overnight, reset it each time.” | Three non-producing inspections 10, 17 and 24 Dec (deltas 2.8, 5.2 and 1.9 °C vs 25 °C); 10 Dec remark: “Wellhead cold to touch.” Latest inspection producing. No later repair in system. | MNT-0430-031 — scheduled wellhead valve service; started 1 Jan 2027; closed. |
| 4 | WELL-0219 | Southeast Block 31 | 5 Jan — Kayla Morgan: “WELL-0219 drive tripping on underload, restarted from the panel.” | Latest inspection 14 Jan not producing: 4.5 °C delta vs 25 °C; inspector Marcus Lee noted “No flow noise at the wellhead.” Prior weekly readings in Dec/7 Jan were producing. No later repair in system. | MNT-0219-022 — scheduled wellhead valve service; started 24 Nov 2026; closed. |
| 5 | WELL-0344 | Northwest Block 12 | 4 Jan — Rachel Dunn: “WELL-0344 drive tripping on and off overnight, reset it each time.” | Latest 14 Jan inspection producing (36.4 °C vs 25 °C). Repeated trips reported, but no additional adverse latest-inspection remark found. | MNT-0344-035 — scheduled wellhead valve service; started 1 Dec 2026; closed. |
| 6 | WELL-0352 | Northwest Block 12 | 10 Jan — Lauren Pruitt: “WELL-0352 drive tripping on underload, restarted from the panel.” | Latest 7 Jan inspection producing (36.4 °C vs 25 °C). No other recent warning sign returned. | MNT-0352-028 — scheduled wellhead valve service; started 10 Jan 2027; closed. |
| 7 | WELL-0548 | Southeast Block 32 | 26 Dec — Hannah Brooks: “WELL-0548 drive tripping on underload, restarted from the panel.” | Latest 14 Jan inspection producing (37.3 °C vs 25 °C). No other recent warning sign returned. | MNT-0548-029 — follow-up re-check of packing and wellhead valves; started 25 Dec 2026; closed. |
| 8 | WELL-0485 | Southeast Block 32 | 9 Jan — Hannah Brooks: “WELL-0485 drive tripping on underload, restarted from the panel.” | Latest 14 Jan inspection producing (36.9 °C vs 25 °C). No other recent warning sign returned. | MNT-0485-026 — scheduled wellhead valve service; started 3 Jan 2027; closed. |
| 9 | WELL-0434 | Northwest Block 12 | 26 Dec — Rachel Dunn: “WELL-0434 drive tripping on underload, restarted from the panel.” | Latest 14 Jan inspection producing (35.6 °C vs 25 °C). No other recent warning sign returned. | MNT-0434-026 — scheduled ESP drive and insulation check; started 27 Jun 2026; closed. |
| 10 | WELL-0329 | Northwest Block 12 | 26 Dec — Austin Kemp: “WELL-0329 drive tripping on and off overnight, reset it each time.” | Latest 14 Jan inspection producing (35.7 °C vs 25 °C). Recent corrective ESP power-cable insulation failure was repaired; no later adverse inspection remark returned. | MNT-0329-031 — ESP power-cable insulation failure; started 25 Sep 2026; closed. |

Scope note: this is the top 10 among qualifying operator-note wells, ordered by the stated evidence-based judgement; it is not a prediction model. MNT-0249-018 is already active repair work, not a spill clean-up. Its report describes the failed ESP motor and says an RCA should start before the next repair closes. The “last repair” column is the latest recorded job, whether scheduled or corrective.

#### Sources

- **CTX-0249-004**: WELL-0249 trip note, 13 Jan
- **CTX-0498-006**: WELL-0498 trip note, 12 Jan
- **CTX-0498-004**: WELL-0498 trip note, 9 Jan
- **CTX-0498-005**: WELL-0498 trip note, 11 Jan
- **CTX-0430-004**: WELL-0430 trip note, 8 Jan
- **CTX-0219-006**: WELL-0219 trip note, 5 Jan
- **CTX-0344-004**: WELL-0344 trip note, 4 Jan
- **CTX-0352-003**: WELL-0352 trip note, 10 Jan
- **CTX-0548-002**: WELL-0548 trip note, 26 Dec
- **CTX-0485-002**: WELL-0485 trip note, 9 Jan
- **CTX-0434-003**: WELL-0434 trip note, 26 Dec
- **CTX-0329-002**: WELL-0329 trip note, 26 Dec
- **INS-0249-0120**: WELL-0249 inspection, 14 Jan, non-producing
- **INS-0249-0119**: WELL-0249 inspection, 7 Jan, non-producing
- **INS-0498-0219**: WELL-0498 inspection, 14 Jan
- **INS-0498-0218**: WELL-0498 inspection, 7 Jan, panel dark
- **INS-0498-0217**: WELL-0498 inspection, 31 Dec, non-producing
- **INS-0430-0219**: WELL-0430 inspection, 14 Jan
- **INS-0430-0216**: WELL-0430 inspection, 24 Dec, non-producing
- **INS-0430-0215**: WELL-0430 inspection, 17 Dec, non-producing
- **INS-0430-0214**: WELL-0430 inspection, 10 Dec, cold remark
- **INS-0219-0171**: WELL-0219 inspection, 14 Jan, no-flow remark
- **INS-0344-0219**: WELL-0344 inspection, 14 Jan
- **INS-0352-0218**: WELL-0352 inspection, 7 Jan
- **INS-0548-0215**: WELL-0548 inspection, 14 Jan
- **INS-0485-0204**: WELL-0485 inspection, 14 Jan
- **INS-0434-0216**: WELL-0434 inspection, 14 Jan
- **INS-0329-0218**: WELL-0329 inspection, 14 Jan
- **MNT-0249-018**: WELL-0249 interim ESP motor repair report
- **MNT-0498-031**: WELL-0498 separator controller repair report

### Turn 2 — Robert Hayes

#### Three wells to send a crew to first this week

Priority judgement from operator notes and current inspection/repair evidence

Evidence reviewed through 15 Jan 2027. The ranking prioritizes active, unresolved symptoms and recent non-producing inspections; it is a field-priority judgement, not a prediction of failure probability.

**Dispatch priority**

WELL-0249 is already under an open ESP motor-burnout repair and remains non-producing; coordinate with that crew rather than treating it as a separate spill-clean-up job. WELL-0219 has the strongest immediate evidence of persistent trouble: new unstable-current and trip notes plus a latest non-producing reading. WELL-0498 has recurrent drive trips and two recent non-producing readings, although its latest inspection shows production restored.

| Rank | Well | Area | Operator-note evidence (date and quote) | Other warning signs in the data | Last repair on the well |
| --- | --- | --- | --- | --- | --- |
| 1 | WELL-0249 | Southeast Block 31 | 13 Jan — Marcus Lee: “WELL-0249 drive tripping on underload, restarted from the panel.” | Latest inspection INS-0249-0120 (14 Jan, drone) found not producing: delta 5.9 °C, below the T500 threshold of 25 °C. Previous 7 Jan inspection was also not producing (2.6 °C delta). Current repair report says failed ESP motor windings; RCA should start before next repair closure. | MNT-0249-018 — ESP motor burnout; started 9 Jan 2027; still open. Report: interim work, failed motor windings, and about 22 extra shut-in days expected for workover-rig availability. |
| 2 | WELL-0219 | Southeast Block 31 | 13 Jan — Marcus Lee: “Drive on WELL-0219 showing amps hunting between 38 and 44 A.” Also 5 Jan, Kayla Morgan: “WELL-0219 drive tripping on underload, restarted from the panel.” | Latest inspection INS-0219-0171 (14 Jan, manual) found not producing: 4.5 °C delta vs 25 °C T500 threshold; inspector also remarked “No flow noise at the wellhead.” Inspections on 3, 10, 17, 24 and 31 Dec and 7 Jan were producing, so the 14 Jan reading marks a recent change. | MNT-0219-022 — scheduled wellhead valve service; started 24 Nov 2026; closed. The latest corrective repair found is MNT-0219-020, wellhead cable-penetrator leak, started 21 Aug 2026 and closed 2 Sep; report notes the penetrator seal was replaced. No repair is recorded since the Jan operator warnings. |
| 3 | WELL-0498 | Southeast Block 32 | 12 Jan — Derek Walsh: “WELL-0498 drive tripping on underload, restarted from the panel.” Also similar notes on 9 Jan and 11 Jan. | Repeated trips documented on 9, 11 and 12 Jan. Inspections 31 Dec and 7 Jan were not producing (deltas 6.5 and 8.8 °C vs 25 °C), with 7 Jan remark “Drive panel dark”; latest inspection 14 Jan was producing (36.8 °C delta). MNT-0498-031 report documents a separator level-controller fault, repaired and returned to production. | MNT-0498-031 — separator level-controller fault; started 3 Jan 2027; closed 13 Jan. Report says the failed controller was replaced, tested, and the well returned to production. |

Crew suggestion: inspect the drive/ESP status and current trends at WELL-0249 and WELL-0219 first; then verify the recent WELL-0498 trips despite its producing latest reading. Repairs are not inferred from operator notes: only recorded jobs are listed.

#### Sources

- **CTX-0249-004**: WELL-0249 operator note, 13 Jan
- **CTX-0219-007**: WELL-0219 operator note, 13 Jan
- **CTX-0219-006**: WELL-0219 operator note, 5 Jan
- **CTX-0498-006**: WELL-0498 operator note, 12 Jan
- **CTX-0498-005**: WELL-0498 operator note, 11 Jan
- **CTX-0498-004**: WELL-0498 operator note, 9 Jan
- **INS-0249-0120**: WELL-0249 latest inspection, 14 Jan
- **INS-0249-0119**: WELL-0249 inspection, 7 Jan
- **INS-0219-0171**: WELL-0219 latest inspection and no-flow remark, 14 Jan
- **INS-0219-0170**: WELL-0219 inspection, 7 Jan
- **INS-0219-0169**: WELL-0219 inspection, 31 Dec
- **INS-0219-0168**: WELL-0219 inspection, 24 Dec
- **INS-0219-0167**: WELL-0219 inspection, 17 Dec
- **INS-0219-0166**: WELL-0219 inspection, 10 Dec
- **INS-0219-0165**: WELL-0219 inspection, 3 Dec
- **INS-0498-0219**: WELL-0498 latest inspection, 14 Jan
- **INS-0498-0218**: WELL-0498 inspection and drive-panel remark, 7 Jan
- **INS-0498-0217**: WELL-0498 inspection, 31 Dec
- **MNT-0249-018**: WELL-0249 interim ESP motor repair report
- **MNT-0249-018**: WELL-0249 open ESP motor burnout job
- **MNT-0219-022**: WELL-0219 latest scheduled wellhead service
- **MNT-0219-020**: WELL-0219 prior corrective penetrator-seal repair
- **MNT-0219-020**: WELL-0219 penetrator-seal repair report
- **MNT-0498-031**: WELL-0498 separator controller repair
- **MNT-0498-031**: WELL-0498 separator controller repair report
- **OM-T500 §3**: T500 producing threshold: 25 °C above ambient
- **CTX-0498-003**: WELL-0498 flowline walk note, 18 Dec

---

## Q8. Who told you that?

### Turn 1 — Nathan Pierce

#### WELL-0333 recalled pump — replacement reported, not verified

You asked that it count as replaced from now on. I recorded your report as shared knowledge; the maintenance system does not yet confirm the replacement.

**Counted on your report only**

I recorded that you, Nathan Pierce, report the recalled pump was swapped out yesterday and that the work order is not in the system yet. This is an unverified replacement report, not a verified maintenance record.

| Fact | Finding | Source |
| --- | --- | --- |
| Well and area | WELL-0333; Northwest Block 12; T200 | WELL-0333 well metadata |
| Recalled pump in system record | Repair report MNT-0333-024 lists a Highline RP-175 pump, serial SN-507591, lot LOT-2409-A, installed during the 9 May 2026 repair. | MNT-0333-024 repair report |
| Current inspection | INS-0333-0219, 14 Jan 2027: producing by temperature, delta 25.8 °C above ambient; T200 threshold is 15 °C. | INS-0333-0219; OM-T200 §9.3 |
| Replacement work order | No downhole-pump repair is recorded from 1 Dec 2026 through 15 Jan 2027. The latest recorded pump replacement was MNT-0333-024, started 9 May 2026. | WELL-0333 maintenance records, queried through 15 Jan 2027 |
| New shared note | KN-0001: you report the recalled pump was swapped yesterday; no work order is in the system yet. The reported replacement is not independently confirmed. | KN-0001, Nathan Pierce |

The supplier notice recalls RP-175 pumps from LOT-2409-A, LOT-2409-C and LOT-2410-B and requires replacement by 31 Dec 2026. MNT-0333-024 documents LOT-2409-A installed, and no later pump replacement work order was found. I have saved your statement as an unverified shared note—not as a verified replacement or a producing-status claim. Please provide the replacement work-order ID (and confirmation of the replacement date) so the maintenance record can be checked.

I checked your earlier conversation history for this topic and found no matching earlier conversation. This response is shown in the table format you requested.

#### Sources

- **KN-0001**: Nathan Pierce's shared note reporting the pump swap; work order not yet in system
- **MNT-0333-024**: Repair report: pump model, serial, lot and installation
- **INS-0333-0219**: Latest inspection, 14 Jan 2027
- **OM-T200 §9.3**: T200 producing threshold
- **supplier-recall-notice-2026-12-01**: Recalled pump lots and replacement deadline
- **WELL-0333 maintenance records through 2027-01-15**: No post-report pump replacement repair recorded

### Turn 2 — Nathan Pierce

**Saved for your answers**

PREF-1: I’ll sort listed wells by area name, then well ID, and show costs in thousands of USD. This preference is private to you, Nathan, and applies to your later answers.

No costs or well list are part of this preference confirmation; the cost format and sorting rule will apply when relevant.

| Preference | Setting | Source |
| --- | --- | --- |
| Well-list order | Area name ascending, then well ID ascending | PREF-1, saved at your request |
| Cost units | Thousands of US dollars (USD thousands) | PREF-1, saved at your request |
| Scope | Your future answers only | PREF-1, Nathan Pierce's private preference |

#### Sources

- **PREF-1**: Your saved private preference: sort listed wells by area then well ID; show costs in thousands of dollars

### Turn 3 — Robert Hayes

#### Recalled pumps still in the ground

As of 15 Jan 2027 · Records-only assessment

I found 18 wells with a report recording installation of a Highline RP-175 pump from recalled lots LOT-2409-A, LOT-2409-C or LOT-2410-B, and no later recorded recalled-pump replacement through 15 Jan 2027. These are the wells where the recalled pump appears to remain in the ground based on available maintenance reports. The supplier notice required replacement by 31 Dec 2026.

| Well | Area | Installed pump / serial | Installation repair | Evidence source |
| --- | --- | --- | --- | --- |
| WELL-0031 | Southwest Block 23 | LOT-2409-A · SN-664877 | MNT-0031-027 · 24 Apr 2026 | Repair report |
| WELL-0156 | Northeast Block 8 | LOT-2409-A · SN-952958 | MNT-0156-027 · 27 Jun 2026 | Repair report |
| WELL-0160 | Northeast Block 8 | LOT-2409-C · SN-429965 | MNT-0160-028 · 18 Jul 2026 | Repair report |
| WELL-0263 | Southwest Block 23 | LOT-2410-B · SN-187332 | MNT-0263-033 · 16 Oct 2026 | Repair report |
| WELL-0305 | Northwest Block 12 | LOT-2409-A · SN-978137 | MNT-0305-032 · 16 Oct 2026 | Repair report |
| WELL-0333 | Northwest Block 12 | LOT-2409-A · SN-507591 | MNT-0333-024 · 9 May 2026 | Repair report |
| WELL-0340 | Northwest Block 12 | LOT-2409-A · SN-443750 | MNT-0340-031 · 3 Apr 2026 | Repair report |
| WELL-0345 | Northwest Block 12 | LOT-2410-B · SN-109024 | MNT-0345-036 · 8 Aug 2026 | Repair report |
| WELL-0398 | Northwest Block 12 | LOT-2409-C · SN-170133 | MNT-0398-018 · 15 Mar 2026 | Repair report |
| WELL-0426 | Northwest Block 12 | LOT-2409-C · SN-880271 | MNT-0426-030 · 19 Jun 2026 | Repair report |
| WELL-0427 | Northwest Block 12 | LOT-2409-C · SN-529288 | MNT-0427-020 · 14 Feb 2026 | Repair report |
| WELL-0428 | Northwest Block 12 | LOT-2410-B · SN-708611 | MNT-0428-022 · 7 Mar 2026 | Repair report |
| WELL-0460 | Southeast Block 32 | LOT-2410-B · SN-756677 | MNT-0460-029 · 11 Jan 2026 | Repair report |
| WELL-0475 | Southeast Block 32 | LOT-2409-A · SN-238063 | MNT-0475-030 · 19 Jul 2026 | Repair report |
| WELL-0517 | Southeast Block 32 | LOT-2409-A · SN-774640 | MNT-0517-021 · 24 Jan 2026 | Repair report |
| WELL-0577 | Southeast Block 32 | LOT-2409-A · SN-757468 | MNT-0577-028 · 31 Jul 2026 | Repair report |
| WELL-0595 | Southeast Block 32 | LOT-2409-C · SN-252906 | MNT-0595-028 · 16 Aug 2026 | Repair report |
| WELL-0595 | Southeast Block 32 | LOT-2409-C · SN-252906 | MNT-0595-028 · 16 Aug 2026 | Repair report |

**Basis and limits**

Each installation is evidenced by the repair report's “Parts installed” line (model, lot and serial). The records also show later recalled-pump replacements for WELL-0302, WELL-0340, WELL-0345, WELL-0398, WELL-0427, WELL-0460, WELL-0475, WELL-0517 and WELL-0595; these were excluded. A repair record cannot independently verify what is physically in the ground today, so treat the table as records-based and confirm against current well/pump records before scheduling. Source: supplier recall notice HPC-RN-2026-07 dated 1 Dec 2026; replacement deadline 31 Dec 2026.

#### Sources

- **supplier-recall-notice-2026-12-01**: Affected Highline RP-175 lots and 31 Dec 2026 replacement deadline
- **MNT-0031-027**: WELL-0031 pump lot and serial
- **MNT-0156-027**: WELL-0156 pump lot and serial
- **MNT-0160-028**: WELL-0160 pump lot and serial
- **MNT-0263-033**: WELL-0263 pump lot and serial
- **MNT-0305-032**: WELL-0305 pump lot and serial
- **MNT-0333-024**: WELL-0333 pump lot and serial
- **MNT-0340-031**: WELL-0340 pump lot and serial
- **MNT-0345-036**: WELL-0345 pump lot and serial
- **MNT-0398-018**: WELL-0398 pump lot and serial
- **MNT-0426-030**: WELL-0426 pump lot and serial
- **MNT-0427-020**: WELL-0427 pump lot and serial
- **MNT-0428-022**: WELL-0428 pump lot and serial
- **MNT-0460-029**: WELL-0460 pump lot and serial
- **MNT-0475-030**: WELL-0475 pump lot and serial
- **MNT-0517-021**: WELL-0517 pump lot and serial
- **MNT-0577-028**: WELL-0577 pump lot and serial
- **MNT-0595-028**: WELL-0595 pump lot and serial
- **MNT-0302-031, MNT-0340-038, MNT-0345-039, MNT-0398-025, MNT-0427-025, MNT-0460-035, MNT-0475-034, MNT-0517-030, MNT-0595-031**: Later recorded recalled-pump replacements excluded from the still-installed list
- **supplier-recall-notice-2026-12-01**: Recalled lots LOT-2409-A, LOT-2409-C and LOT-2410-B; pumps from other lots and ESP pumps excluded

### Turn 4 — Olivia Grant

#### WELL-0577 — recalled pump remains on the records-based recall list

The reported swap is unverified; I can’t remove it based only on a second-hand report.

The source is your statement: Nathan told you the recalled pump was swapped. The maintenance records show MNT-0577-028, started 31 Jul 2026, pulled and replaced the downhole pump, but its report identifies the installed pump as a Highline RP-175, serial SN-757468, lot LOT-2409-A—a recalled lot. No later downhole-pump replacement repair is recorded through 15 Jan 2027. The report does not verify Nathan’s later-reported swap.

| Record | Evidence |
| --- | --- |
| Nathan’s reported swap | Second-hand statement relayed by Olivia Grant; date of the alleged swap not provided. |
| MNT-0577-028 | Repair report says a new pump was installed on 11 Aug 2026: Highline RP-175, SN-757468, LOT-2409-A. |
| Later replacement record | No later downhole-pump replacement repair is recorded through 15 Jan 2027. |

**Do not treat as cleared yet**

I recorded your note as unverified, not as a confirmed equipment replacement. Please provide the replacement work order or other confirmation, including the replacement date and pump lot/serial, so the recall record can be checked.

Recorded shared note KN-0002: “Nathan told me the recalled Highline RP-175 pump on WELL-0577 was swapped as well; this replacement is unverified and no work order has been provided.”

#### Sources

- **KN-0002**: Olivia Grant’s note reporting Nathan’s unverified pump swap
- **MNT-0577-028**: Pump replacement and installed pump lot/serial
- **MNT-0577-028**: Downhole-pump replacement recorded 31 Jul 2026
- **INS-0577-0211**: Latest inspection record, 14 Jan 2027

### Turn 5 — Nathan Pierce

#### Recalled pumps still in the ground — Northwest Block 12

As of 15 Jan 2027 · You’re in Northwest Block 12, based on the area recorded for WELL-0333.

**One recorded recalled pump remains**

WELL-0333 is the only confirmed remaining recalled pump I found in your area. Its recorded installed pump is a Highline RP-175, serial SN-507591, lot LOT-2409-A. Repair report MNT-0333-024 lists total installation-job cost of $15.440 thousand USD. The report does not break out pump-only cost from the total.

| Well | Area | Pump / serial / lot | Installation repair (date) | Total repair cost (USD thousands) | Evidence of still in ground |
| --- | --- | --- | --- | --- | --- |
| WELL-0333 | Northwest Block 12 | Highline RP-175 · SN-507591 · LOT-2409-A | MNT-0333-024 · started 9 May 2026 | 15.44 | The report records this pump installed; no later pump-replacement repair is recorded in the searched maintenance records through 15 Jan 2027. |

The supplier recall covers RP-175 pumps from LOT-2409-A, LOT-2409-C and LOT-2410-B, with replacement required by 31 Dec 2026. I checked Northwest Block 12’s downhole-pump repairs and reports for later recalled-pump replacements; five recall replacement repairs in the area document new, unaffected lots. WELL-0333’s 2026-10-17 shared note says Nathan Pierce reported a swap “yesterday,” but says the work order was not yet in the system and the replacement was not independently confirmed. I have therefore not treated that report as a verified replacement. Please provide the work-order ID or confirmation so the pump record can be reconciled.

Costs are shown in USD thousands, and wells are ordered by area then well ID, following your saved preference PREF-1.

#### Sources

- **MNT-0333-024**: Installed pump details, installation date and total repair-job cost
- **MNT-0333-024**: Recorded downhole-pump repair
- **KN-0001**: Nathan Pierce's unverified pump-swap report; work order not yet recorded
- **supplier-recall-notice-2026-12-01**: Recalled pump model/lots and 31 Dec 2026 replacement deadline
- **MNT-0302-031**: Recall replacement; report records unaffected replacement lot
- **MNT-0340-038**: Recall replacement; report records unaffected replacement lot
- **MNT-0345-039**: Recall replacement; report records unaffected replacement lot
- **MNT-0398-025**: Recall replacement; report records unaffected replacement lot
- **MNT-0427-025**: Recall replacement; report records unaffected replacement lot
- **PREF-1**: Your saved preference: area then well ID; costs in USD thousands

---

## Q9. One conversation, several topics

### Turn 1 — Robert Hayes

#### 9 recalled pumps still appear to be in the ground

Records-based assessment as of 15 Jan 2027

The maintenance reports record installation of Highline RP-175 pumps from the recalled lots, with no later recorded recalled-pump replacement for these wells. This is based on maintenance records, not physical verification.

| Area | Wells | Count |
| --- | --- | --- |
| Northeast Block 8 | WELL-0156, WELL-0160 | 2 |
| Northwest Block 12 | WELL-0305, WELL-0333, WELL-0426, WELL-0428 | 4 |
| Southeast Block 32 | WELL-0577 | 1 |
| Southwest Block 23 | WELL-0031, WELL-0263 | 2 |

The supplier notice lists lots LOT-2409-A, LOT-2409-C and LOT-2410-B as recalled and sets a 31 Dec 2026 replacement deadline. Confirm against current pump records or in the field before treating these as physically verified; recorded replacements exclude wells only when the maintenance record identifies a recalled-pump replacement.

#### Sources

- **supplier-recall-notice-2026-12-01**: Affected Highline RP-175 lots and replacement deadline
- **MNT-0156-027**: WELL-0156 recalled pump installation
- **MNT-0160-028**: WELL-0160 recalled pump installation
- **MNT-0305-032**: WELL-0305 recalled pump installation
- **MNT-0333-024**: WELL-0333 recalled pump installation
- **MNT-0426-030**: WELL-0426 recalled pump installation
- **MNT-0428-022**: WELL-0428 recalled pump installation
- **MNT-0577-028**: WELL-0577 recalled pump installation
- **MNT-0031-027**: WELL-0031 recalled pump installation
- **MNT-0263-033**: WELL-0263 recalled pump installation
- **MNT-0302-031**: WELL-0302 recalled pump replacement, excluded
- **MNT-0340-038**: WELL-0340 recalled pump replacement, excluded
- **MNT-0345-039**: WELL-0345 recalled pump replacement, excluded
- **MNT-0398-025**: WELL-0398 recalled pump replacement, excluded
- **MNT-0427-025**: WELL-0427 recalled pump replacement, excluded
- **MNT-0460-035**: WELL-0460 recalled pump replacement, excluded
- **MNT-0475-034**: WELL-0475 recalled pump replacement, excluded
- **MNT-0517-030**: WELL-0517 recalled pump replacement, excluded

### Turn 2 — Robert Hayes

#### Northwest Production

Team lead and well count

- **Team lead:** I couldn't verify from the available records
- **Wells in Northwest Block 12:** 150

The fleet records identify Northwest Block 12 and 150 wells there, but don't provide a team-lead directory or confirm that this area is the full scope of Northwest Production. I can't reliably name the team lead or claim this is the team's total.

#### Sources

- **fleet team directory**: No team-lead information available in the queried fleet records

### Turn 3 — Robert Hayes

#### Cold-weather rule and a missed check

December 2026

SOP-OPS OPS-5 says that from 1 Dec through 28 Feb, a producing well inspected at ambient temperature of −5 °C or colder needs a heat trace check. A maintenance job with “Heat trace check” in its issue must start within 7 days after that inspection.

One missed check: WELL-0310, Northwest Block 12. Brandon Shaw inspected it on 17 Dec 2026; ambient was −6 °C and it was producing. No qualifying heat trace check repair is recorded within the following 7 days.

#### Sources

- **INS-0310-0213**: WELL-0310, 17 Dec 2026, ambient −6 °C, producing
- **SOP-OPS §OPS-5**: Freeze protection and 7-day heat trace check requirement

### Turn 4 — Robert Hayes

#### H₂S reading at WELL-0332

Gas-odor note dated 3 Dec 2026

**No H₂S reading recorded**

The operator note says gas odor was reported near the WELL-0332 wellhead and the area was flagged off; it does not include an H₂S measurement. The drone inspection that day also provides temperatures, not an H₂S result.

I found no associated repair report recording a monitor reading for that gas-odor report, so I can't give a ppm value. The separate 20 Nov flowline-repair report records a highest H₂S monitor reading of 0 ppm during that repair—not a measurement from 3 Dec.

#### Sources

- **CTX-0332-004**: Rachel Dunn's 3 Dec gas-odor note
- **INS-0332-0212**: 3 Dec drone inspection; no H₂S reading
- **MNT-0332-033**: 20 Nov flowline-repair report; H₂S reading applies to that work
- **SOP-OPS §OPS-1**: Gas-odor field response and H₂S monitoring

### Turn 5 — Robert Hayes

#### 2 recalled-pump wells are not producing

Latest inspection evidence as of 15 Jan 2027

Both wells' latest inspections found them below their well-type producing threshold. The table shows their most recent recorded repairs, including open status.

| Well | Area | Latest inspection / result | Last repair | Repair status |
| --- | --- | --- | --- | --- |
| WELL-0160 | Northeast Block 8 | INS-0160-0217 · 14 Jan · 3.8 °C delta vs 15 °C T200 threshold; inspected by drone, Tyler Hughes | MNT-0160-032 · 15 Jan 2027 · walking beam bearing wear | Open |
| WELL-0263 | Southwest Block 23 | INS-0263-0219 · 14 Jan · 4.0 °C delta vs 20 °C T350 threshold; inspected by drone, Sarah Mitchell | MNT-0263-035 · 9 Jan 2027 · flowline corrosion pinhole leak | Open |

For both, the recorded system status is “active” and disagrees with the latest inspection, so it is out of date. No later explicit shut-in or restart note was found to supersede those inspection results. WELL-0160's maintenance record shows its latest repair is open; WELL-0263's latest repair is also open.

#### Sources

- **INS-0160-0217**: WELL-0160 latest inspection and production delta
- **INS-0263-0219**: WELL-0263 latest inspection and production delta
- **MNT-0160-032**: WELL-0160 repair started 15 Jan 2027; open
- **MNT-0263-035**: WELL-0263 repair started 9 Jan 2027; open
- **OM-T200 §9.3**: T200 producing threshold
- **OM-T350 §3**: T350 producing threshold
- **SOP-OPS §OPS-3**: Inspection and explicit shut-in/restart status precedence

### Turn 6 — Robert Hayes

#### First priority: WELL-0263

Southwest Block 23 · recommendation based on evidence through 15 Jan 2027

I would deal with WELL-0263 first: its latest inspection found it not producing, and an active flowline repair is still under way. Its latest inspection also included a warning remark that the pump jack was not moving. The ongoing repair report says the well remains shut in during the work.

**Why this before the other non-producing wells**

WELL-0263 has a confirmed open repair addressing flowline corrosion and a recorded shut-in for that repair. WELL-0160 and WELL-0332 are also below their producing thresholds on their latest inspections, but I found no comparable current open repair report for them in the records reviewed. This is a field-priority judgment, not a failure prediction.

| Well | Latest inspection | Latest repair / current work |
| --- | --- | --- |
| WELL-0263 | INS-0263-0219 · 14 Jan · drone, Sarah Mitchell · T350 delta 4.0 °C vs 20 °C threshold · not producing | MNT-0263-035 · started 9 Jan · flowline corrosion pinhole leak · open; interim report says well shut in during repair |
| WELL-0160 | INS-0160-0217 · 14 Jan · drone, Tyler Hughes · T200 delta 3.8 °C vs 15 °C threshold · not producing | MNT-0160-032 · started 15 Jan · walking beam bearing wear · open |
| WELL-0332 | INS-0332-0217 · 14 Jan · drone, Caleb Whitaker · T200 delta 0.5 °C vs 15 °C threshold · not producing | MNT-0332-033 · started 20 Nov · flowline leak causing spill · completed; no current open repair identified |

The latest recorded system status for all three is “active,” which is out of date because their latest inspections found them below threshold. WELL-0263's most recent inspection, INS-0263-0219, has no remark; the preceding inspection INS-0263-0218 on 7 Jan noted “Pump jack not moving.” The interim report MNT-0263-035 states the well is shut in for its in-progress corrosion repair, expected to finish 19 Jan. A separate note from Ryan Brooks on 14 Jan says “Rod squeal at WELL-0263 stuffing box, greased the polished rod” (CTX-0263-005); it is a recent observation, but does not change the recorded status.

#### Sources

- **INS-0263-0219**: WELL-0263 latest inspection, 14 Jan
- **INS-0263-0218**: WELL-0263 7 Jan inspection remark: pump jack not moving
- **MNT-0263-035**: Open flowline corrosion repair; interim report and shut-in
- **CTX-0263-005**: Ryan Brooks's 14 Jan stuffing-box observation
- **INS-0160-0217**: WELL-0160 latest inspection, 14 Jan
- **MNT-0160-032**: Open walking-beam bearing wear repair
- **INS-0332-0217**: WELL-0332 latest inspection, 14 Jan
- **MNT-0332-033**: Completed flowline spill repair
- **OM-T350 §3**: T350 producing threshold
- **OM-T200 §9.3**: T200 producing threshold
- **SOP-OPS §OPS-3**: Inspection and explicit shut-in/restart status precedence
- **MNT-0263-035**: Repair report confirms work is ongoing and the well is shut in

---

## Q10. What are we waiting on?

**Michael Turner**

Extra shut-in time by area — 2026

**Evidence is incomplete for a fleet-wide breakdown**

The repair reports state extra shut-in days and reasons in free text, which cannot be reliably counted across all 1,183 corrective jobs using the available structured fields. I found and verified examples, but not a complete, consistently classified set. I can’t responsibly present area shares, typical days, or a stacked chart as complete fleet-wide results. The table below is a report-verified sample, not an area-level estimate.

| Area — reason | Verified report examples | Share of categorized examples | Extra days stated | Report evidence |
| --- | --- | --- | --- | --- |
| Northwest Block 12 — parts | 1 | Not calculable | 1 | MNT-0378-024 |
| Northwest Block 12 — contractor scheduling | 1 | Not calculable | 22 | MNT-0103-025 |
| Northwest Block 12 — crew diverted | 1 | Not calculable | 7 | MNT-0314-032 |
| Southeast Block 31 — contractor scheduling | 1 | Not calculable | 2 | MNT-0234-022 |
| Southeast Block 31 — crew diverted | 1 | Not calculable | 10 | MNT-0454-024 |
| Southeast Block 31 — weather | 1 | Not calculable | 15 | MNT-0248-025 |
| Southeast Block 32 — parts | 2 | Not calculable | 2 and 16 | MNT-0342-028; MNT-0474-034 |
| Southeast Block 32 — contractor scheduling | 1 | Not calculable | 8 | MNT-0548-024 |
| Southeast Block 32 — crew diverted | 1 | Not calculable | 10 | MNT-0400-030 |
| Southeast Block 32 — weather | 1 | Not calculable | 3 and 36 | MNT-0469-026; MNT-0587-026 |
| Southwest Block 23 — parts | 1 | Not calculable | 23 | MNT-0299-027 |
| Southwest Block 23 — contractor scheduling | 1 | Not calculable | 10 | MNT-0033-031 |
| Southwest Block 24 — weather | 1 | Not calculable | 36 | MNT-0077-022 |

### Stacked bar chart by area

Not drawn: the verified reports are examples surfaced by report search, not an exhaustive or representative inventory by area. Stacking these partial observations would imply comparable shares and totals that the evidence does not support.

What the checked reports do show: reasons vary across individual cases—parts back-orders, contractor scheduling, crew diversion to higher-priority spill response, and weather/road access. The longest verified example here is 36 extra days due to rain-related access disruption in Southeast Block 32 (MNT-0587-026); this small, search-derived sample cannot establish that Southeast Block 32 stands out overall. “Extra days” comes from the report’s stated well shut-in time beyond the repair itself, not repairs.job_hours. Window: jobs started 1 Jan–31 Dec 2026. No saved visual preference applies.

### Sources

- **MNT-0378-024**: Northwest Block 12: supplier back-order, about 1 extra day
- **MNT-0103-025**: Northwest Block 12: weekday contractor slot, about 22 extra days
- **MNT-0314-032**: Northwest Block 12: crew allocated to spill response, about 7 extra days
- **MNT-0234-022**: Southeast Block 31: weekday contractor slot, about 2 extra days
- **MNT-0454-024**: Southeast Block 32: crew allocated to spill response, about 10 extra days
- **MNT-0248-025**: Southeast Block 31: rain blocked lease-road access, about 15 extra days
- **MNT-0342-028**: Northwest Block 12: back-ordered part, about 2 extra days
- **MNT-0548-024**: Southeast Block 32: weekday contractor slot, about 10 extra days
- **MNT-0400-030**: Northwest Block 12: crew allocated to spill response, about 15 extra days
- **MNT-0469-026**: Southeast Block 32: rain blocked lease-road access, about 3 extra days
- **MNT-0299-027**: Southwest Block 23: supplier back-order, about 23 extra days
- **MNT-0033-031**: Southwest Block 23: weekday contractor slot, about 10 extra days
- **MNT-0587-026**: Southeast Block 32: rain blocked lease-road access, about 36 extra days
- **SOP-WS §3 WS-07**: Maintenance reports are the source for job close-out narrative; delays were taken from report text, not job duration

---

## Q11. Hotter wells

**Olivia Grant**

### Southeast runs hottest overall

Inspection window: 16 Jan 2026–15 Jan 2027

Southeast had the highest average recorded wellhead temperature: 51.40 °C across 10,068 inspections. Northwest averaged 50.32 °C; Southwest 48.89 °C; Northeast 48.75 °C.

That difference is not explained by warmer air: average ambient temperature was similar across regions (Southeast 21.95 °C; Northwest 22.06 °C; Southwest 22.08 °C; Northeast 22.04 °C). But “consistently hotter” depends on the comparison: when comparing producing inspections within each well type using temperature above ambient, Southeast does not lead across the board. It ranks highest for T200 (25.97 °C average delta), while Northeast ranks highest for T350 (31.01 °C) and T500 (36.61 °C).

So, Southeast is the clearest answer for highest overall absolute wellhead temperature over this year, but the data do not show one region consistently hottest after accounting for well type and ambient temperature.

### Sources

- **INS-0001-0216**: Sample inspection record in the comparison window
- **OM-T200 §9.3; OM-T350 §3; OM-T500 §3**: Well-type production thresholds; comparisons use wellhead temperature above ambient
- **Fleet inspection records, 16 Jan 2026–15 Jan 2027**: Regional averages and well-type comparisons
