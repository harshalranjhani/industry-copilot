# Evals

The 18 example questions, run 2026-10-17T08:15:34.206Z on `openai/gpt-6-luna`, graded by `anthropic/claude-sonnet-5.5`.

**Passed 13 of 27 steps (48%), 5 of 18 questions** · answer cost $0.1014 · total answer time 295.7 s

| Step | User | Result | Facts | Sources | Visual | Tokens in / out | Cost | Time |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Q1 | Michael Turner | pass | 6/6 | yes | yes | 46,909 / 387 | $0.0034 | 7.4 s |
| Q2 | Michael Turner | fail | 4/6 | yes | yes | 97,988 / 1,136 | $0.0045 | 14.9 s |
| Q3 | Michael Turner | pass | 2/2 | yes | yes | 71,824 / 1,082 | $0.0041 | 11.4 s |
| Q4 | Michael Turner | fail | 2/3 | yes | yes | 71,783 / 658 | $0.0038 | 9.1 s |
| Q5 | Michael Turner | fail | 1/3 | yes | yes | 47,499 / 289 | $0.0034 | 5.0 s |
| Q6 | Michael Turner | fail | 3/5 | yes | yes | 47,969 / 777 | $0.0036 | 7.8 s |
| Q7 | Michael Turner | fail | 1/5 | yes | yes | 48,262 / 440 | $0.0035 | 5.8 s |
| Q8 | Michael Turner | pass | 5/5 | yes | yes | 49,165 / 361 | $0.0036 | 5.8 s |
| Q9 | Michael Turner | fail | 7/8 | yes | yes | 238,012 / 1,779 | $0.0067 | 27.7 s |
| Q10 | Michael Turner | fail | 3/4 | yes | yes | 49,017 / 470 | $0.0036 | 6.7 s |
| Q11.1 | Michael Turner | pass | 1/1 | yes | yes | 74,414 / 891 | $0.0041 | 10.0 s |
| Q11.2 | Michael Turner | pass | 4/4 | yes | yes | 104,468 / 406 | $0.0044 | 10.9 s |
| Q12.1 | Michael Turner | fail | 3/4 | yes | yes | 101,127 / 550 | $0.0043 | 10.2 s |
| Q12.2 | Michael Turner | fail | 1/2 | yes | yes | 163,980 / 811 | $0.0023 | 17.8 s |
| Q13 | Michael Turner | pass | 5/5 | yes | yes | 127,269 / 855 | $0.0047 | 14.0 s |
| Q14.1 | Michael Turner | pass | 2/2 | yes | yes | 50,834 / 594 | $0.0038 | 7.2 s |
| Q14.2 | Michael Turner | pass | 2/2 | yes | yes | 82,299 / 837 | $0.0016 | 17.6 s |
| Q14.3 | Michael Turner | fail | 3/4 | yes | yes | 51,081 / 873 | $0.0039 | 21.0 s |
| Q15.1 | Jessica Reed | pass | 3/3 | yes | yes | 46,835 / 302 | $0.0034 | 12.5 s |
| Q15.2 | Laura Simmons | fail | 1/3 | yes | yes | 46,439 / 352 | $0.0033 | 12.0 s |
| Q16.1 | Jake Morales | pass | 1/1 | yes | yes | 46,360 / 217 | $0.0032 | 10.9 s |
| Q16.2 | Michael Turner | pass | 2/2 | yes | yes | 50,885 / 332 | $0.0036 | 6.8 s |
| Q16.3 | Jessica Reed | fail | 1/2 | yes | yes | 93,908 / 445 | $0.0039 | 11.3 s |
| Q17.1 | Michael Turner | pass | 1/1 | yes | yes | 50,641 / 186 | $0.0035 | 4.6 s |
| Q17.2 | Tyler Hughes | pass | 3/3 | yes | yes | 94,221 / 528 | $0.0040 | 10.4 s |
| Q17.3 | Jake Morales | fail | 2/3 | yes | yes | 70,264 / 405 | $0.0036 | 7.8 s |
| Q18 | Laura Simmons | fail | 2/3 | yes | yes | 70,440 / 448 | $0.0037 | 9.2 s |

## Details

### Q1: pass

**Michael Turner** (new chat): Is WELL-0001 producing oil right now? When was it last inspected, and by whom?

Expected visual: `none` · matched: yes · sources cited: yes

Matched facts:
- WELL-0001 is not producing oil
- The latest inspection is INS-0001-0203, on 15 Oct 2026, done by drone
- The inspector is Ryan Brooks
- The wellhead was only 3.2 °C warmer than the air, below the T200 limit
- The reason is note CTX-0001-003 by Jake Morales: a planned shut-in from 7 Oct for rod string replacement, expected back around 20 Oct, not yet in the maintenance system
- The recorded status still says active, which is out of date

Grader: ok

Tools: well_snapshot · openai/gpt-6-luna · 46,909 in / 387 out · $0.0034 · 7.4 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([answer, reason, sources])
answer = Card([heading, result, metadata, status])
heading = CardHeader("WELL-0001: not producing oil", "Latest inspection: 15 Oct 2026")
result = TextContent("The latest inspection measured the wellhead 3.2 °C above ambient (25.6 °C vs 22.4 °C), below the T200 producing threshold of 15 °C above ambient.")
metadata = EntityList([inspector, method, area, wellType])
inspector = {left: "Inspected by", right: "Ryan Brooks"}
method = {left: "Method", right: "Drone"}
area = {left: "Area", right: "Southwest Block 23"}
wellType = {left: "Well type", right: "T200"}
status = Callout("warning", "Recorded status is out of date", "The system of record says active, but the latest inspection found the well not producing.")
reason = TextContent("The inspector remarked, “Pump jack not moving.” A valid operator note from Jake Morales says the well was shut in from 7 Oct for a planned rod string replacement, with work expected to finish around 20 Oct; the note says the work order is not yet in the maintenance system.")
sources = Sources([inspectionSource, ruleSource, noteSource])
inspectionSource = SourceItem("inspection", "INS-0001-0203", "Latest inspection, temperatures and inspector remark")
ruleSource = SourceItem("document", "OM-T200 §9.3", "T200 producing threshold")
noteSource = SourceItem("note", "CTX-0001-003", "Planned shut-in and rod string replacement note")
```

</details>

### Q2: fail

**Michael Turner** (new chat): Which wells in Northeast Block 8 are not producing oil right now, and why? Show them in a table.

Expected visual: `table` · matched: yes · sources cited: yes

Matched facts:
- Exactly four wells are not producing: WELL-0164, WELL-0170, WELL-0172 and WELL-0175, all last inspected on 15 Oct 2026
- WELL-0164: wellhead 4.1 °C above air, recorded status active (out of date), no recorded reason; the inspector noted "Pump jack not moving."
- WELL-0175: wellhead 0.4 °C above air, recorded status active (out of date), no recorded reason
- Where nothing explains the stop, the answer says no reason is recorded and suggests a check instead of inventing a cause

Missed facts:
- WELL-0170: wellhead 2.9 °C above air, recorded status down, repair MNT-0170-031 (pump jack walking beam bearing wear) started 19 Sep and still open
- WELL-0172: wellhead 5.7 °C above air, recorded status active (out of date), repair MNT-0172-028 (flowline pinhole leak) started 3 Oct and still open

Grader: Facts 3 and 4 omit the repair start dates (19 Sep for MNT-0170-031, 3 Oct for MNT-0172-028) and give only planned end dates; the other facts, the table and the sources are fine.

Tools: query, well_snapshot, well_snapshot, well_snapshot, well_snapshot, query · openai/gpt-6-luna · 97,988 in / 1,136 out · $0.0045 · 14.9 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([title, summary, table, note, sources])
title = TextContent("Northeast Block 8 — not producing", "large-heavy")
summary = TextContent("Four wells are not producing according to their latest inspections, all dated 15 Oct 2026. Each is a T200; production requires a wellhead temperature at least 15 °C above ambient.")
table = Table([wellCol, inspectionCol, readingCol, reasonCol, statusCol])
wellCol = Col("Well", ["WELL-0164", "WELL-0170", "WELL-0172", "WELL-0175"])
inspectionCol = Col("Latest inspection · inspector", ["INS-0164-0205 · Tyler Hughes (manual)", "INS-0170-0206 · Ashley Bennett (drone)", "INS-0172-0206 · Jessica Reed (drone)", "INS-0175-0204 · Jessica Reed (drone)"])
readingCol = Col("Wellhead − ambient · threshold", ["4.1 °C · 15 °C", "2.9 °C · 15 °C", "5.7 °C · 15 °C", "0.4 °C · 15 °C"])
reasonCol = Col("Recorded reason / context", ["Inspector remark: “Pump jack not moving.” No open repair or valid shut-in note recorded.", "Open corrective pump-jack repair MNT-0170-031 for walking beam bearing wear, planned through 28 Oct 2026.", "Inspector remark: “No stroke observed during flight.” Open corrective flowline repair MNT-0172-028 for a corrosion pinhole leak, planned through 21 Oct 2026.", "No reason is recorded: no inspector remark, open repair, or valid shut-in note. Check with the area team or arrange a field visit."])
statusCol = Col("Recorded status", ["Active — out of date", "Down — agrees", "Active — out of date", "Active — out of date"])
note = Callout("info", "Interpreting the reasons", "The open repairs are recorded work, not confirmed causes of the wells’ non-producing readings. For WELL-0164 and WELL-0172, the inspector remarks are observations, not established causes. Producing status is based on temperature difference, not absolute wellhead temperature.")
sources = Sources([src1, src2, src3, src4, src5, src6, src7, src8, src9, src10, src11, src12])
src1 = SourceItem("inspection", "INS-0164-0205", "WELL-0164 latest inspection and inspector remark")
src2 = SourceItem("inspection", "INS-0170-0206", "WELL-0170 latest inspection")
src3 = SourceItem("inspection", "INS-0172-0206", "WELL-0172 latest inspection and inspector remark")
src4 = SourceItem("inspection", "INS-0175-0204", "WELL-0175 latest inspection")
src5 = SourceItem("repair", "MNT-0170-031", "Open corrective pump-jack repair")
src6 = SourceItem("repair", "MNT-0172-028", "Open corrective flowline repair")
src7 = SourceItem("document", "OM-T200 §9.3", "T200 producing threshold")
src8 = SourceItem("document", "WELL-0164 metadata", "Area, type, and recorded status")
src9 = SourceItem("document", "WELL-0170 metadata", "Area, type, and recorded status")
src10 = SourceItem("document", "WELL-0172 metadata", "Area, type, and recorded status")
src11 = SourceItem("document", "WELL-0175 metadata", "Area, type, and recorded status")
src12 = SourceItem("document", "OM-T200 §4", "Planned shut-in recording procedure")
```

</details>

### Q3: pass

**Michael Turner** (new chat): Show a line chart of WELL-0001's wellhead temperature against air temperature for the last 13 weeks, and mark when it was not producing oil.

Expected visual: `line_chart` · matched: yes · sources cited: yes

Matched facts:
- The chart has 13 weekly readings, from 23 Jul to 15 Oct 2026
- WELL-0001 was not producing oil on 8 Oct and 15 Oct, and only on those dates, and the chart marks them

Grader: ok

Tools: query, query · openai/gpt-6-luna · 71,824 in / 1,082 out · $0.0041 · 11.4 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([header, chartCard, notProducing, sources])
header = TextContent("WELL-0001 temperatures — last 13 inspections", "large-heavy")
chartCard = Card([chartTitle, chart])
chartTitle = CardHeader("Wellhead vs. ambient temperature", "Weekly readings; dates marked ✕ were below the T200 producing threshold.")
chart = LineChart(dates, [wellheadSeries, ambientSeries], "linear", "Inspection date", "Temperature (°C)")
wellheadSeries = Series("Wellhead temperature", wellheadTemps)
ambientSeries = Series("Air (ambient) temperature", ambientTemps)
notProducing = Callout("warning", "Not producing oil", "INS-0001-0202 on 8 Oct 2026 and INS-0001-0203 on 15 Oct 2026: each was 3.2 °C above ambient, below the T200 threshold of 15 °C. These dates are marked ✕ in the chart.")
sources = Sources([i0191, i0192, i0193, i0194, i0195, i0196, i0197, i0198, i0199, i0200, i0201, i0202, i0203, rule])
i0191 = SourceItem("inspection", "INS-0001-0191", "23 Jul 2026 temperatures and production")
i0192 = SourceItem("inspection", "INS-0001-0192", "30 Jul 2026 temperatures and production")
i0193 = SourceItem("inspection", "INS-0001-0193", "6 Aug 2026 temperatures and production")
i0194 = SourceItem("inspection", "INS-0001-0194", "13 Aug 2026 temperatures and production")
i0195 = SourceItem("inspection", "INS-0001-0195", "20 Aug 2026 temperatures and production")
i0196 = SourceItem("inspection", "INS-0001-0196", "27 Aug 2026 temperatures and production")
i0197 = SourceItem("inspection", "INS-0001-0197", "3 Sep 2026 temperatures and production")
i0198 = SourceItem("inspection", "INS-0001-0198", "10 Sep 2026 temperatures and production")
i0199 = SourceItem("inspection", "INS-0001-0199", "17 Sep 2026 temperatures and production")
i0200 = SourceItem("inspection", "INS-0001-0200", "24 Sep 2026 temperatures and production")
i0201 = SourceItem("inspection", "INS-0001-0201", "1 Oct 2026 temperatures and production")
i0202 = SourceItem("inspection", "INS-0001-0202", "8 Oct 2026 temperatures and production")
i0203 = SourceItem("inspection", "INS-0001-0203", "15 Oct 2026 temperatures and production")
rule = SourceItem("document", "OM-T200 §9.3", "T200 producing threshold: 15 °C above ambient")
dates = ["23 Jul", "30 Jul", "6 Aug", "13 Aug", "20 Aug", "27 Aug", "3 Sep", "10 Sep", "17 Sep", "24 Sep", "1 Oct", "8 Oct ✕ not producing", "15 Oct ✕ not producing"]
wellheadTemps = [61.2, 58.2, 65.0, 60.6, 59.3, 61.2, 65.2, 52.8, 53.6, 45.7, 50.4, 23.4, 25.6]
ambientTemps = [33.1, 32.0, 35.1, 34.0, 36.3, 34.4, 34.5, 27.2, 31.2, 23.6, 23.0, 20.2, 22.4]
```

</details>

### Q4: fail

**Michael Turner** (new chat): How many oil spills has WELL-0001 had in the last 4 years, and how much oil in total? List them in a table.

Expected visual: `table` · matched: yes · sources cited: yes

Matched facts:
- WELL-0001 had 6 spills totalling 15.1 barrels
- The spills are 16 Mar 2023 (0.5 bbl), 27 Apr 2023 (2.6 bbl), 28 Sep 2023 (3.3 bbl), 19 Oct 2023 (0.3 bbl), 11 Jun 2026 (6.8 bbl) and 1 Oct 2026 (1.6 bbl)

Missed facts:
- There were 7 detections, but INS-0001-0070 (7 Mar 2024) was corrected as rainwater (CTX-0001-001) and does not count

Grader: Fact 3 is missing: the answer never states that there were 7 detections or that INS-0001-0070 (7 Mar 2024) was corrected as rainwater (CTX-0001-001); it only says generically that corrected detections are excluded.

Tools: query, query · openai/gpt-6-luna · 71,783 in / 658 out · $0.0038 · 9.1 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([summary, table, note, sources])
summary = Card([header, total])
header = CardHeader("WELL-0001 oil spills — last 4 years", "17 Oct 2022–17 Oct 2026")
total = TextContent("6 spills; 15.1 bbl total.", "large-heavy")
table = Table([idCol, dateCol, volumeCol, classCol, areaCol, notesCol])
idCol = Col("Inspection", ["INS-0001-0021", "INS-0001-0027", "INS-0001-0048", "INS-0001-0051", "INS-0001-0185", "INS-0001-0201"])
dateCol = Col("Date", ["16 Mar 2023", "27 Apr 2023", "28 Sep 2023", "19 Oct 2023", "11 Jun 2026", "1 Oct 2026"])
volumeCol = Col("Oil volume (bbl)", [0.5, 2.6, 3.3, 0.3, 6.8, 1.6], "number")
classCol = Col("Spill class", ["Minor", "Moderate", "Moderate", "Minor", "Reportable", "Moderate"])
areaCol = Col("Pad area (%)", [2.7, 6.6, 10.3, 0.8, 9.4, 4], "number")
notesCol = Col("Inspection note", ["Dark staining on pad.", "Oil sheen around cellar.", "Staining along flowline route.", "Staining along flowline route.", "Crude pooled around flowline coupling, ~9% of pad affected.", "Dark staining on pad."])
note = TextContent("Counts and volumes include real spills only; detections removed by correction are excluded.")
sources = Sources([src1, src2])
src1 = SourceItem("inspection", "INS-0001-0021, INS-0001-0027, INS-0001-0048, INS-0001-0051, INS-0001-0185, INS-0001-0201", "WELL-0001 spill inspections and volumes")
src2 = SourceItem("document", "SOP-SR §3", "Spill classification thresholds")
```

</details>

### Q5: fail

**Michael Turner** (new chat): How many days was WELL-0001 down in 2025?

Expected visual: `none` · matched: yes · sources cited: yes

Matched facts:
- WELL-0001 was down 21 days in 2025, from three weekly inspections where it was not producing oil

Missed facts:
- 24 Jul 2025: the wellhead read 51.6 °C but the air was 43.1 °C, only 8.5 °C warmer, so it was not producing; the cause was the prime mover tripping (MNT-0001-021)
- 16 Oct and 23 Oct 2025: a stuffing box packing leak (MNT-0001-023)

Grader: States 21 days from three inspections, but omits the 24 Jul temperature evidence and MNT-0001-021 (prime mover trip) and the 16/23 Oct stuffing box leak (MNT-0001-023).

Tools: query · openai/gpt-6-luna · 47,499 in / 289 out · $0.0034 · 5.0 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([answer, basis, sources])
answer = Card([header, result])
header = CardHeader("WELL-0001 downtime in 2025")
result = TextContent("WELL-0001 was recorded as down for **21 days** in 2025, based on three inspections that found it not producing. The downtime convention assigns 7 days per such inspection.")
basis = TextContent("Inspections: INS-0001-0140, INS-0001-0152, and INS-0001-0153.")
sources = Sources([src1, src2])
src1 = SourceItem("inspection", "INS-0001-0140, INS-0001-0152, INS-0001-0153", "2025 inspections that found WELL-0001 not producing")
src2 = SourceItem("document", "SOP-RC §2 RC-03", "Downtime reporting threshold")
```

</details>

### Q6: fail

**Michael Turner** (new chat): Which 3 wells in Northeast Block 7 had the most downtime in the last 4 months? Show a bar chart.

Expected visual: `bar_chart` · matched: yes · sources cited: yes

Matched facts:
- WELL-0121 had 49 days of downtime (T200)
- WELL-0138 had 42 days (T350)
- WELL-0107 had 42 days (T350)

Missed facts:
- The window is 16 Jun to 16 Oct 2026
- The next well, WELL-0119, had 28 days, so it is not in the top three

Grader: The window is stated as 17 Jun–17 Oct rather than 16 Jun–16 Oct, and WELL-0119 at 28 days is not mentioned; the three downtime values are correct.

Tools: query · openai/gpt-6-luna · 47,969 in / 777 out · $0.0036 · 7.8 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([title, summary, chartCard, sources])
title = TextContent("Top 3 wells by downtime — Northeast Block 7", "large-heavy")
summary = TextContent("In the last four months (17 Jun–17 Oct 2026), WELL-0121 recorded 49 days of downtime. WELL-0107 and WELL-0138 each recorded 42 days.")
chartCard = Card([chartHeader, chart])
chartHeader = CardHeader("Downtime by well", "Days recorded from non-producing inspections")
chart = BarChart(wells, [downtimeSeries], "grouped", "Well", "Downtime (days)")
wells = ["WELL-0121", "WELL-0107", "WELL-0138"]
downtimeSeries = Series("Downtime days", [49, 42, 42])
sources = Sources([src1, src2, src3, src4, src5, src6, src7, src8, src9, src10, src11, src12, src13, src14, src15])
src1 = SourceItem("inspection", "INS-0121-0189", "WELL-0121 non-producing inspection")
src2 = SourceItem("inspection", "INS-0121-0200", "WELL-0121 non-producing inspection")
src3 = SourceItem("inspection", "INS-0121-0201", "WELL-0121 non-producing inspection")
src4 = SourceItem("inspection", "INS-0121-0202", "WELL-0121 non-producing inspection")
src5 = SourceItem("inspection", "INS-0121-0203", "WELL-0121 non-producing inspection")
src6 = SourceItem("inspection", "INS-0121-0205", "WELL-0121 non-producing inspection")
src7 = SourceItem("inspection", "INS-0121-0206", "WELL-0121 non-producing inspection")
src8 = SourceItem("inspection", "INS-0107-0194", "WELL-0107 non-producing inspection")
src9 = SourceItem("inspection", "INS-0107-0195", "WELL-0107 non-producing inspection")
src10 = SourceItem("inspection", "INS-0107-0196", "WELL-0107 non-producing inspection")
src11 = SourceItem("inspection", "INS-0107-0197", "WELL-0107 non-producing inspection")
src12 = SourceItem("inspection", "INS-0107-0198", "WELL-0107 non-producing inspection")
src13 = SourceItem("inspection", "INS-0107-0199", "WELL-0107 non-producing inspection")
src14 = SourceItem("inspection", "INS-0138-0195", "WELL-0138 non-producing inspection")
src15 = SourceItem("inspection", "INS-0138-0196, INS-0138-0200, INS-0138-0201, INS-0138-0206, INS-0138-0207", "WELL-0138 non-producing inspections")
```

</details>

### Q7: fail

**Michael Turner** (new chat): Show on a map every well in Northeast Block 8 with a real spill in the last 90 days.

Expected visual: `map` · matched: yes · sources cited: yes

Matched facts:
- The map has exactly 4 wells: WELL-0151, WELL-0165, WELL-0175 and WELL-0186

Missed facts:
- WELL-0151: 24 Sep 2026, 4.5 bbl, at 32.12246, -102.18445
- WELL-0165: 30 Jul 2026, 1.2 bbl, at 32.15665, -102.14522
- WELL-0175: 30 Jul 2026, 3.9 bbl, at 32.18020, -102.14790
- WELL-0186: 23 Jul 2026, 0.6 bbl, at 32.17552, -102.17775

Grader: The map shows the 4 correct wells, but spill dates and volumes are missing, so facts 2-5 are incomplete (coordinates match, but dates and bbl are absent).

Tools: query · openai/gpt-6-luna · 48,262 in / 440 out · $0.0035 · 5.8 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([heading, mapCard, sources])
heading = TextContent("Real spills in Northeast Block 8 — last 90 days", "large-heavy")
mapCard = Card([map])
map = GeoMap(points)
points = [{lat: 32.12246, lon: -102.18445, label: "WELL-0151", detail: "1 real spill · INS-0151-0201"}, {lat: 32.15665, lon: -102.14522, label: "WELL-0165", detail: "1 real spill · INS-0165-0194"}, {lat: 32.1802, lon: -102.1479, label: "WELL-0175", detail: "1 real spill · INS-0175-0193"}, {lat: 32.17552, lon: -102.17775, label: "WELL-0186", detail: "1 real spill · INS-0186-0097"}]
sources = Sources([src1, src2, src3, src4])
src1 = SourceItem("inspection", "INS-0151-0201", "WELL-0151 spill inspection")
src2 = SourceItem("inspection", "INS-0165-0194", "WELL-0165 spill inspection")
src3 = SourceItem("inspection", "INS-0175-0193", "WELL-0175 spill inspection")
src4 = SourceItem("inspection", "INS-0186-0097", "WELL-0186 spill inspection")
```

</details>

### Q8: pass

**Michael Turner** (new chat): Show a heatmap of 2026 spills by geographic area and month.

Expected visual: `heatmap` · matched: yes · sources cited: yes

Matched facts:
- The heatmap covers areas by the months Jan to Oct 2026, with corrected detections removed
- Southwest Block 23 by month Jan to Oct: 4, 3, 3, 6, 3, 4, 4, 3, 3, 2; total 35
- Southwest Block 24 by month Jan to Oct: 7, 4, 5, 6, 5, 5, 3, 1, 5, 2; total 43
- Northeast Block 7 by month Jan to Oct: 5, 3, 2, 4, 6, 6, 2, 4, 4, 1; total 37
- Northeast Block 8 by month Jan to Oct: 4, 4, 4, 3, 2, 4, 4, 0, 1, 0; total 26

Grader: ok

Tools: query · openai/gpt-6-luna · 49,165 in / 361 out · $0.0036 · 5.8 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([heading, heatmap, note, sources])
heading = TextContent("2026 spills by geographic area and month", "large-heavy")
heatmap = Heatmap(areas, months, values)
note = TextContent("Counts include real spills only; detections removed by correction are excluded. Months with no spills are shown as 0.")
sources = Sources([spillSource])
spillSource = SourceItem("inspection", "2026 spill records", "Real spills grouped by area and inspection month")
areas = ["Northeast Block 7", "Northeast Block 8", "Southwest Block 23", "Southwest Block 24"]
months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"]
values = [[5, 3, 2, 4, 6, 6, 2, 4, 4, 1], [4, 4, 4, 3, 2, 4, 4, 0, 1, 0], [4, 3, 3, 6, 3, 4, 4, 3, 3, 2], [7, 4, 5, 6, 5, 5, 3, 1, 5, 2]]
```

</details>

### Q9: fail

**Michael Turner** (new chat): Which rules has WELL-0001 broken in the last 12 months, and what is still open?

Expected visual: `table` · matched: yes · sources cited: yes

Matched facts:
- There are four breaches, all from the 11 Jun 2026 spill of 6.8 bbl, and USD 5,000 in fines is still open
- SR-01: reported after 41 hours (REG-0001-001) against a 24-hour limit, which led to notice of violation REG-0001-002 with a USD 5,000 fine, still open
- SR-02: contained after about 7 hours against a 4-hour limit, found only in the June repair report
- SR-03: cleanup verification was due by 10 Aug 2026 and is still open (REG-0001-003)
- RC-04: the notice needed a response by 30 Jul 2026 and none is recorded
- Open actions, not counted as breaches: a root-cause analysis is due on the flowline (3 corrective repairs: MNT-0001-028, MNT-0001-029, MNT-0001-032; the October repair report marks it "Action required")
- The yearly flowline test (RC-02) was done on 7 Mar 2026, so that rule was met

Missed facts:
- Open action: the planned shut-in from 7 Oct is not yet recorded in the maintenance system, which the T200 manual requires before work starts (note CTX-0001-003)

Grader: Fact 7 is missing: the planned 7 Oct shut-in not yet in the maintenance system (CTX-0001-003) is not mentioned. Fact 1 omits the 6.8 bbl spill volume but is otherwise stated, so it is counted.

Tools: query, query, query, query, query, read_report, read_report, query · openai/gpt-6-luna · 238,012 in / 1,779 out · $0.0067 · 27.7 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([heading, summary, breachesHeader, breachTable, openActions, annualTest, openFine, sources], "column", "m")
heading = TextContent("WELL-0001 — rules broken and still open (last 12 months)", "large-heavy")
summary = TextContent("For 17 Oct 2025–17 Oct 2026, the records show three breached spill-response duties from the 11 Jun 2026 reportable spill, plus an overdue RC-04 response. The 1 Oct 2026 moderate spill’s SR-02 containment was met; it did not require SR-01 or SR-03.")
breachesHeader = InlineHeader("Breaches", "Breached deadlines are listed separately from actions still open.")
breachTable = Table([protocolCol, limitCol, actualCol, evidenceCol])
protocolCol = Col("Protocol", ["SR-01 — written notice", "SR-02 — containment", "SR-03 — agency verification", "RC-04 — response to notice of violation"])
limitCol = Col("Limit", ["Within 24 hours of discovery", "Within 4 hours of discovery", "Verification within 60 days; due 10 Aug 2026", "Within 30 days of notice; due 30 Jul 2026"])
actualCol = Col("Actual", ["Filed 41 hours after discovery; breached late", "Contained in 7 hours; breached late", "Still pending after due date; breached open", "No response filed by deadline; breached open"])
evidenceCol = Col("Evidence", ["INS-0001-0185; REG-0001-001; MNT-0001-029 report", "INS-0001-0185; MNT-0001-029 report", "INS-0001-0185; REG-0001-003; MNT-0001-029 report", "REG-0001-002"])
openActions = Callout("warning", "Still open — not additional breaches", "SR-03 agency verification remains open after a site inspection on 14 Jul 2026 reported remediation verification pending (REG-0001-003). RC-04 response to the 30 Jun notice remains unfiled and is already counted above as a breached-open duty. A root-cause analysis is due for the flowline before the next repair closes: 3 corrective repairs in the 12-month window, MNT-0001-028, MNT-0001-029 and MNT-0001-032. This RCA is an open action, not a breach. No open repair was returned for WELL-0001.")
annualTest = TextContent("RC-02 annual flowline integrity test: met. Repair MNT-0001-026 was completed 7 Mar 2026. The 2 Oct spill repair’s report also says its SR-02 containment was met at about 1.7 hours, within the 4-hour limit.")
openFine = Callout("warning", "Open fine", "REG-0001-002 carries an open fine of USD 5,000.")
sources = Sources([srcInspection185, srcInspection201, srcRepair026, srcRepair028, srcRepair029, srcRepair032, srcReg001, srcReg002, srcReg003, srcReport029, srcReport032, srcSr01, srcSr02, srcSr03, srcRc04, srcRc02, srcManual])
srcInspection185 = SourceItem("inspection", "INS-0001-0185", "11 Jun 2026 reportable spill discovery")
srcInspection201 = SourceItem("inspection", "INS-0001-0201", "1 Oct 2026 moderate spill discovery")
srcRepair026 = SourceItem("repair", "MNT-0001-026", "2026 annual flowline integrity test")
srcRepair028 = SourceItem("repair", "MNT-0001-028", "Flowline corrective repair in RCA window")
srcRepair029 = SourceItem("repair", "MNT-0001-029", "Flowline corrective repair; June spill")
srcRepair032 = SourceItem("repair", "MNT-0001-032", "Flowline corrective repair; October spill")
srcReg001 = SourceItem("regulator_event", "REG-0001-001", "Late SR-01 spill report filing")
srcReg002 = SourceItem("regulator_event", "REG-0001-002", "Open notice of violation and RC-04 response due")
srcReg003 = SourceItem("regulator_event", "REG-0001-003", "SR-03 site inspection; verification pending")
srcReport029 = SourceItem("report", "MNT-0001-029", "June repair report and spill compliance checks")
srcReport032 = SourceItem("report", "MNT-0001-032", "October repair report and compliance checks")
srcSr01 = SourceItem("document", "SOP-SR §4 SR-01", "Written spill notice deadline")
srcSr02 = SourceItem("document", "SOP-SR §4 SR-02", "Containment limit")
srcSr03 = SourceItem("document", "SOP-SR §4 SR-03", "Agency verification deadline")
srcRc04 = SourceItem("document", "SOP-RC §2 RC-04", "Notice-of-violation response deadline")
srcRc02 = SourceItem("document", "SOP-RC §2 RC-02", "Annual flowline integrity test")
srcManual = SourceItem("document", "OM-T200 §10", "Flowline RCA escalation rule")
```

</details>

### Q10: fail

**Michael Turner** (new chat): In Southwest Block 24, which spills in the last 90 days were not contained within the SOP time limit?

Expected visual: `table` · matched: yes · sources cited: yes

Matched facts:
- Exactly 2 spills exceeded the 4-hour containment limit
- WELL-0082: contained after about 7.1 hours (report MNT-0082-028, inspection INS-0082-0198)
- WELL-0100: contained after about 8.1 hours (report MNT-0100-034, inspection INS-0100-0196)

Missed facts:
- The containment time comes from the repair reports

Grader: Fact 4 is not stated explicitly: the repair report IDs appear in a column, but the answer never says the containment times come from the repair reports.

Tools: query · openai/gpt-6-luna · 49,017 in / 470 out · $0.0036 · 6.7 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([title, summary, results, sources])
title = TextContent("Southwest Block 24 — spills not contained within the SOP limit", "large-heavy")
summary = TextContent("In the last 90 days, 2 spills exceeded the SR-02 containment limit of 4 hours.")
results = Table([spillCol, wellCol, dateCol, volumeCol, containmentCol, repairCol])
spillCol = Col("Inspection", ["INS-0082-0198", "INS-0100-0196"])
wellCol = Col("Well", ["WELL-0082", "WELL-0100"])
dateCol = Col("Discovered", ["2026-09-10", "2026-09-10"])
volumeCol = Col("Spill volume (bbl)", [0.7, 0.4], "number")
containmentCol = Col("Containment time (limit 4 h)", ["7.1 h — breached late", "8.1 h — breached late"])
repairCol = Col("Repair report", ["MNT-0082-028", "MNT-0100-034"])
sources = Sources([src1, src2, src3])
src1 = SourceItem("inspection", "INS-0082-0198", "WELL-0082 spill discovered 2026-09-10")
src2 = SourceItem("inspection", "INS-0100-0196", "WELL-0100 spill discovered 2026-09-10")
src3 = SourceItem("document", "SOP-SR §4 SR-02", "Containment required within 4 hours of discovery")
```

</details>

### Q11.1: pass

**Michael Turner** (new chat): Which 3 wells in Northeast Block 7 had the most downtime in the last 4 months? Show a bar chart.

Expected visual: `bar_chart` · matched: yes · sources cited: yes

Matched facts:
- WELL-0121 had 49 days of downtime, WELL-0138 had 42 days and WELL-0107 had 42 days

Grader: ok

Tools: query, query · openai/gpt-6-luna · 74,414 in / 891 out · $0.0041 · 10.0 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([title, chartCard, sources])
title = TextContent("Top 3 wells by downtime — Northeast Block 7", "large-heavy")
chartCard = Card([chartHeader, chart])
chartHeader = CardHeader("Downtime in the last 4 months", "18 Jun–17 Oct 2026; 7 days per inspection that found a well not producing")
chart = BarChart(labels, [downtimeSeries], "grouped", "Well", "Downtime (days)")
labels = ["WELL-0121", "WELL-0107", "WELL-0138"]
downtimeSeries = Series("Downtime (days)", [49, 42, 42])
sources = Sources([src1, src2, src3, src4, src5, src6, src7, src8, src9, src10, src11, src12, src13, src14, src15, src16, src17, src18, src19])
src1 = SourceItem("inspection", "INS-0121-0189", "WELL-0121 downtime inspection")
src2 = SourceItem("inspection", "INS-0121-0200", "WELL-0121 downtime inspection")
src3 = SourceItem("inspection", "INS-0121-0201", "WELL-0121 downtime inspection")
src4 = SourceItem("inspection", "INS-0121-0202", "WELL-0121 downtime inspection")
src5 = SourceItem("inspection", "INS-0121-0203", "WELL-0121 downtime inspection")
src6 = SourceItem("inspection", "INS-0121-0205", "WELL-0121 downtime inspection")
src7 = SourceItem("inspection", "INS-0121-0206", "WELL-0121 downtime inspection")
src8 = SourceItem("inspection", "INS-0107-0194", "WELL-0107 downtime inspection")
src9 = SourceItem("inspection", "INS-0107-0195", "WELL-0107 downtime inspection")
src10 = SourceItem("inspection", "INS-0107-0196", "WELL-0107 downtime inspection")
src11 = SourceItem("inspection", "INS-0107-0197", "WELL-0107 downtime inspection")
src12 = SourceItem("inspection", "INS-0107-0198", "WELL-0107 downtime inspection")
src13 = SourceItem("inspection", "INS-0107-0199", "WELL-0107 downtime inspection")
src14 = SourceItem("inspection", "INS-0138-0195", "WELL-0138 downtime inspection")
src15 = SourceItem("inspection", "INS-0138-0196", "WELL-0138 downtime inspection")
src16 = SourceItem("inspection", "INS-0138-0200", "WELL-0138 downtime inspection")
src17 = SourceItem("inspection", "INS-0138-0201", "WELL-0138 downtime inspection")
src18 = SourceItem("inspection", "INS-0138-0206", "WELL-0138 downtime inspection")
src19 = SourceItem("inspection", "INS-0138-0207", "WELL-0138 downtime inspection")
```

</details>

### Q11.2: pass

**Michael Turner** (new chat): For the three wells we discussed yesterday, what have repairs cost this year?

Expected visual: `none` · matched: yes · sources cited: yes

Matched facts:
- WELL-0121: USD 25,794
- WELL-0138: USD 46,942
- WELL-0107: USD 5,176
- The three wells are the ones from Michael Turner's earlier conversation (WELL-0121, WELL-0138, WELL-0107)

Grader: ok

Tools: recall_my_conversations, recall_my_conversations, query · openai/gpt-6-luna · 104,468 in / 406 out · $0.0044 · 10.9 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([answerCard, sources])
answerCard = Card([heading, repairTable, totalNote])
heading = CardHeader("2026 repair costs", "The three wells we discussed yesterday in Northeast Block 7")
repairTable = Table([wellCol, countCol, costCol])
wellCol = Col("Well", ["WELL-0121", "WELL-0107", "WELL-0138"])
countCol = Col("Repairs", [7, 6, 10], "number")
costCol = Col("Repair cost (USD)", [25794, 5176, 46942], "number")
totalNote = TextContent("Costs are based on repairs started from 1 Jan through 17 Oct 2026. Total across the three wells: $77,912.")
sources = Sources([src1, src2, src3])
src1 = SourceItem("repair", "WELL-0121 repairs started 2026", "2026 repair costs and count")
src2 = SourceItem("repair", "WELL-0107 repairs started 2026", "2026 repair costs and count")
src3 = SourceItem("repair", "WELL-0138 repairs started 2026", "2026 repair costs and count")
```

</details>

### Q12.1: fail

**Michael Turner** (new chat): The 15 Oct reading for WELL-0164 is wrong. The handheld thermal gun used in that inspection was faulty; the field crew re-measured the wellhead at 41.0 °C.

Expected visual: `none` · matched: yes · sources cited: yes

Matched facts:
- The correction is recorded against inspection INS-0164-0205
- With 41.0 °C against 19.9 °C air (21.1 °C warmer, above the T200 limit), WELL-0164 is producing oil
- The answer points out that the same inspection has the note "Pump jack not moving." (by Tyler Hughes), which disagrees with the correction, and asks Michael Turner to confirm

Missed facts:
- The original value (24.0 °C) is kept, and the answer notes who corrected it (Michael Turner) and why (faulty thermal gun)

Grader: Omits the faulty thermal gun reason for the correction, so fact 2 is incomplete; the confirmation request is not addressed to Michael Turner by name.

Tools: query, record_knowledge, well_snapshot · openai/gpt-6-luna · 101,127 in / 550 out · $0.0043 · 10.2 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([card, conflict, sources])
card = Card([header, summary, details, correctedTag])
header = CardHeader("WELL-0164 — corrected reading", "Inspection INS-0164-0205 · 15 Oct 2026 · Northeast Block 8")
summary = Callout("success", "Now classified as producing", "The wellhead reading was corrected from 24.0 °C to 41.0 °C. With ambient at 19.9 °C, the corrected delta is 21.1 °C, above the T200 threshold of 15 °C.")
details = TextContent("Recorded by Tyler Hughes using a manual inspection. Recorded status is active and agrees with the corrected inspection.")
correctedTag = Tag("corrected by Michael Turner", null, "sm", "info")
conflict = Callout("warning", "Inspector remark conflicts with the corrected result", "Tyler Hughes's remark on INS-0164-0205 says: “Pump jack not moving.” The corrected temperature indicates producing, but the remark disagrees. Please confirm the reading and whether the pump jack was moving.")
sources = Sources([inspectionSrc, wellSrc, ruleSrc, correctionSrc])
inspectionSrc = SourceItem("inspection", "INS-0164-0205", "15 Oct inspection, inspector remark and corrected reading")
wellSrc = SourceItem("document", "WELL-0164 metadata", "Well type, area and recorded status")
ruleSrc = SourceItem("document", "OM-T200 §9.3", "T200 producing threshold")
correctionSrc = SourceItem("knowledge", "KN-0001", "Correction recorded by Michael Turner")
```

</details>

### Q12.2: fail

**Michael Turner** (continued chat): Which wells in Northeast Block 8 are not producing oil right now, and why? Show them in a table.

Expected visual: `table` · matched: yes · sources cited: yes

Matched facts:
- Three wells are not producing: WELL-0170, WELL-0172 and WELL-0175

Missed facts:
- WELL-0164 is no longer listed, and the answer says why (its 15 Oct reading was corrected to 41.0 °C)

Grader: The table lists WELL-0170, WELL-0172 and WELL-0175, but it never says WELL-0164 was dropped because its 15 Oct reading was corrected to 41.0 °C.

Tools: query, query, well_snapshot, well_snapshot, well_snapshot · openai/gpt-6-luna · 163,980 in / 811 out · $0.0023 · 17.8 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([title, note, table, sourceBlock])
title = TextContent("Northeast Block 8 — not producing oil", "large-heavy")
note = TextContent("Based on each well’s latest inspection. The T200 threshold is 15 °C above ambient. WELL-0172 and WELL-0175 have recorded status “active,” which is out of date because their latest inspections found them not producing.")
table = Table([wellCol, inspectionCol, deltaCol, reasonCol, statusCol])
wellCol = Col("Well", wells)
inspectionCol = Col("Latest inspection", inspections)
deltaCol = Col("Delta / threshold (°C)", deltas)
reasonCol = Col("Recorded reason for stop", reasons)
statusCol = Col("Recorded status", statuses)
wells = ["WELL-0170", "WELL-0172", "WELL-0175"]
inspections = ["INS-0170-0206 · 15 Oct 2026", "INS-0172-0206 · 15 Oct 2026", "INS-0175-0204 · 15 Oct 2026"]
deltas = ["2.9 / 15", "5.7 / 15", "0.4 / 15"]
reasons = ["Open repair: walking beam bearing wear (MNT-0170-031).", "Open repair: flowline corrosion pinhole leak (MNT-0172-028). Inspector remark: “No stroke observed during flight.”", "No reason is recorded. Consider a field visit or confirming with Northeast Block 8’s team."]
statuses = ["Down (agrees)", "Active — out of date", "Active — out of date"]
sourceBlock = Sources([i1, i2, i3, r1, r2, rule])
i1 = SourceItem("inspection", "INS-0170-0206", "Latest inspection, WELL-0170")
i2 = SourceItem("inspection", "INS-0172-0206", "Latest inspection and inspector remark, WELL-0172")
i3 = SourceItem("inspection", "INS-0175-0204", "Latest inspection, WELL-0175")
r1 = SourceItem("repair", "MNT-0170-031", "Open pump jack repair: walking beam bearing wear")
r2 = SourceItem("repair", "MNT-0172-028", "Open flowline repair: corrosion pinhole leak")
rule = SourceItem("document", "OM-T200 §9.3", "T200 producing threshold of 15 °C above ambient")
```

</details>

### Q13: pass

**Michael Turner** (new chat): The AI estimated the 24 Sep spill at WELL-0151 as 4.5 bbl. The field crew measured 5.4 bbl.

Expected visual: `none` · matched: yes · sources cited: yes

Matched facts:
- The corrected volume of 5.4 bbl is recorded against inspection INS-0151-0201, keeping the AI's estimate (4.5 bbl) for reference
- At 5.4 bbl the spill is reportable under the Spill Response SOP; a written notice was due within 24 hours of the 24 Sep 15:30 inspection and none is recorded, so a possible SR-01 breach is flagged
- Repair report MNT-0151-025 classed the spill as "moderate" and listed no reporting duty; that was based on the old estimate and no longer holds
- The same report already shows containment took about 6.4 hours, an SR-02 breach
- Agency verification of the clean-up (SR-03) is now due within 60 days, by 23 Nov 2026

Grader: ok

Tools: query, query, query, record_knowledge · openai/gpt-6-luna · 127,269 in / 855 out · $0.0047 · 14.0 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([card, sources])
card = Card([header, correction, effect, breach, openAction, conflict])
header = CardHeader("WELL-0151 spill volume corrected", "Inspection INS-0151-0201 · 24 Sep 2026")
correction = TextContent("Recorded your measured volume of 5.4 bbl, replacing the AI estimate of 4.5 bbl. The spill is now classified as reportable, so an SR-01 written notice is required.")
effect = TextContent("The SR-01 deadline was 25 Sep 2026 at 15:30 UTC. No written notice is recorded; this is a possible SR-01 breach. SR-02 containment was breached late (6.4 hours against the 4-hour limit). SR-03 verification is pending and due by 23 Nov 2026.")
breach = Callout("warning", "Compliance changed", "The volume correction changes the class from moderate to reportable. The repair report MNT-0151-025 states moderate, so its stated class and reporting duties no longer hold.")
openAction = Callout("info", "Open action — not a breach", "Agency verification under SR-03 is pending; due 23 Nov 2026.")
conflict = TextContent("Conflict to confirm: inspector Ashley Bennett's remark on INS-0151-0201 was “Oil sheen around cellar.” This remark does not address the measured volume. The correction is recorded; please confirm the crew measurement.")
originalTag = Tag("4.5 bbl → 5.4 bbl · corrected by Michael Turner", Icon("ruler", "tools"), "sm", "info")
sources = Sources([srcInspection, srcKnowledge, srcReport, srcSr01, srcSr02, srcSr03])
srcInspection = SourceItem("inspection", "INS-0151-0201", "24 Sep spill inspection")
srcKnowledge = SourceItem("knowledge", "KN-0002", "Measured volume correction")
srcReport = SourceItem("report", "MNT-0151-025", "Repair report; containment time and stated class")
srcSr01 = SourceItem("document", "SOP-SR §4 SR-01", "Written notice requirement")
srcSr02 = SourceItem("document", "SOP-SR §4 SR-02", "Containment limit")
srcSr03 = SourceItem("document", "SOP-SR §4 SR-03", "Agency verification requirement")
```

</details>

### Q14.1: pass

**Michael Turner** (new chat): Which wells in Northeast Block 7 need a root-cause analysis on their pump jack?

Expected visual: `table` · matched: yes · sources cited: yes

Matched facts:
- WELL-0108, WELL-0121 and WELL-0138 need one, each with 3 corrective pump jack repairs in the last 12 months
- The rule comes from the T200 manual section 10 (the T350 manual refers to it)

Grader: ok

Tools: query · openai/gpt-6-luna · 50,834 in / 594 out · $0.0038 · 7.2 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([header, summary, table, rule, sources])
header = CardHeader("Pump-jack root-cause analyses due", "Northeast Block 7 · corrective repairs in the 12-month window from 17 Oct 2025")
summary = TextContent("Three wells meet the RCA threshold: WELL-0108, WELL-0121 and WELL-0138.")
table = Table([wellCol, typeCol, repairCountCol, repairsCol])
wellCol = Col("Well", ["WELL-0108", "WELL-0121", "WELL-0138"])
typeCol = Col("Well type", ["T350", "T200", "T350"])
repairCountCol = Col("Corrective pump-jack repairs", [3, 3, 3], "number")
repairsCol = Col("Repairs", ["MNT-0108-024, MNT-0108-026, MNT-0108-028", "MNT-0121-031, MNT-0121-034, MNT-0121-035", "MNT-0138-031, MNT-0138-032, MNT-0138-034"])
rule = TextContent("The applicable threshold is 3 corrective repairs on the same equipment kind within 12 months; an RCA is due before the next repair is closed. The records identify OM-T200 §10 as the rule source for all three wells.")
sources = Sources([well0108, well0121, well0138, ruleSource])
well0108 = SourceItem("repair", "MNT-0108-024, MNT-0108-026, MNT-0108-028", "WELL-0108 pump-jack corrective repairs")
well0121 = SourceItem("repair", "MNT-0121-031, MNT-0121-034, MNT-0121-035", "WELL-0121 pump-jack corrective repairs")
well0138 = SourceItem("repair", "MNT-0138-031, MNT-0138-032, MNT-0138-034", "WELL-0138 pump-jack corrective repairs")
ruleSource = SourceItem("document", "OM-T200 §10", "RCA threshold and 12-month window")
```

</details>

### Q14.2: pass

**Michael Turner** (continued chat): Note for all T350 wells: our team now wants a pump jack root-cause analysis after 2 repairs, not 3.

Expected visual: `none` · matched: yes · sources cited: yes

Matched facts:
- The rule is recorded for the T350 well type only, attributed to Michael Turner
- The answer says it overrides the manual's 3-repair threshold for T350 wells

Grader: ok

Tools: record_knowledge, query · openai/gpt-6-luna · 82,299 in / 837 out · $0.0016 · 17.6 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([header, recorded, ruleEffect, table, sources])
header = CardHeader("Pump-jack root-cause analyses due", "Northeast Block 7 · current after the T350 rule update")
recorded = Callout("success", "Rule recorded", "Michael Turner’s team rule sets the T350 pump-jack RCA threshold at 2 corrective repairs, replacing the manual threshold of 3 for T350 wells only. The update made WELL-0120 newly due in Northeast Block 7; no conflicts were reported.")
ruleEffect = TextContent("WELL-0121 is T200, so it remains governed by the manual’s 3-repair threshold. All listed wells have reached their applicable threshold within the 12-month window beginning 17 Oct 2025.")
table = Table([wellCol, typeCol, countCol, thresholdCol, repairCol])
wellCol = Col("Well", ["WELL-0108", "WELL-0120", "WELL-0121", "WELL-0138"])
typeCol = Col("Well type", ["T350", "T350", "T200", "T350"])
countCol = Col("Corrective pump-jack repairs", [3, 2, 3, 3], "number")
thresholdCol = Col("RCA threshold", ["2 (team rule)", "2 (team rule)", "3 (manual)", "2 (team rule)"])
repairCol = Col("Repairs", ["MNT-0108-024, MNT-0108-026, MNT-0108-028", "MNT-0120-025, MNT-0120-030", "MNT-0121-031, MNT-0121-034, MNT-0121-035", "MNT-0138-031, MNT-0138-032, MNT-0138-034"])
sources = Sources([ruleKnowledge, manual, repair0108, repair0120, repair0121, repair0138])
ruleKnowledge = SourceItem("knowledge", "KN-0003", "Michael Turner’s T350 RCA threshold override")
manual = SourceItem("document", "OM-T200 §10", "Manual RCA threshold and 12-month window; applies to WELL-0121")
repair0108 = SourceItem("repair", "MNT-0108-024, MNT-0108-026, MNT-0108-028", "WELL-0108 corrective pump-jack repairs")
repair0120 = SourceItem("repair", "MNT-0120-025, MNT-0120-030", "WELL-0120 corrective pump-jack repairs")
repair0121 = SourceItem("repair", "MNT-0121-031, MNT-0121-034, MNT-0121-035", "WELL-0121 corrective pump-jack repairs")
repair0138 = SourceItem("repair", "MNT-0138-031, MNT-0138-032, MNT-0138-034", "WELL-0138 corrective pump-jack repairs")
```

</details>

### Q14.3: fail

**Michael Turner** (new chat): Which wells in Northeast Block 7 need a root-cause analysis on their pump jack?

Expected visual: `table` · matched: yes · sources cited: yes

Matched facts:
- WELL-0108, WELL-0120, WELL-0121 and WELL-0138 need one
- WELL-0120 is a T350 well with 2 repairs, so it is now added
- The answer says this follows Michael Turner's rule, not the manual

Missed facts:
- WELL-0102 also has 2 repairs but is a T200 well, so it is not added

Grader: Fact 3 is missing: the answer never mentions WELL-0102 with 2 repairs as a T200 well that is not added. Facts 1, 2 and 4 are covered, and the table and sources are present.

Tools: query · openai/gpt-6-luna · 51,081 in / 873 out · $0.0039 · 21.0 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([card, sources])
card = Card([header, summary, tbl, ruleNote])
header = CardHeader("Pump jack root-cause analyses due", "Northeast Block 7 · 12-month window from 17 Oct 2025")
summary = TextContent("Four wells meet their applicable RCA threshold.")
tbl = Table([wellCol, typeCol, countCol, thresholdCol, repairsCol])
wellCol = Col("Well", wells)
typeCol = Col("Well type", types)
countCol = Col("Corrective repairs", counts, "number")
thresholdCol = Col("RCA threshold", thresholds, "number")
repairsCol = Col("Repair IDs", repairIds)
wells = ["WELL-0108", "WELL-0120", "WELL-0121", "WELL-0138"]
types = ["T350", "T350", "T200", "T350"]
counts = [3, 2, 3, 3]
thresholds = [2, 2, 3, 2]
repairIds = ["MNT-0108-024, MNT-0108-026, MNT-0108-028", "MNT-0120-025, MNT-0120-030", "MNT-0121-031, MNT-0121-034, MNT-0121-035", "MNT-0138-031, MNT-0138-032, MNT-0138-034"]
ruleNote = TextContent("The T350 wells follow Michael Turner’s team rule: pump jack RCA after 2 corrective repairs, replacing the manual threshold of 3 for T350 only. WELL-0121 is T200 and remains governed by OM-T200 §10, so its 3 repairs meet the manual threshold.")
sources = Sources([src1, src2, src3, src4, src5, src6, src7, src8, src9, src10, src11, src12, src13])
src1 = SourceItem("repair", "MNT-0108-024", "WELL-0108 pump jack repair")
src2 = SourceItem("repair", "MNT-0108-026", "WELL-0108 pump jack repair")
src3 = SourceItem("repair", "MNT-0108-028", "WELL-0108 pump jack repair")
src4 = SourceItem("repair", "MNT-0120-025", "WELL-0120 pump jack repair")
src5 = SourceItem("repair", "MNT-0120-030", "WELL-0120 pump jack repair")
src6 = SourceItem("repair", "MNT-0121-031", "WELL-0121 pump jack repair")
src7 = SourceItem("repair", "MNT-0121-034", "WELL-0121 pump jack repair")
src8 = SourceItem("repair", "MNT-0121-035", "WELL-0121 pump jack repair")
src9 = SourceItem("repair", "MNT-0138-031", "WELL-0138 pump jack repair")
src10 = SourceItem("repair", "MNT-0138-032", "WELL-0138 pump jack repair")
src11 = SourceItem("repair", "MNT-0138-034", "WELL-0138 pump jack repair")
src12 = SourceItem("knowledge", "KN-0003", "Michael Turner’s T350 pump jack RCA rule")
src13 = SourceItem("document", "OM-T200 §10", "Manual RCA threshold for T200")
```

</details>

### Q15.1: pass

**Jessica Reed** (new chat): Is WELL-0164 producing oil right now?

Expected visual: `none` · matched: yes · sources cited: yes

Matched facts:
- Yes, WELL-0164 is producing oil, based on the corrected reading of 41.0 °C
- The answer says the 15 Oct value was corrected by Michael Turner
- The answer mentions the inspector's "Pump jack not moving." note, which disagrees with the correction

Grader: ok

Tools: well_snapshot · openai/gpt-6-luna · 46,835 in / 302 out · $0.0034 · 12.5 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([card, sources])
card = Card([header, status, readings, remark])
header = CardHeader("WELL-0164 — producing oil", "Latest inspection INS-0164-0205 · 15 Oct 2026")
status = Callout("success", "Yes — producing by the temperature rule", "The corrected wellhead temperature is 41.0 °C and ambient temperature is 19.9 °C, a 21.1 °C delta. That exceeds the T200 threshold of 15 °C.")
readings = TextContent("Wellhead temperature was corrected from 24.0 °C to 41.0 °C by Michael Turner (KN-0001). The inspection was manual, performed by Tyler Hughes.")
remark = TextContent("Inspector remark: “Pump jack not moving.” This remark conflicts with the temperature-based producing result; it is a remark, not a recorded cause.")
sources = Sources([src1, src2, src3])
src1 = SourceItem("inspection", "INS-0164-0205", "Latest inspection and temperature readings")
src2 = SourceItem("knowledge", "KN-0001", "Wellhead temperature correction by Michael Turner")
src3 = SourceItem("document", "OM-T200 §9.3", "T200 producing threshold")
```

</details>

### Q15.2: fail

**Laura Simmons** (new chat): Which spills in Northeast Block 8 in the last 90 days needed a report to the regulator?

Expected visual: `table` · matched: yes · sources cited: yes

Matched facts:
- No written notice is on record for it, so it is flagged as overdue

Missed facts:
- WELL-0151 needed a report, because its volume was corrected to 5.4 bbl
- No other spill in that period reached 5 bbl

Grader: Names WELL-0151 at 5.4 bbl and flags the missing written notice as overdue, but never says the volume was corrected, and never states that no other spill reached 5 bbl.

Tools: query · openai/gpt-6-luna · 46,439 in / 352 out · $0.0033 · 12.0 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([answer, sources])
answer = Card([header, result, caveat])
header = CardHeader("Regulator-reportable spill", "Northeast Block 8 · last 90 days through 17 Oct 2026")
result = Table([Col("Well", wells), Col("Discovered", dates), Col("Volume (bbl)", volumes, "number"), Col("Class", classes), Col("SR-01 status", statuses)])
wells = ["WELL-0151"]
dates = ["24 Sep 2026"]
volumes = [5.4]
classes = ["Reportable"]
statuses = ["Breach open — no written notice recorded"]
caveat = TextContent("This spill required a written regulator notice within 24 hours of discovery. The deadline has passed, and no report event is recorded; check whether notice was sent outside the records.")
sources = Sources([spillSrc, protocolSrc])
spillSrc = SourceItem("inspection", "INS-0151-0201", "Spill discovery and effective volume")
protocolSrc = SourceItem("document", "SOP-SR §4 SR-01", "Written notice requirement and deadline")
```

</details>

### Q16.1: pass

**Jake Morales** (new chat): FYI for everyone: WELL-0007 will be shut in from 17 Oct for a 10-day planned workover.

Expected visual: `none` · matched: yes · sources cited: yes

Matched facts:
- The note is recorded for WELL-0007 as a planned shut-in from 17 Oct for 10 days, attributed to Jake Morales

Grader: ok

Tools: record_knowledge · openai/gpt-6-luna · 46,360 in / 217 out · $0.0032 · 10.9 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([message, sources])
message = Card([header, note, confirmation])
header = CardHeader("Shared note recorded", "WELL-0007")
note = TextContent("Jake Morales shared that WELL-0007 will be shut in from 17 Oct 2026 for a 10-day planned workover. The note is recorded as accepted and applies from 17 Oct through 27 Oct 2026.")
confirmation = Callout("success", "No conflicts reported", "The note is recorded for everyone.")
sources = Sources([knowledge])
knowledge = SourceItem("knowledge", "KN-0004", "Jake Morales’s shared planned-workover note")
```

</details>

### Q16.2: pass

**Michael Turner** (new chat): Is any downtime planned for WELL-0007?

Expected visual: `none` · matched: yes · sources cited: yes

Matched facts:
- Yes, downtime is planned for WELL-0007 from 17 Oct for about 10 days
- The answer attributes it to Jake Morales

Grader: ok

Tools: well_snapshot · openai/gpt-6-luna · 50,885 in / 332 out · $0.0036 · 6.8 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([card, sources])
card = Card([header, planned, state])
header = CardHeader("WELL-0007 — planned downtime", "A 10-day planned workover is recorded for 17–27 Oct 2026.")
planned = Callout("info", "Yes — a shut-in is planned", "Jake Morales shared that WELL-0007 will be shut in from 17 Oct for a 10-day planned workover. This note is valid through 27 Oct 2026. No open repair is currently recorded for the well.")
state = TextContent("Latest inspection INS-0007-0203, on 15 Oct 2026, found WELL-0007 producing: wellhead 50.6 °C, ambient 20.7 °C, delta 29.9 °C against the T350 threshold of 20 °C. The planned shut-in is noted, but it is not reflected in open repairs.")
sources = Sources([noteSrc, inspSrc, metaSrc, ruleSrc])
noteSrc = SourceItem("knowledge", "KN-0004", "Planned workover note by Jake Morales")
inspSrc = SourceItem("inspection", "INS-0007-0203", "Latest inspection and producing reading")
metaSrc = SourceItem("document", "WELL-0007 metadata", "Well type and area")
ruleSrc = SourceItem("document", "OM-T350 §3", "T350 producing threshold")
```

</details>

### Q16.3: fail

**Jessica Reed** (new chat): For the three wells we discussed yesterday, what have repairs cost this year?

Expected visual: `none` · matched: yes · sources cited: yes

Matched facts:
- It does not use Michael Turner's history: it gives no repair costs for WELL-0121, WELL-0138 or WELL-0107

Missed facts:
- The copilot says it has no such earlier conversation with Jessica Reed

Grader: Wrongly claims an earlier conversation involving WELL-0164 and gives its repair cost, instead of saying there is no prior conversation; it does avoid Michael Turner's wells.

Tools: recall_my_conversations, query, query · openai/gpt-6-luna · 93,908 in / 445 out · $0.0039 · 11.3 s

<details><summary>Answer (OpenUI Lang)</summary>

```
I found only one well in our earlier conversation with you: WELL-0164. I can give its repair cost, but I can’t identify the other two wells from that conversation.root = Stack([summary, sources])
summary = Card([header, detail])
header = CardHeader("Repair costs this year", "Year to date through 17 Oct 2026")
detail = TextContent("I found only one well in our earlier conversation: WELL-0164. Its repairs cost **$15,186** across 5 repairs this year. I couldn’t identify the other two wells from that conversation—please tell me their IDs and I’ll total all three.")
sources = Sources([repair1, repair2, repair3, repair4, repair5])
repair1 = SourceItem("repair", "MNT-0164-023", "WELL-0164 repair cost")
repair2 = SourceItem("repair", "MNT-0164-024", "WELL-0164 repair cost")
repair3 = SourceItem("repair", "MNT-0164-025", "WELL-0164 repair cost")
repair4 = SourceItem("repair", "MNT-0164-026", "WELL-0164 repair cost")
repair5 = SourceItem("repair", "MNT-0164-027", "WELL-0164 repair cost")
```

</details>

### Q17.1: pass

**Michael Turner** (new chat): WELL-0175 has been shut in for planned work since 14 Oct.

Expected visual: `none` · matched: yes · sources cited: yes

Matched facts:
- The note is recorded for WELL-0175 as a planned shut-in since 14 Oct, attributed to Michael Turner

Grader: ok

Tools: record_knowledge · openai/gpt-6-luna · 50,641 in / 186 out · $0.0035 · 4.6 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([confirmation, marker, sources])
confirmation = Callout("success", "Planned shut-in recorded", "Recorded your note that WELL-0175 has been shut in for planned work since 14 Oct 2026. The note is accepted; no conflicting evidence was returned.")
marker = Tag("Shared note · Michael Turner · since 14 Oct 2026", null, "sm", "info")
sources = Sources([noteSource])
noteSource = SourceItem("knowledge", "KN-0005", "Michael Turner's planned shut-in note for WELL-0175")
```

</details>

### Q17.2: pass

**Tyler Hughes** (new chat): WELL-0175 is running fine.

Expected visual: `none` · matched: yes · sources cited: yes

Matched facts:
- The 15 Oct inspection (by Jessica Reed) shows the wellhead only 0.4 °C above the air, so the well is not producing oil
- That matches Michael Turner's note, not Tyler Hughes's claim
- Both statements are kept on record, Tyler Hughes's is marked unconfirmed, and the answer asks for confirmation

Grader: ok

Tools: well_snapshot, record_knowledge, record_knowledge · openai/gpt-6-luna · 94,221 in / 528 out · $0.0040 · 10.4 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([card, sources])
card = Card([header, claimTag, verdict, details, note])
header = CardHeader("WELL-0175 — claim recorded as unconfirmed", "Latest inspection: 15 Oct 2026")
claimTag = Tag("unconfirmed claim — Tyler Hughes", null, "sm", "warning")
verdict = Callout("warning", "Latest inspection does not support “running fine”", "Inspection INS-0175-0204 found the wellhead 0.4 °C above ambient (24.3 °C vs 23.9 °C), below the T200 producing threshold of 15 °C. Your claim is recorded as unconfirmed; please confirm or clarify.")
details = TextContent("Inspected by drone by Jessica Reed. The system's recorded status is active, but it is out of date because it disagrees with the latest inspection. No open repairs are recorded.")
note = TextContent("A valid shared note from Michael Turner says WELL-0175 has been shut in for planned work since 14 Oct. This conflicts with your claim that it is running fine; please confirm the well's current situation.")
sources = Sources([src1, src2, src3, src4, src5])
src1 = SourceItem("inspection", "INS-0175-0204", "Latest inspection, 15 Oct 2026")
src2 = SourceItem("document", "OM-T200 §9.3", "T200 producing threshold")
src3 = SourceItem("document", "WELL-0175 metadata", "Recorded status, well type, area and repairs")
src4 = SourceItem("knowledge", "KN-0006", "Tyler Hughes's unconfirmed producing claim")
src5 = SourceItem("knowledge", "KN-0005", "Michael Turner's planned shut-in note")
```

</details>

### Q17.3: fail

**Jake Morales** (new chat): WELL-0001 is back online since 14 Oct.

Expected visual: `none` · matched: yes · sources cited: yes

Matched facts:
- The 15 Oct inspection shows WELL-0001 not producing oil
- The claim is recorded as unconfirmed

Missed facts:
- Note CTX-0001-003 expects a return around 20 Oct

Grader: The answer states that the 15 Oct inspection shows the well not producing and that the claim is unconfirmed, but it omits note CTX-0001-003 and its expected return around 20 Oct.

Tools: query, record_knowledge · openai/gpt-6-luna · 70,264 in / 405 out · $0.0036 · 7.8 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([summary, finding, conflict, sources])
summary = TextContent("Recorded your claim that WELL-0001 has been back online since 14 Oct 2026. It is unconfirmed because the latest inspection indicates the well was not producing.")
finding = Card([header, details])
header = CardHeader("Latest inspection: not producing", "WELL-0001 · INS-0001-0203 · 15 Oct 2026")
details = TextContent("Ryan Brooks recorded the wellhead 3.2 °C above ambient, below the 15 °C producing threshold for this well. Inspector’s remark: “Pump jack not moving.”")
conflict = Callout("warning", "Unconfirmed claim — Jake Morales", "Your claim conflicts with the latest inspection and Ryan Brooks’s remark. Please confirm whether WELL-0001 is now producing.")
sources = Sources([inspectionSrc, claimSrc, manualSrc])
inspectionSrc = SourceItem("inspection", "INS-0001-0203", "Latest inspection, 15 Oct 2026")
claimSrc = SourceItem("knowledge", "KN-0008", "Jake Morales’s claim, valid from 14 Oct 2026")
manualSrc = SourceItem("document", "OM-T200 §9.3", "T200 producing threshold")
```

</details>

### Q18: fail

**Laura Simmons** (new chat): Was the 20 Aug spill at WELL-0101 real oil?

Expected visual: `none` · matched: yes · sources cited: yes

Matched facts:
- Yes, the detection stands: the AI flagged a 1.0 bbl spill at inspection INS-0101-0197 ("Oil sheen around cellar")
- Ryan Brooks thought it produced water (CTX-0101-002), but Chris Dalton (HSE) sampled the stain and confirmed crude (CTX-0101-003); the answer shows the disagreement and both sources

Missed facts:
- Neither note is a formal correction, and a spill repair (MNT-0101-029) was done

Grader: Facts 1 and 2 are covered, though the answer hedges the conclusion as 'disputed' and does not name Chris Dalton as HSE. It omits the spill repair MNT-0101-029 (fact 3), though it does say neither note is a formal correction.

Tools: query, query · openai/gpt-6-luna · 70,440 in / 448 out · $0.0037 · 9.2 s

<details><summary>Answer (OpenUI Lang)</summary>

```
root = Stack([answer, statusTag, evidence, sources])
answer = TextContent("The record treats the 20 Aug 2026 detection at WELL-0101 as a real spill (moderate, 1 bbl), and the inspector noted an oil sheen around the cellar. However, the inspection is disputed, so the records do not establish an uncontested answer about whether it was crude oil.")
statusTag = Tag("disputed", null, "sm", "warning")
evidence = TextContent("Ryan Brooks wrote, “I think this was only produced water, not crude” (CTX-0101-002). Chris Dalton wrote, “sampled the stain, it is crude oil. The detection stands” (CTX-0101-003). Neither note is a formal correction; the detection still counts as a spill unless corrected. Please confirm whether a formal correction is needed.")
sources = Sources([srcInspection, srcRyan, srcChris])
srcInspection = SourceItem("inspection", "INS-0101-0197", "20 Aug 2026 inspection; spill detection and inspector remark")
srcRyan = SourceItem("note", "CTX-0101-002", "Ryan Brooks’s disputed note")
srcChris = SourceItem("note", "CTX-0101-003", "Chris Dalton’s disputed note")
```

</details>

