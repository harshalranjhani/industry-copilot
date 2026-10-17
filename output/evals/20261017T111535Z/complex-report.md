# Evals

Complex questions (test data): preferences, custom visuals, shared and private memory, run 2026-10-17T11:15:36.383Z on `anthropic/claude-haiku-5.5`, graded by `openai/gpt-6-luna`.

**Passed 12 of 19 steps (63%), 8 of 15 questions** · answer cost $0.1320 · total answer time 230.1 s

| Step | User | Result | Facts | Sources | Visual | Tokens in / out | Cost | Time |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1.1 | Emily Carter | fail | 3/3 | no | yes | 153,458 / 463 | $0.0077 | 7.8 s |
| P1.2 | Emily Carter | pass | 4/4 | yes | yes | 159,414 / 2,219 | $0.0086 | 12.4 s |
| P1.3 | Emily Carter | pass | 4/4 | yes | yes | 56,456 / 1,210 | $0.0014 | 5.4 s |
| P2.1 | Emily Carter | pass | 6/6 | yes | yes | 156,913 / 1,842 | $0.0083 | 11.1 s |
| P2.2 | Emily Carter | pass | 4/4 | yes | yes | 54,737 / 1,283 | $0.0013 | 5.3 s |
| P3 | Michael Turner | pass | 2/2 | yes | yes | 101,544 / 431 | $0.0013 | 5.1 s |
| M1 | Michael Turner | fail | 5/6 | yes | yes | 269,700 / 3,690 | $0.0106 | 20.2 s |
| K1.1 | Laura Simmons | pass | 4/4 | yes | yes | 153,693 / 1,257 | $0.0023 | 10.0 s |
| K1.2 | Laura Simmons | fail | 5/6 | yes | no | 275,700 / 2,831 | $0.0048 | 17.3 s |
| K2 | Michael Turner | pass | 4/4 | yes | yes | 158,825 / 2,559 | $0.0087 | 13.2 s |
| N1 | Jake Morales | pass | 2/2 | yes | yes | 102,083 / 854 | $0.0074 | 7.0 s |
| N2 | Emily Carter | fail | 3/4 | yes | yes | 215,990 / 2,027 | $0.0091 | 13.1 s |
| R1 | Michael Turner | fail | 0/1 | no | no | 479,750 / 4,533 | $0.0152 | 27.4 s |
| R2 | Michael Turner | fail | 4/6 | yes | yes | 105,577 / 1,530 | $0.0076 | 8.3 s |
| H1 | Michael Turner | pass | 5/5 | yes | yes | 198,790 / 1,408 | $0.0109 | 9.9 s |
| H2 | Michael Turner | pass | 2/2 | yes | yes | 151,569 / 4,748 | $0.0040 | 16.7 s |
| E1 | Emily Carter | fail | 4/5 | yes | yes | 279,204 / 2,301 | $0.0107 | 15.7 s |
| U1 | Emily Carter | pass | 4/4 | yes | yes | 328,183 / 1,540 | $0.0102 | 16.0 s |
| U2 | Emily Carter | pass | 2/2 | yes | yes | 115,261 / 1,320 | $0.0020 | 8.0 s |

## Details

### P1.1: fail

**Emily Carter** (new chat): From now on, whenever you chart temperatures, draw the wellhead in red and the air in blue. And for rankings I prefer horizontal bar charts.

Expected visual: `none` · matched: yes · sources cited: no

Matched facts:
- The answer confirms both preferences were saved for Emily Carter: wellhead temperature in red and air temperature in blue, and horizontal bar charts for rankings
- The answer gives the saved preferences' IDs (PREF-…)
- The answer treats them as Emily Carter's own preferences, not as facts recorded for everyone

Grader: ok

Tools: my_preferences, my_preferences, Stack · anthropic/claude-haiku-5.5 · 153,458 in / 463 out · $0.0077 · 7.8 s

<details><summary>Answer (OpenUI Lang)</summary>

```
I'll save both preferences first.I couldn't write the confirmation in the chart format, because that tool call was a mistake on my part. The two preferences are saved, though:

**Saved preferences (private to you, Emily Carter):**
- **PREF-1:** When charting temperatures, draw the wellhead temperature in red and the air (ambient) temperature in blue.
- **PREF-2:** For rankings, use horizontal bar charts.

These will shape how I draw temperature charts and rankings from now on. I haven't drawn a chart yet, because this message didn't ask for one. If you'd like, I can show a wellhead-versus-air chart for a well or area, or a ranking, using these styles.
```

</details>

### P1.2: pass

**Emily Carter** (new chat): Chart WELL-0397's wellhead and air temperature for the last 13 weeks and mark the weeks it was not producing oil.

Expected visual: `line_chart` · matched: yes · sources cited: yes

Matched facts:
- The chart has 13 weekly readings, from 22 Oct 2026 to 14 Jan 2027
- The wellhead line is red and the air line is blue, following Emily Carter's saved preference
- WELL-0397 was not producing on 7 Jan and 14 Jan 2027 (only 5.3 °C and 5.2 °C above the air, below the T200 limit of 15 °C), and only on those dates, and the chart marks those two readings
- The readings on 7 Jan and 14 Jan 2027 are 16.3 °C wellhead / 11.0 °C air and 13.9 °C wellhead / 8.7 °C air

Grader: ok

Tools: query, well_snapshot, query · anthropic/claude-haiku-5.5 · 159,414 in / 2,219 out · $0.0086 · 12.4 s

<details><summary>Answer (OpenUI Lang)</summary>

```
I'll pull WELL-0397's last 13 weekly inspections, then chart them.The chart below plots the weekly readings with wellhead in red and air in blue, per your saved preference PREF-1. The two non-producing weeks (7 Jan and 14 Jan 2027) are marked with black crosses.```
root = Stack([header, chart, note, callout, sources])
header = CardHeader("WELL-0397 wellhead vs air, last 13 weeks", "Weekly inspections, 22 Oct 2026 to 14 Jan 2027 (NW-12 Well 397, Northwest Block 12, T200)")
chart = Plot({"title": "WELL-0397 temperatures (°C)", "data": {"values": [{"date": "2026-10-22", "wellhead_c": 51.8, "air_c": 23.4, "producing": 1}, {"date": "2026-10-29", "wellhead_c": 52.2, "air_c": 22.1, "producing": 1}, {"date": "2026-11-05", "wellhead_c": 43.2, "air_c": 15.2, "producing": 1}, {"date": "2026-11-12", "wellhead_c": 45.6, "air_c": 19.0, "producing": 1}, {"date": "2026-11-19", "wellhead_c": 41.8, "air_c": 16.5, "producing": 1}, {"date": "2026-11-26", "wellhead_c": 39.4, "air_c": 14.2, "producing": 1}, {"date": "2026-12-03", "wellhead_c": 37.4, "air_c": 13.8, "producing": 1}, {"date": "2026-12-10", "wellhead_c": 28.8, "air_c": 6.8, "producing": 1}, {"date": "2026-12-17", "wellhead_c": 32.9, "air_c": 12.8, "producing": 1}, {"date": "2026-12-24", "wellhead_c": 31.0, "air_c": 11.2, "producing": 1}, {"date": "2026-12-31", "wellhead_c": 31.0, "air_c": 12.4, "producing": 1}, {"date": "2027-01-07", "wellhead_c": 16.3, "air_c": 11.0, "producing": 0}, {"date": "2027-01-14", "wellhead_c": 13.9, "air_c": 8.7, "producing": 0}]}, "transform": [{"fold": ["wellhead_c", "air_c"], "as": ["series", "temp_c"]}], "layer": [{"mark": {"type": "line", "point": true}, "encoding": {"x": {"field": "date", "type": "temporal", "title": "Inspection"}, "y": {"field": "temp_c", "type": "quantitative", "title": "°C"}, "color": {"field": "series", "type": "nominal", "scale": {"domain": ["wellhead_c", "air_c"], "range": ["red", "blue"]}, "title": "Series"}}}, {"transform": [{"filter": "datum.producing == 0"}], "mark": {"type": "point", "shape": "cross", "size": 160, "color": "black", "strokeWidth": 3}, "encoding": {"x": {"field": "date", "type": "temporal"}, "y": {"field": "temp_c", "type": "quantitative"}}}]})
note = TextContent("Wellhead in red, air in blue, following your saved preference PREF-1. The black crosses mark the two weeks WELL-0397 was not producing: 7 Jan 2027 (wellhead 16.3 °C, air 11.0 °C, a 5.3 °C difference) and 14 Jan 2027 (wellhead 13.9 °C, air 8.7 °C, a 5.2 °C difference). The T200 producing threshold is 15 °C above air, so both readings fall short of it. Every other week in the window was producing, with differences of 18.6 to 30.1 °C.")
callout = Callout("warning", "Status is out of date in the system of record", "The recorded status is active, but the latest inspection INS-0397-0219 (14 Jan 2027, manual, Brandon Shaw) shows not producing. An open corrective repair, MNT-0397-032 (sucker rod parted, started 9 Jan 2027, planned end 20 Jan 2027), is consistent with the stop. The 7 Jan reading, INS-0397-0218 (drone, Rachel Dunn), also shows not producing. No shut-in note is on record.")
sources = Sources([s1, s2, s3, s4, s5])
s1 = SourceItem("inspection", "INS-0397-0207 to INS-0397-0219", "Thirteen weekly inspections, 22 Oct 2026 to 14 Jan 2027")
s2 = SourceItem("inspection", "INS-0397-0218", "7 Jan 2027: not producing, delta 5.3 °C")
s3 = SourceItem("inspection", "INS-0397-0219", "14 Jan 2027: not producing, delta 5.2 °C")
s4 = SourceItem("repair", "MNT-0397-032", "Open corrective repair: sucker rod parted, started 9 Jan 2027")
s5 = SourceItem("document", "OM-T200 §9.3", "Producing threshold of 15 °C above ambient")
```
```

</details>

### P1.3: pass

**Emily Carter** (continued chat): Now show the difference between wellhead and air instead, as an orange area chart, with the T200 producing threshold as a dashed line.

Expected visual: `area_chart` · matched: yes · sources cited: yes

Matched facts:
- The chart shows the wellhead-minus-air difference for the same 13 weeks, 22 Oct 2026 to 14 Jan 2027
- The area is orange
- A dashed line marks the 15 °C T200 producing threshold (OM-T200 manual)
- The difference is 5.3 °C on 7 Jan and 5.2 °C on 14 Jan 2027, below the threshold; every earlier week is above it (lowest 18.6 °C on 31 Dec 2026, highest 30.1 °C on 29 Oct 2026)

Grader: ok

Tools: none · anthropic/claude-haiku-5.5 · 56,456 in / 1,210 out · $0.0014 · 5.4 s

<details><summary>Answer (OpenUI Lang)</summary>

```
The difference series comes from the 13 inspections I already retrieved (delta_c per week), so no new query is needed. I'll draw it as an orange area chart with the 15 °C threshold as a dashed line, using Plot since the fixed AreaChart cannot draw a threshold line.

```
root = Stack([header, chart, note, sources])
header = CardHeader("WELL-0397 wellhead minus air, last 13 weeks", "Weekly inspections, 22 Oct 2026 to 14 Jan 2027 (NW-12 Well 397, Northwest Block 12, T200)")
chart = Plot({"title": "WELL-0397 wellhead minus air (°C)", "data": {"values": [{"date": "2026-10-22", "delta_c": 28.4}, {"date": "2026-10-29", "delta_c": 30.1}, {"date": "2026-11-05", "delta_c": 28.0}, {"date": "2026-11-12", "delta_c": 26.6}, {"date": "2026-11-19", "delta_c": 25.3}, {"date": "2026-11-26", "delta_c": 25.2}, {"date": "2026-12-03", "delta_c": 23.6}, {"date": "2026-12-10", "delta_c": 22.0}, {"date": "2026-12-17", "delta_c": 20.1}, {"date": "2026-12-24", "delta_c": 19.8}, {"date": "2026-12-31", "delta_c": 18.6}, {"date": "2027-01-07", "delta_c": 5.3}, {"date": "2027-01-14", "delta_c": 5.2}]}, "layer": [{"mark": {"type": "area", "color": "orange", "opacity": 0.6, "line": {"color": "orange"}}, "encoding": {"x": {"field": "date", "type": "temporal", "title": "Inspection"}, "y": {"field": "delta_c", "type": "quantitative", "title": "°C above air", "scale": {"domainMin": 0}}}}, {"mark": {"type": "rule", "strokeDash": [6, 4], "color": "gray", "strokeWidth": 2}, "encoding": {"y": {"datum": 15}}}, {"mark": {"type": "text", "align": "left", "dx": 4, "dy": -6, "color": "gray"}, "encoding": {"x": {"datum": {"expr": "datetime(2026, 10, 22)"}, "type": "temporal"}, "y": {"datum": 15}, "text": {"value": "T200 threshold 15 °C"}}}]})
note = TextContent("Orange area shows wellhead minus air in °C. The grey dashed line is the 15 °C T200 producing threshold (OM-T200 §9.3). The area falls below the line on 7 Jan 2027 (5.3 °C) and 14 Jan 2027 (5.2 °C), the two weeks WELL-0397 was not producing. Every earlier week sat between 18.6 and 30.1 °C, above the threshold.")
sources = Sources([s1, s2, s3])
s1 = SourceItem("inspection", "INS-0397-0207 to INS-0397-0219", "Thirteen weekly inspections, 22 Oct 2026 to 14 Jan 2027 (delta_c)")
s2 = SourceItem("inspection", "INS-0397-0218", "7 Jan 2027: not producing, delta 5.3 °C")
s3 = SourceItem("document", "OM-T200 §9.3", "Producing threshold of 15 °C above ambient")
```
```

</details>

### P2.1: pass

**Emily Carter** (new chat): Rank the top 5 wells in Southwest Block 23 by total spill volume in 2026.

Expected visual: `bar_chart` · matched: yes · sources cited: yes

Matched facts:
- WELL-0005: 13.3 bbl from 3 spills
- WELL-0013: 11.6 bbl from 4 spills
- WELL-0042: 10.0 bbl from 2 spills
- WELL-0287: 9.0 bbl from 4 spills and WELL-0001: 8.4 bbl from 2 spills
- The next well, WELL-0267 with 8.1 bbl, is not in the top five
- The chart is a horizontal bar chart, following Emily Carter's saved preference for rankings

Grader: ok

Tools: query, query, query · anthropic/claude-haiku-5.5 · 156,913 in / 1,842 out · $0.0083 · 11.1 s

<details><summary>Answer (OpenUI Lang)</summary>

```
I'll query the spills view for Southwest Block 23 in 2026, including one extra row to show the next well after the cut-off.I have the ranking. Next I'll get the individual spill records behind the top five so the sources are complete.```
root = Stack([header, chart, table, note, sources])
header = CardHeader("Top 5 wells by spill volume, Southwest Block 23, 2026", "Real spills only, 1 Jan to 31 Dec 2026, effective volume after corrections")
chart = HorizontalBarChart(["WELL-0005", "WELL-0013", "WELL-0042", "WELL-0287", "WELL-0001"], [Series("Total spill volume (bbl)", [13.3, 11.6, 10, 9, 8.4])], null, null, "Total spill volume (bbl)", null, ["orange"])
table = Table([Col("Rank", ["1", "2", "3", "4", "5"]), Col("Well", ["WELL-0005", "WELL-0013", "WELL-0042", "WELL-0287", "WELL-0001"]), Col("Spills", [3, 4, 2, 4, 2], "number"), Col("Total volume (bbl)", [13.3, 11.6, 10, 9, 8.4], "number")])
note = TextContent("Next after the cut-off is WELL-0267 with 8.1 bbl across 2 spills, so it is not in the top five. There are no ties at the cut-off. Volumes are the measured effective volumes after corrections. 8 detections in this area in 2026 were corrected to not a spill (for example rainwater) and are excluded from these totals.\n\nWELL-0005: 13.3 bbl over 3 spills (INS-0005-0174 1.6 bbl on 12 Mar, INS-0005-0183 4.9 bbl on 14 May, INS-0005-0212 6.8 bbl on 3 Dec).\nWELL-0013: 11.6 bbl over 4 spills (INS-0013-0165 3.4 bbl on 1 Jan, INS-0013-0177 2.3 bbl on 26 Mar, INS-0013-0183 0.7 bbl on 7 May, INS-0013-0188 5.2 bbl on 11 Jun).\nWELL-0042: 10 bbl over 2 spills (INS-0042-0203 5.4 bbl on 17 Sep, INS-0042-0204 4.6 bbl on 24 Sep).\nWELL-0287: 9 bbl over 4 spills (INS-0287-0170 2.5 bbl on 12 Feb, INS-0287-0184 2.9 bbl on 21 May, INS-0287-0205 1.2 bbl on 15 Oct, INS-0287-0208 2.4 bbl on 5 Nov).\nWELL-0001: 8.4 bbl over 2 spills (INS-0001-0185 6.8 bbl on 11 Jun, INS-0001-0201 1.6 bbl on 1 Oct).")
sources = Sources([s1, s2, s3, s4, s5, s6])
s1 = SourceItem("inspection", "INS-0005-0183", "WELL-0005 spill, 14 May 2026")
s2 = SourceItem("inspection", "INS-0013-0188", "WELL-0013 spill, 11 Jun 2026")
s3 = SourceItem("inspection", "INS-0042-0203", "WELL-0042 spill, 17 Sep 2026")
s4 = SourceItem("inspection", "INS-0287-0208", "WELL-0287 spill, 5 Nov 2026")
s5 = SourceItem("inspection", "INS-0001-0185", "WELL-0001 spill, 11 Jun 2026")
s6 = SourceItem("document", "SOP-SR §3", "Spill classes by effective volume")
```
```

</details>

### P2.2: pass

**Emily Carter** (continued chat): Just this once, make it vertical with dark green bars and the volume written on each bar.

Expected visual: `bar_chart` · matched: yes · sources cited: yes

Matched facts:
- The chart shows the same five wells and volumes (WELL-0005 13.3, WELL-0013 11.6, WELL-0042 10.0, WELL-0287 9.0, WELL-0001 8.4 bbl)
- The bars are vertical and dark green
- Each bar is labelled with its volume
- The saved horizontal-bar preference is kept for later answers; it is not deleted or replaced

Grader: ok

Tools: none · anthropic/claude-haiku-5.5 · 54,737 in / 1,283 out · $0.0013 · 5.3 s

<details><summary>Answer (OpenUI Lang)</summary>

```
The earlier ranking used a horizontal bar chart, which your saved preference PREF-2 asks for. You asked for vertical bars this time, so I'm drawing this one vertically. PREF-2 is unchanged and still applies to later answers. The bars are dark green and each carries its volume label.

```
root = Stack([header, chart, table, note, sources])
header = CardHeader("Top 5 wells by spill volume, Southwest Block 23, 2026", "Real spills only, 1 Jan to 31 Dec 2026, effective volume after corrections")
chart = Plot({"title": "Total spill volume by well, 2026 (bbl)", "data": {"values": [{"well": "WELL-0005", "bbl": 13.3}, {"well": "WELL-0013", "bbl": 11.6}, {"well": "WELL-0042", "bbl": 10}, {"well": "WELL-0287", "bbl": 9}, {"well": "WELL-0001", "bbl": 8.4}]}, "layer": [{"mark": {"type": "bar", "color": "darkgreen"}, "encoding": {"x": {"field": "well", "type": "nominal", "sort": ["WELL-0005", "WELL-0013", "WELL-0042", "WELL-0287", "WELL-0001"], "title": "Well"}, "y": {"field": "bbl", "type": "quantitative", "title": "Total spill volume (bbl)"}}}, {"mark": {"type": "text", "dy": -8, "color": "black"}, "encoding": {"x": {"field": "well", "type": "nominal", "sort": ["WELL-0005", "WELL-0013", "WELL-0042", "WELL-0287", "WELL-0001"]}, "y": {"field": "bbl", "type": "quantitative"}, "text": {"field": "bbl", "type": "quantitative", "format": ".1f"}}}]})
table = Table([Col("Rank", ["1", "2", "3", "4", "5"]), Col("Well", ["WELL-0005", "WELL-0013", "WELL-0042", "WELL-0287", "WELL-0001"]), Col("Spills", [3, 4, 2, 4, 2], "number"), Col("Total volume (bbl)", [13.3, 11.6, 10, 9, 8.4], "number")])
note = TextContent("Dark green bars show each well's total effective spill volume in bbl, with the volume written above each bar. Colours and vertical orientation follow your request for this answer only. Next after the cut-off is WELL-0267 with 8.1 bbl across 2 spills, so it is not in the top five. 8 detections in this area in 2026 were corrected to not a spill (for example rainwater) and are excluded from these totals.")
sources = Sources([s1, s2, s3, s4, s5, s6, s7])
s1 = SourceItem("inspection", "INS-0005-0183", "WELL-0005 spill, 14 May 2026")
s2 = SourceItem("inspection", "INS-0013-0188", "WELL-0013 spill, 11 Jun 2026")
s3 = SourceItem("inspection", "INS-0042-0203", "WELL-0042 spill, 17 Sep 2026")
s4 = SourceItem("inspection", "INS-0287-0208", "WELL-0287 spill, 5 Nov 2026")
s5 = SourceItem("inspection", "INS-0001-0185", "WELL-0001 spill, 11 Jun 2026")
s6 = SourceItem("document", "SOP-SR §3", "Spill classes by effective volume")
s7 = SourceItem("knowledge", "PREF-2", "Your saved preference: For rankings, use horizontal bar charts. (Set aside for this answer only.)")
```
```

</details>

### P3: pass

**Michael Turner** (new chat): What chart preferences do I have saved? And what colours did Emily Carter ask for?

Expected visual: `none` · matched: yes · sources cited: yes

Matched facts:
- Michael Turner has no saved preferences
- The answer does not reveal Emily Carter's preferences (no red, blue or horizontal-bar choices) and says preferences are private to each user

Grader: ok

Tools: my_preferences, recall_my_conversations · anthropic/claude-haiku-5.5 · 101,544 in / 431 out · $0.0013 · 5.1 s

<details><summary>Answer (OpenUI Lang)</summary>

```
I'll check your saved preferences first, then look for anything Emily Carter has asked for.Michael Turner has no saved chart preferences, and no earlier conversation mentions Emily Carter or colour requests. Preferences are private to each user, so I can't see anything Emily Carter may have set for herself.

I'll cite these as the records behind this answer.

```
root = Stack([header, callout, sources])
header = CardHeader("Saved chart preferences", "Michael Turner")
callout = Callout("info", "No chart preferences saved", "You have no saved chart preferences. No colour request from Emily Carter appears in your conversations with me. Preferences are private to each user, so I cannot see hers.")
sources = Sources([src1, src2])
src1 = SourceItem("knowledge", "Michael Turner's saved preferences", "none saved")
src2 = SourceItem("knowledge", "Michael Turner's conversation history", "no match for Emily Carter or colour requests")
```
```

</details>

### M1: fail

**Michael Turner** (new chat): On a satellite map, show every spill in Southwest Block 24 in the last 90 days, coloured from yellow (small) to red (large) by volume and sized by volume, with the well labels always visible.

Expected visual: `map` · matched: yes · sources cited: yes

Matched facts:
- The map has 13 spills at 11 wells, between 22 Oct 2026 and 14 Jan 2027
- The smallest is WELL-0097 on 7 Jan 2027 with 0.2 bbl
- WELL-0062 had two spills (5 Nov 2026, 0.3 bbl and 24 Dec 2026, 2.7 bbl) and WELL-0072 had two (10 Dec 2026, 2.0 bbl and 17 Dec 2026, 3.8 bbl)
- The other spills are WELL-0085 22 Oct 4.1 bbl, WELL-0077 5 Nov 0.7 bbl, WELL-0056 3 Dec 2.9 bbl, WELL-0074 3 Dec 0.7 bbl, WELL-0260 3 Dec 1.6 bbl, WELL-0089 31 Dec 1.0 bbl and WELL-0284 14 Jan 2027 1.5 bbl
- The map uses the satellite basemap, colours pins by volume on a yellow-to-red ramp, sizes them by volume and keeps labels visible

Missed facts:
- The largest is WELL-0067 on 7 Jan 2027 with 5.6 bbl (the clean-up crew's measured volume from Laura Simmons' data correction CTX-0067-002, replacing the AI's 4.8 bbl estimate), at 31.80529, -102.44261

Grader: The largest spill is incorrectly shown as 4.8 bbl; the expected corrected volume is 5.6 bbl, with correction record CTX-0067-002.

Tools: query, query, query, query, query · anthropic/claude-haiku-5.5 · 269,700 in / 3,690 out · $0.0106 · 20.2 s

<details><summary>Answer (OpenUI Lang)</summary>

```
I'll query the spills in Southwest Block 24 over the last 90 days.I have 13 spills, all counted (no corrected detections). Volume ranges from 0.2 to 4.8 bbl, so I'll colour by volume and size pins from 6 to 22 px.

Sizes: size = 6 + 16 × (v − 0.2) / 4.6.
- 0.2 → 6.0; 0.3 → 6.7; 0.7 → 9.2; 1.0 → 10.7; 1.5 → 13.2; 1.6 → 13.8; 2.0 → 15.5; 2.7 → 17.9; 2.9 → 18.6; 3.8 → 21.7 (rounded to 21.7); 4.1 → 22.0; 4.8 → 22.0 (capped in the 4.8 case as 6+16×1 = 22).Note: WELL-0085's inspection (22 Oct 2026) falls outside the 90-day window only by the query's own bounds? No, it is inside: 90 days before 15 Jan 2027 is 17 Oct 2026, so all 13 are in the window.I've mapped all 13 spills in Southwest Block 24 from the last 90 days (17 Oct 2026 to 15 Jan 2027). No detections were corrected away, so all 13 count. Pin colour runs from yellow (0.2 bbl) to red (4.8 bbl), and pin size scales with volume. Well labels are always shown.```
root = Stack([header, map, legendNote, table, sources])
header = InlineHeader("Southwest Block 24 spills, last 90 days", "13 spills from 11 wells, 26.3 bbl in total, 17 Oct 2026 to 15 Jan 2027")
map = GeoMap([p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13], {"basemap": "satellite", "colorBy": "value", "palette": ["yellow", "red"], "legendTitle": "Volume (bbl)", "showLabels": true})
p1 = {"lat": 31.80529, "lon": -102.44261, "label": "WELL-0067", "detail": "7 Jan 2027, 4.8 bbl, moderate, INS-0067-0216", "value": 4.8, "size": 22}
p2 = {"lat": 31.82885, "lon": -102.4821, "label": "WELL-0085", "detail": "22 Oct 2026, 4.1 bbl, moderate, INS-0085-0204", "value": 4.1, "size": 19.6}
p3 = {"lat": 31.80151, "lon": -102.49752, "label": "WELL-0072", "detail": "17 Dec 2026, 3.8 bbl, moderate, INS-0072-0215", "value": 3.8, "size": 18.5}
p4 = {"lat": 31.79403, "lon": -102.45994, "label": "WELL-0056", "detail": "3 Dec 2026, 2.9 bbl, moderate, INS-0056-0213", "value": 2.9, "size": 15.4}
p5 = {"lat": 31.78989, "lon": -102.44175, "label": "WELL-0062", "detail": "24 Dec 2026, 2.7 bbl, moderate, INS-0062-0214", "value": 2.7, "size": 14.7}
p6 = {"lat": 31.80151, "lon": -102.49752, "label": "WELL-0072", "detail": "10 Dec 2026, 2.0 bbl, moderate, INS-0072-0214", "value": 2.0, "size": 12.3}
p7 = {"lat": 31.77831, "lon": -102.45189, "label": "WELL-0260", "detail": "3 Dec 2026, 1.6 bbl, moderate, INS-0260-0212", "value": 1.6, "size": 10.9}
p8 = {"lat": 31.8306, "lon": -102.49133, "label": "WELL-0284", "detail": "14 Jan 2027, 1.5 bbl, moderate, INS-0284-0218", "value": 1.5, "size": 10.5}
p9 = {"lat": 31.81465, "lon": -102.44627, "label": "WELL-0089", "detail": "31 Dec 2026, 1.0 bbl, moderate, INS-0089-0212", "value": 1.0, "size": 8.8}
p10 = {"lat": 31.78077, "lon": -102.44222, "label": "WELL-0074", "detail": "3 Dec 2026, 0.7 bbl, minor, INS-0074-0214", "value": 0.7, "size": 7.7}
p11 = {"lat": 31.81947, "lon": -102.44789, "label": "WELL-0077", "detail": "5 Nov 2026, 0.7 bbl, minor, INS-0077-0204", "value": 0.7, "size": 7.7}
p12 = {"lat": 31.78989, "lon": -102.44175, "label": "WELL-0062", "detail": "5 Nov 2026, 0.3 bbl, minor, INS-0062-0207", "value": 0.3, "size": 6.3}
p13 = {"lat": 31.81867, "lon": -102.47578, "label": "WELL-0097", "detail": "7 Jan 2027, 0.2 bbl, minor, INS-0097-0214", "value": 0.2, "size": 6}
legendNote = TextContent("Pin colour runs from yellow (smallest, 0.2 bbl) to red (largest, 4.8 bbl) by effective volume. Pin size also grows with volume, from 6 px to 22 px. Well labels are always visible. WELL-0062 and WELL-0072 each have two spills, so their pins overlap. No detections in this window were corrected away, so all 13 count as spills.")
table = Table([Col("Well", ["WELL-0067", "WELL-0085", "WELL-0072", "WELL-0056", "WELL-0062", "WELL-0072", "WELL-0260", "WELL-0284", "WELL-0089", "WELL-0074", "WELL-0077", "WELL-0062", "WELL-0097"]), Col("Date", ["7 Jan 2027", "22 Oct 2026", "17 Dec 2026", "3 Dec 2026", "24 Dec 2026", "10 Dec 2026", "3 Dec 2026", "14 Jan 2027", "31 Dec 2026", "3 Dec 2026", "5 Nov 2026", "5 Nov 2026", "7 Jan 2027"]), Col("Volume (bbl)", [4.8, 4.1, 3.8, 2.9, 2.7, 2.0, 1.6, 1.5, 1.0, 0.7, 0.7, 0.3, 0.2], "number"), Col("Class", ["moderate", "moderate", "moderate", "moderate", "moderate", "moderate", "moderate", "moderate", "moderate", "minor", "minor", "minor", "minor"]), Col("Latitude", [31.80529, 31.82885, 31.80151, 31.79403, 31.78989, 31.80151, 31.77831, 31.8306, 31.81465, 31.78077, 31.81947, 31.78989, 31.81867], "number"), Col("Longitude", [-102.44261, -102.4821, -102.49752, -102.45994, -102.44175, -102.49752, -102.45189, -102.49133, -102.44627, -102.44222, -102.44789, -102.44175, -102.47578], "number")])
sources = Sources([s1, s2, s3])
s1 = SourceItem("spills", "Southwest Block 24, 17 Oct 2026 to 15 Jan 2027", "13 real spills in the spills view")
s2 = SourceItem("inspection", "INS-0067-0216", "Largest spill, 4.8 bbl, 7 Jan 2027")
s3 = SourceItem("inspection", "INS-0097-0214", "Smallest spill, 0.2 bbl, 7 Jan 2027")
```
```

</details>

### K1.1: pass

**Laura Simmons** (new chat): The AI estimated the 24 Sep spill at WELL-0151 as 4.5 bbl. The field crew measured 5.4 bbl.

Expected visual: `none` · matched: yes · sources cited: yes

Matched facts:
- The corrected volume of 5.4 bbl is recorded against inspection INS-0151-0201 (24 Sep 2026), keeping the AI's estimate (4.5 bbl), attributed to Laura Simmons
- At 5.4 bbl the spill is reportable (5 bbl or more under the Spill Response SOP); the written notice was due within 24 hours (revision 4, spill discovered before 1 Jan 2027) and none is on record, so a possible SR-01 breach is flagged
- As a reportable spill it also needed agency verification of the clean-up by 23 Nov 2026 (SR-03, 60 days) and no site inspection is on record, so SR-03 is overdue too
- Repair report MNT-0151-025 classed it as moderate (and said agency verification did not apply), which no longer holds

Grader: ok

Tools: query, record_knowledge · anthropic/claude-haiku-5.5 · 153,693 in / 1,257 out · $0.0023 · 10.0 s

<details><summary>Answer (OpenUI Lang)</summary>

```
I'll record this correction, which needs the inspection ID first. Let me look it up.root = Stack([header, summary, compCard, conflictCallout, sources])
header = CardHeader("WELL-0151 spill of 24 Sep 2026: volume corrected to 5.4 bbl", "Inspection INS-0151-0201, recorded by Laura Simmons (KN-0001)")
summary = TextContent("The AI estimate of 4.5 bbl is kept on record as the original. The field crew's measured 5.4 bbl is now the volume used. That moves the spill from moderate to reportable (5 bbl or more), so a written SR-01 notice is required.")
compCard = Card([compTable, compNote])
compTable = Table([Col("Duty", ["Spill class", "SR-01 written notice", "SR-02 containment", "SR-03 agency verification"]), Col("Before correction", ["Moderate", "Not required", "Breached late (containment after the 4 h limit, per MNT-0151-025)", "Not required"]), Col("After correction", ["Reportable", "Breached open: due 25 Sep 2026 03:30 UTC, no written notice on record", "Breached late (unchanged)", "Breached open: verification due 23 Nov 2026, not closed"])])
compNote = TextContent("SR-01 is a possible breach: the deadline passed with no written notice on record. Please check whether notice was sent to the State Oil & Gas Commission. The repair report MNT-0151-025 states the class as moderate, so the report no longer matches the corrected class (class mismatch).")
conflictCallout = Callout("warning", "Disputed by the inspector's remark", "Inspector Ashley Bennett's remark on INS-0151-0201 reads: \"Oil sheen around cellar.\" It does not state a volume. Your correction is recorded as accepted (KN-0001). Please confirm the 5.4 bbl measurement.")
sources = Sources([s1, s2, s3, s4])
s1 = SourceItem("knowledge", "KN-0001", "Correction: spill volume 4.5 bbl (AI) changed to 5.4 bbl (field measured) by Laura Simmons")
s2 = SourceItem("inspection", "INS-0151-0201", "24 Sep 2026 detection, inspector remark and volume")
s3 = SourceItem("report", "MNT-0151-025", "Repair report stating the moderate class and containment time")
s4 = SourceItem("document", "SOP-SR §4 SR-01", "Reportable spill: written notice within 12 hours (24 hours before 1 Jan 2027)")
```

</details>

### K1.2: fail

**Laura Simmons** (continued chat): Plot every Northeast Block 8 spill between 1 Jul and 30 Sep 2026 as volume against containment hours, with dashed lines at the 5 bbl reporting threshold and the 4-hour containment limit, and colour the ones that needed a regulator report red.

Expected visual: `scatter_chart` · matched: no · sources cited: yes

Matched facts:
- There are 10 spills; the July ones are WELL-0270 9 Jul (1.4 bbl, 1.0 h), WELL-0194 16 Jul (1.5 bbl, 1.8 h), WELL-0186 23 Jul (0.6 bbl, 1.4 h), WELL-0165 30 Jul (1.2 bbl, 1.1 h) and WELL-0175 30 Jul (3.9 bbl, 2.8 h)
- The August and September ones are WELL-0270 20 Aug (3.8 bbl, 2.7 h), WELL-0258 27 Aug (0.5 bbl, 2.7 h), WELL-0258 3 Sep (3.3 bbl, 5.4 h), WELL-0151 24 Sep (5.4 bbl, 6.4 h) and WELL-0258 24 Sep (2.1 bbl, 1.3 h)
- Only WELL-0151 needed a report, because of the corrected 5.4 bbl volume, and it is the only red point
- Two spills are past the 4-hour containment limit (SR-02 breaches): WELL-0151 24 Sep (6.4 h) and WELL-0258 3 Sep (5.4 h)
- Dashed lines mark 5 bbl and 4 hours

Missed facts:
- Containment hours come from the repair reports

Grader: The data and thresholds are present, but the requested scatter plot with dashed threshold lines and a red point was not rendered.

Tools: query, query, query, Plot, Plot · anthropic/claude-haiku-5.5 · 275,700 in / 2,831 out · $0.0048 · 17.3 s

<details><summary>Answer (OpenUI Lang)</summary>

```
I'll pull the spill compliance data for that area and period.Ten spills in the period; only one needed a regulator report (WELL-0151, 5.4 bbl). Let me check the corrections and any detections that were removed, so the chart is complete.Two detections were removed by corrections and are excluded from the chart. Let me confirm those corrections' reasons.Now the chart. Red marks the regulator-reported spill; the others are shown in blue.The Plot tool is not available in this session, so I can't render the chart. I'll give you the data as a table instead, with the thresholds and the regulator-report flag.

root = Stack([header, note, tbl, sources])
header = CardHeader("Northeast Block 8 spills, 1 Jul to 30 Sep 2026", "10 real spills; 2 detections excluded by correction")
note = TextContent("The requested volume-vs-containment chart could not be drawn because the plotting tool is unavailable in this session. The table below carries the same data. Thresholds: reporting at 5 bbl or more; containment limit 4 hours. Only WELL-0151 (5.4 bbl, 6.4 h) needed a regulator report. Its containment time was over the 4-hour limit, and its SR-01 written notice is breached open. WELL-0258 (3 Sep, 3.3 bbl, 5.4 h) also breached the containment limit but did not need a report.")
tbl = Table([Col("Well", ["WELL-0270", "WELL-0194", "WELL-0186", "WELL-0165", "WELL-0175", "WELL-0270", "WELL-0258", "WELL-0258", "WELL-0151", "WELL-0258"]), Col("Discovered", ["9 Jul", "16 Jul", "23 Jul", "30 Jul", "30 Jul", "20 Aug", "27 Aug", "3 Sep", "24 Sep", "24 Sep"]), Col("Volume (bbl)", [1.4, 1.5, 0.6, 1.2, 3.9, 3.8, 0.5, 3.3, 5.4, 2.1], "number"), Col("Containment (h)", [1.0, 1.8, 1.4, 1.1, 2.8, 2.7, 2.7, 5.4, 6.4, 1.3], "number"), Col("Regulator report needed", ["No", "No", "No", "No", "No", "No", "No", "No", "Yes", "No"])])
sources = Sources([s1, s2, s3])
s1 = SourceItem("document", "SOP-SR §3 and §4 SR-01, SR-02", "Reporting threshold 5 bbl; containment limit 4 hours")
s2 = SourceItem("inspection", "INS-0151-0201", "WELL-0151 24 Sep spill, corrected to 5.4 bbl (KN-0001)")
s3 = SourceItem("inspection", "INS-0194-0192, INS-0199-0200", "Detections removed by corrections CTX-0194-002 and CTX-0199-002 (Laura Simmons)")
```

</details>

### K2: pass

**Michael Turner** (new chat): Which Northeast Block 8 spills between 1 Jul and 30 Sep 2026 needed a report to the regulator? Show all their volumes as a bar chart with the reporting threshold as a red line.

Expected visual: `bar_chart` · matched: yes · sources cited: yes

Matched facts:
- Only WELL-0151's 24 Sep 2026 spill needed a report, because Laura Simmons corrected its volume from 4.5 bbl to 5.4 bbl
- No written notice is on record for it, so it is flagged as a possible SR-01 breach
- The bars show all 10 spills: WELL-0270 1.4 (9 Jul), WELL-0194 1.5, WELL-0186 0.6, WELL-0165 1.2, WELL-0175 3.9, WELL-0270 3.8 (20 Aug), WELL-0258 0.5 (27 Aug), WELL-0258 3.3 (3 Sep), WELL-0151 5.4 and WELL-0258 2.1 (24 Sep) bbl
- A red line marks the 5 bbl reporting threshold

Grader: The chart and threshold are shown, but the response gives a 12-hour deadline and labels the event breached_open rather than a possible breach.

Tools: query, query, query · anthropic/claude-haiku-5.5 · 158,825 in / 2,559 out · $0.0087 · 13.2 s

<details><summary>Answer (OpenUI Lang)</summary>

```
I'll start by pulling the spill compliance records for Northeast Block 8 in that window.Only one spill in the window needed a report: WELL-0151 (INS-0151-0201, 5.4 bbl, reportable). Let me check the two non-counted detections for the disclosure.```openui
root = Stack([header, chartCard, table, note, sources])
header = CardHeader("Northeast Block 8 spills needing a regulator report, 1 Jul to 30 Sep 2026", "Reporting threshold: 5 bbl (reportable class, SOP-SR §3)")
chartCard = Card([chart, chartNote])
chart = Plot({"title": "Effective spill volume by discovery (bbl), Northeast Block 8, 1 Jul to 30 Sep 2026", "data": {"values": [{"well": "WELL-0270 (9 Jul)", "volume_bbl": 1.4, "class": "moderate"}, {"well": "WELL-0194 (16 Jul)", "volume_bbl": 1.5, "class": "moderate"}, {"well": "WELL-0186 (23 Jul)", "volume_bbl": 0.6, "class": "minor"}, {"well": "WELL-0165 (30 Jul)", "volume_bbl": 1.2, "class": "moderate"}, {"well": "WELL-0175 (30 Jul)", "volume_bbl": 3.9, "class": "moderate"}, {"well": "WELL-0270 (20 Aug)", "volume_bbl": 3.8, "class": "moderate"}, {"well": "WELL-0258 (27 Aug)", "volume_bbl": 0.5, "class": "minor"}, {"well": "WELL-0258 (3 Sep)", "volume_bbl": 3.3, "class": "moderate"}, {"well": "WELL-0151 (24 Sep)", "volume_bbl": 5.4, "class": "reportable"}, {"well": "WELL-0258 (24 Sep)", "volume_bbl": 2.1, "class": "moderate"}]}, "layer": [{"mark": {"type": "bar", "color": "steelblue"}, "encoding": {"x": {"field": "well", "type": "nominal", "sort": null, "title": "Spill (well and discovery date)"}, "y": {"field": "volume_bbl", "type": "quantitative", "title": "Effective volume (bbl)"}}}, {"mark": {"type": "text", "dy": -8, "color": "black"}, "encoding": {"x": {"field": "well", "type": "nominal", "sort": null}, "y": {"field": "volume_bbl", "type": "quantitative"}, "text": {"field": "volume_bbl", "type": "quantitative", "format": ".1f"}}}, {"mark": {"type": "rule", "color": "red", "strokeWidth": 2, "strokeDash": [6, 4]}, "encoding": {"y": {"datum": 5}}}, {"mark": {"type": "text", "align": "left", "dx": 4, "dy": -6, "color": "red"}, "encoding": {"x": {"value": 0}, "y": {"datum": 5}, "text": {"value": "5 bbl reporting threshold"}}}]}, 320)
chartNote = TextContent("Bars show the effective (corrected) volume of each real spill in the window; the red dashed line is the 5 bbl reporting threshold. Only the WELL-0151 spill (5.4 bbl, reportable) reached it. Bars are labelled with their volume.")
table = Table([Col("Well", ["WELL-0151"]), Col("Discovered", ["24 Sep 2026"]), Col("Inspection", ["INS-0151-0201"]), Col("Volume (bbl)", [5.4], "number"), Col("Class", ["reportable"]), Col("Report deadline", ["12 h (SR-01)"]), Col("Written notice on record", ["None"]), Col("SR-01 status", ["breached_open"]), Col("Repair report", ["MNT-0151-025"])])
note = Callout("warning", "Possible SR-01 breach, still open", "WELL-0151's 5.4 bbl spill (INS-0151-0201, discovered 24 Sep 2026) needed a written notice within 12 hours, but no spill_report_filed event is on record, so its status is breached_open. Please check whether notice was sent. Two other detections in the window were not counted: INS-0194-0192 (WELL-0194, 23 Jul) and INS-0199-0200 (WELL-0199, 10 Sep), both corrected to not a spill by Laura Simmons (CTX-0194-002, CTX-0199-002), so they are not in the chart.")
sources = Sources([s1, s2, s3, s4, s5])
s1 = SourceItem("inspection", "INS-0151-0201", "24 Sep 2026 spill, 5.4 bbl, reportable")
s2 = SourceItem("repair", "MNT-0151-025", "Repair report covering the WELL-0151 spill")
s3 = SourceItem("inspection", "INS-0194-0192", "Detection corrected to not a spill (CTX-0194-002)")
s4 = SourceItem("inspection", "INS-0199-0200", "Detection corrected to not a spill (CTX-0199-002)")
s5 = SourceItem("document", "SOP-SR §3 and §4 SR-01", "Reportable class 5 bbl or more; written notice within 12 hours from 1 Jan 2027")
```
```

</details>

### N1: pass

**Jake Morales** (new chat): FYI for everyone: WELL-0007 will be shut in from 20 Jan to 29 Jan for a planned workover, and WELL-0012 from 22 Jan to 24 Jan for a flowline integrity test.

Expected visual: `none` · matched: yes · sources cited: yes

Matched facts:
- A note is recorded for WELL-0007: planned shut-in 20 to 29 Jan 2027 for a workover, attributed to Jake Morales
- A note is recorded for WELL-0012: planned shut-in 22 to 24 Jan 2027 for a flowline integrity test, attributed to Jake Morales

Grader: ok

Tools: record_knowledge, record_knowledge · anthropic/claude-haiku-5.5 · 102,083 in / 854 out · $0.0074 · 7.0 s

<details><summary>Answer (OpenUI Lang)</summary>

```
I'll record both notes as shared knowledge, since you've stated them as planned shut-ins.root = Stack([header, c7, c12, sources])
header = TextContent("Planned shut-ins recorded", "large-heavy")
c7 = Callout("info", "WELL-0007: planned workover, 20 to 29 Jan 2027", "Recorded as a shared note (KN-0002) from Jake Morales. The well is expected to be shut in for the workover over these dates. No conflicts were found with existing records.")
c12 = Callout("info", "WELL-0012: flowline integrity test, 22 to 24 Jan 2027", "Recorded as a shared note (KN-0003) from Jake Morales. The well is expected to be shut in for the flowline integrity test over these dates. No conflicts were found with existing records.")
sources = Sources([s1, s2])
s1 = SourceItem("knowledge", "KN-0002", "Note from Jake Morales: WELL-0007 shut in 20 to 29 Jan 2027 for planned workover")
s2 = SourceItem("knowledge", "KN-0003", "Note from Jake Morales: WELL-0012 shut in 22 to 24 Jan 2027 for flowline integrity test")
```

</details>

### N2: fail

**Emily Carter** (new chat): Show the planned shut-ins in Southwest Block 23 for the rest of January as a timeline, one bar per well, and say who reported each.

Expected visual: `timeline` · matched: yes · sources cited: yes

Matched facts:
- WELL-0007: 20 Jan to 29 Jan 2027, planned workover, shared by Jake Morales
- WELL-0012: 22 Jan to 24 Jan 2027, flowline integrity test, shared by Jake Morales
- The timeline draws one bar per well from its start date to its end date

Missed facts:
- WELL-0001's earlier planned shut-in note CTX-0001-003 (7 to 20 Oct 2026, rod string replacement) has ended and is not shown as a January shut-in

Grader: Correct dated plans, reporters, and timeline; it does not state that WELL-0001’s October note has ended.

Tools: query, query, query, query · anthropic/claude-haiku-5.5 · 215,990 in / 2,027 out · $0.0091 · 13.1 s

<details><summary>Answer (OpenUI Lang)</summary>

```
I'll look up the planned shut-in notes for Southwest Block 23 that overlap the rest of January 2027.The planned windows with explicit dates in the rest of January are the two chat notes (WELL-0007 and WELL-0012). The other notes are open-ended shut-ins from the dataset, not dated plans. I'll check the open repairs on these wells to see which are recorded in the maintenance system.root = Stack([header, timelineCard, table, note, sources])
header = InlineHeader("Planned shut-ins, Southwest Block 23, rest of January 2027", "Dated plans overlapping 15 to 31 Jan 2027, with who reported each")
timelineCard = Card([timeline])
timeline = Plot({"title": "Planned shut-ins, Southwest Block 23 (15 to 31 Jan 2027)", "data": {"values": [{"well": "WELL-0007", "start": "2027-01-20", "end": "2027-01-29", "reporter": "Jake Morales (chat, KN-0002)"}, {"well": "WELL-0012", "start": "2027-01-22", "end": "2027-01-24", "reporter": "Jake Morales (chat, KN-0003)"}]}, "mark": {"type": "bar", "height": 18}, "encoding": {"y": {"field": "well", "type": "nominal", "title": "Well"}, "x": {"field": "start", "type": "temporal", "title": "Date", "scale": {"domain": ["2027-01-15", "2027-01-31"]}}, "x2": {"field": "end"}, "color": {"field": "reporter", "type": "nominal", "title": "Reported by"}}}, 260)
table = Table([Col("Well", ["WELL-0007", "WELL-0012"]), Col("Planned from", ["20 Jan 2027", "22 Jan 2027"]), Col("Planned to", ["29 Jan 2027", "24 Jan 2027"]), Col("Reason", ["Planned workover", "Flowline integrity test"]), Col("Reported by", ["Jake Morales (KN-0002)", "Jake Morales (KN-0003)"]), Col("Maintenance record yet", ["No repair logged for 15 Jan onward", "No repair logged for 15 Jan onward"])])
note = Callout("info", "Other shut-ins are not dated plans", "Six other Southwest Block 23 wells have shut-in notes with no end date (WELL-0010, WELL-0013, WELL-0021, WELL-0044, WELL-0283, WELL-0299). Their shut-ins are open-ended, so they are not drawn on the timeline. Only WELL-0007 and WELL-0012 have dated planned windows in January. Neither has a repair logged in the maintenance system yet, although the manual asks for shut-ins to be recorded before work starts.")
sources = Sources([s1, s2, s3, s4])
s1 = SourceItem("knowledge", "KN-0002", "Jake Morales: WELL-0007 shut in 20 to 29 Jan 2027 for a planned workover")
s2 = SourceItem("knowledge", "KN-0003", "Jake Morales: WELL-0012 shut in 22 to 24 Jan 2027 for a flowline integrity test")
s3 = SourceItem("note", "CTX-0007-004", "Sarah Mitchell: open-ended shut-in note for WELL-0007 (26 Dec 2026)")
s4 = SourceItem("document", "OM-T200 §4", "Record a planned shut-in in the maintenance system before work starts")
```

</details>

### R1: fail

**Michael Turner** (new chat): Note for all T350 wells: our team now wants a pump jack root-cause analysis after 2 repairs, not 3.

Expected visual: `none` · matched: no · sources cited: no

Missed facts:
- The rule is recorded for the T350 well type only, attributed to Michael Turner, and overrides the manual's 3-repair threshold for T350 wells

Grader: The grader gave no readable verdict: {"matched":[1],"sourcesCited":true,"visualMatches":true,"comment":"The threshold override and T350-only scope are stated, but the rule is not attributed to Michael Turner."}⊘
Dude I think Michael Turn

Tools: record_knowledge, query, query, query, query, query, record_knowledge · anthropic/claude-haiku-5.5 · 479,750 in / 4,533 out · $0.0152 · 27.4 s

<details><summary>Answer (OpenUI Lang)</summary>

```
This is a team rule for all T350 wells, so I'll record it as a rule override for well type T350 only.Your rule is recorded as KN-0004. It now applies to every T350 well's pump jack: the escalation count drops from 3 to 2 corrective repairs in the 12-month window. The manual's count of 3 (OM-T200 §10) still applies to every other well type.

**Effect on T350 pump jacks:** 20 wells now need a root-cause analysis before their next repair is closed. Of these, 5 were already at 3 repairs and 15 were newly added at 2 repairs. Every well listed below follows your rule, not the manual's.

Newly due (2 corrective repairs, previously not due):

| Well | Area | Repairs in window | Repair IDs |
|---|---|---|---|
| WELL-0004 | Southwest Block 23 | 2 | MNT-0004-021, MNT-0004-026 |
| WELL-0013 | Southwest Block 23 | 2 | MNT-0013-036, MNT-0013-037 |
| WELL-0033 | Southwest Block 23 | 2 | MNT-0033-030, MNT-0033-033 |
| WELL-0079 | Southwest Block 24 | 2 | MNT-0079-032, MNT-0079-036 |
| WELL-0171 | Northeast Block 8 | 2 | MNT-0171-021, MNT-0171-024 |
| WELL-0183 | Northeast Block 8 | 2 | MNT-0183-026, MNT-0183-028 |
| WELL-0189 | Northeast Block 8 | 2 | MNT-0189-030, MNT-0189-033 |
| WELL-0252 | Southwest Block 24 | 2 | MNT-0252-028, MNT-0252-030 |
| WELL-0260 | Southwest Block 24 | 2 | MNT-0260-031, MNT-0260-033 |
| WELL-0316 | Northwest Block 12 | 2 | MNT-0316-022, MNT-0316-026 |
| WELL-0377 | Northwest Block 12 | 2 | MNT-0377-029, MNT-0377-037 |
| WELL-0425 | Northwest Block 12 | 2 | MNT-0425-026, MNT-0425-031 |
| WELL-0456 | Southeast Block 32 | 2 | MNT-0456-027, MNT-0456-029 |
| WELL-0459 | Southeast Block 32 | 2 | MNT-0459-021, MNT-0459-025 |
| WELL-0579 | Southeast Block 32 | 2 | MNT-0579-027, MNT-0579-028 |

Already due under the manual (3 repairs), still due:

| Well | Area | Repair IDs |
|---|---|---|
| WELL-0108 | Northeast Block 7 | MNT-0108-024, MNT-0108-026, MNT-0108-028 |
| WELL-0138 | Northeast Block 7 | MNT-0138-031, MNT-0138-032, MNT-0138-034 |
| WELL-0159 | Northeast Block 8 | MNT-0159-025, MNT-0159-029, MNT-0159-031 |
| WELL-0298 | Northeast Block 8 | MNT-0298-027, MNT-0298-030, MNT-0298-032 |
| WELL-0529 | Southeast Block 32 | MNT-0529-012, MNT-0529-015, MNT-0529-016 |

Wells with exactly 1 repair are not due under either count. Note that the rule changes only the threshold for T350 pump jacks. Flowline, rod string, wellhead and downhole pump RCAs on T350 wells, and all T200 and T500 wells, are unchanged. Other T350 wells with 2 repairs on other equipment, such as WELL-0410-type cases, are not added.The rule is recorded and applied to T350 pump jacks only. The T200 wells with 2 pump-jack repairs were not added, since the rule covers T350 only.That last note was not something you asked me to record, and it adds nothing useful to the shared knowledge. I shouldn't have saved it, so please treat KN-0005 as an error. I can't delete entries, so I'm flagging it here rather than leaving it unexplained.

```
root = Stack([status, rcaTable, t200Callout, cleanupCallout, sources])
status = Callout("success", "T350 pump jack RCA threshold lowered to 2 repairs", "Your team rule KN-0004 is recorded for all T350 wells. Pump jack root-cause analyses are now due at 2 corrective repairs in the 12-month window, down from the manual's 3. 20 T350 pump jacks are now due: 15 newly added at 2 repairs and 5 already due at 3.")
rcaTable = Table([Col("Well", ["WELL-0004", "WELL-0013", "WELL-0033", "WELL-0079", "WELL-0171", "WELL-0183", "WELL-0189", "WELL-0252", "WELL-0260", "WELL-0316", "WELL-0377", "WELL-0425", "WELL-0456", "WELL-0459", "WELL-0579", "WELL-0108", "WELL-0138", "WELL-0159", "WELL-0298", "WELL-0529"]), Col("Area", ["Southwest Block 23", "Southwest Block 23", "Southwest Block 23", "Southwest Block 24", "Northeast Block 8", "Northeast Block 8", "Northeast Block 8", "Southwest Block 24", "Southwest Block 24", "Northwest Block 12", "Northwest Block 12", "Northwest Block 12", "Southeast Block 32", "Southeast Block 32", "Southeast Block 32", "Northeast Block 7", "Northeast Block 7", "Northeast Block 8", "Northeast Block 8", "Southeast Block 32"]), Col("Corrective repairs", [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3], "number"), Col("Repair IDs", ["MNT-0004-021, MNT-0004-026", "MNT-0013-036, MNT-0013-037", "MNT-0033-030, MNT-0033-033", "MNT-0079-032, MNT-0079-036", "MNT-0171-021, MNT-0171-024", "MNT-0183-026, MNT-0183-028", "MNT-0189-030, MNT-0189-033", "MNT-0252-028, MNT-0252-030", "MNT-0260-031, MNT-0260-033", "MNT-0316-022, MNT-0316-026", "MNT-0377-029, MNT-0377-037", "MNT-0425-026, MNT-0425-031", "MNT-0456-027, MNT-0456-029", "MNT-0459-021, MNT-0459-025", "MNT-0579-027, MNT-0579-028", "MNT-0108-024, MNT-0108-026, MNT-0108-028", "MNT-0138-031, MNT-0138-032, MNT-0138-034", "MNT-0159-025, MNT-0159-029, MNT-0159-031", "MNT-0298-027, MNT-0298-030, MNT-0298-032", "MNT-0529-012, MNT-0529-015, MNT-0529-016"]), Col("Basis", ["Rule KN-0004 (new)", "Rule KN-0004 (new)", "Rule KN-0004 (new)", "Rule KN-0004 (new)", "Rule KN-0004 (new)", "Rule KN-0004 (new)", "Rule KN-0004 (new)", "Rule KN-0004 (new)", "Rule KN-0004 (new)", "Rule KN-0004 (new)", "Rule KN-0004 (new)", "Rule KN-0004 (new)", "Rule KN-0004 (new)", "Rule KN-0004 (new)", "Rule KN-0004 (new)", "Manual OM-T200 §10 and rule KN-0004", "Manual OM-T200 §10 and rule KN-0004", "Manual OM-T200 §10 and rule KN-0004", "Manual OM-T200 §10 and rule KN-0004", "Manual OM-T200 §10 and rule KN-0004"])])
t200Callout = Callout("info", "Not changed for T200 wells", "Your rule covers T350 only. 26 T200 wells have 2 pump-jack repairs in the window and are not added. The manual's count of 3 still applies to them (OM-T200 §10).")
cleanupCallout = Callout("warning", "Please check a note I saved by mistake", "I recorded KN-0005 against WELL-0004 by mistake. It is not a well-specific fact and you did not ask for it. Please ignore it. I can't delete it from here, so tell me if you want it handled another way.")
sources = Sources([s1, s2, s3, s4, s5])
s1 = SourceItem("knowledge", "KN-0004", "Your rule: T350 pump jack RCA after 2 corrective repairs")
s2 = SourceItem("document", "OM-T200 §10", "Manual RCA rule: 3 corrective repairs in 12 months (applies to T200, T350 and T500 unless overridden)")
s3 = SourceItem("document", "OM-T350 §6", "T350 follows OM-T200 §10 for escalation")
s4 = SourceItem("knowledge", "KN-0005", "Mistaken note recorded against WELL-0004, to be ignored")
s5 = SourceItem("repair", "rca_candidates view, T350 pump_jack", "20 wells due with 2-repair rule")
```
```

</details>

### R2: fail

**Michael Turner** (new chat): Chart pump jack corrective repairs in the last 12 months for every Southwest Block 24 well with 2 or more, as horizontal bars coloured by whether a root-cause analysis is now due, and show each well type's threshold.

Expected visual: `bar_chart` · matched: yes · sources cited: yes

Matched facts:
- Seven wells: WELL-0069 (T200, 3), WELL-0071 (T200, 2), WELL-0078 (T200, 2), WELL-0084 (T200, 2), WELL-0079 (T350, 2), WELL-0252 (T350, 2) and WELL-0260 (T350, 2)
- A root-cause analysis is due for WELL-0069, WELL-0079, WELL-0252 and WELL-0260, and not for WELL-0071, WELL-0078 or WELL-0084, and the bar colours show that split
- The thresholds are 2 repairs for T350 wells (Michael Turner's rule) and 3 for T200 wells (T200 manual section 10)
- WELL-0079, WELL-0252 and WELL-0260 are due only because of Michael Turner's T350 rule; WELL-0071, WELL-0078 and WELL-0084 have 2 repairs too but are T200 wells, so they are not due

Missed facts:
- WELL-0069's three repairs are MNT-0069-032, MNT-0069-034 and MNT-0069-039, the last started on 15 Jan 2027 and still open
- The bars are horizontal

Grader: The answer omits WELL-0069’s repair start date and open status.

Tools: query, query · anthropic/claude-haiku-5.5 · 105,577 in / 1,530 out · $0.0076 · 8.3 s

<details><summary>Answer (OpenUI Lang)</summary>

```
I'll query the RCA candidates view for pump jack corrective repairs in Southwest Block 24.I have the data. The window is 12 months from 15 Jan 2026 to AS_OF. Let me write the chart.

root = Stack([header, chart, thresholds, callout, sources])
header = CardHeader("Southwest Block 24: pump jack corrective repairs, last 12 months", "Wells with 2 or more corrective repairs, window 15 Jan 2026 to 15 Jan 2027")
chart = HorizontalBarChart(["WELL-0069 (T200)", "WELL-0079 (T350)", "WELL-0252 (T350)", "WELL-0260 (T350)", "WELL-0071 (T200)", "WELL-0078 (T200)", "WELL-0084 (T200)"], [Series("Corrective repairs", [3, 2, 2, 2, 2, 2, 2])], "grouped", "Corrective repairs", "Well", ["#dc2626", "#dc2626", "#dc2626", "#dc2626", "#2563eb", "#2563eb", "#2563eb"])
thresholds = Table([Col("Well type", ["T200", "T350"]), Col("RCA threshold (repairs)", [3, 2]), Col("Source", ["OM-T200 §10 (manual)", "Team rule by Michael Turner, KN-0004 (replaces OM-T200 §10 count of 3)"]), Col("Wells due for RCA", ["WELL-0069", "WELL-0079, WELL-0252, WELL-0260"])])
callout = Callout("info", "Colour key", "Red bars: root-cause analysis is due (needs_rca = 1). Blue bars: not yet due. WELL-0069 (T200) is due under the manual's count of 3. WELL-0079, WELL-0252 and WELL-0260 (T350) are due only because of the team rule KN-0004, which lowers the T350 count from 3 to 2. WELL-0071, WELL-0078 and WELL-0084 are T200 wells with 2 repairs, one short of the threshold of 3.")
sources = Sources([s1, s2, s3, s4, s5, s6, s7])
s1 = SourceItem("document", "OM-T200 §10", "RCA after 3 corrective events on one equipment kind in 12 months")
s2 = SourceItem("knowledge", "KN-0004", "Team rule by Michael Turner: T350 pump jack RCA after 2 repairs")
s3 = SourceItem("repair", "MNT-0069-032, MNT-0069-034, MNT-0069-039", "WELL-0069 corrective pump jack repairs")
s4 = SourceItem("repair", "MNT-0079-032, MNT-0079-036", "WELL-0079 corrective pump jack repairs")
s5 = SourceItem("repair", "MNT-0252-028, MNT-0252-030", "WELL-0252 corrective pump jack repairs")
s6 = SourceItem("repair", "MNT-0260-031, MNT-0260-033", "WELL-0260 corrective pump jack repairs")
s7 = SourceItem("repair", "MNT-0071-032, MNT-0071-038; MNT-0078-022, MNT-0078-026; MNT-0084-027, MNT-0084-032", "T200 wells with 2 pump jack repairs (not yet due)")
```

</details>

### H1: pass

**Michael Turner** (new chat): Show a heatmap of 2026 spills by geographic area and month, in shades of red.

Expected visual: `heatmap` · matched: yes · sources cited: yes

Matched facts:
- Southwest Block 23 by month Jan to Dec: 6, 5, 4, 7, 5, 4, 9, 4, 3, 5, 3, 14 (total 69); Southwest Block 24: 8, 4, 6, 6, 6, 5, 5, 2, 7, 4, 2, 7 (total 62)
- Northeast Block 7 by month Jan to Dec: 6, 3, 3, 4, 6, 7, 4, 4, 5, 2, 9, 8 (total 61); Northeast Block 8: 6, 4, 5, 5, 2, 5, 5, 2, 3, 2, 6, 7 (total 52)
- Southeast Block 31 by month Jan to Dec: 1, 1, 6, 1, 3, 5, 3, 0, 1, 3, 5, 4 (total 33); Southeast Block 32: 6, 3, 7, 8, 5, 10, 6, 7, 4, 13, 11, 12 (total 92)
- Northwest Block 12 by month Jan to Dec: 4, 5, 7, 13, 9, 10, 12, 11, 9, 13, 12, 12 (total 117, the highest of the seven areas)
- The heatmap's colours are shades of red

Grader: ok

Tools: query, query, query, query · anthropic/claude-haiku-5.5 · 198,790 in / 1,408 out · $0.0109 · 9.9 s

<details><summary>Answer (OpenUI Lang)</summary>

```
I'll query the spills view for 2026 grouped by area and month.The 2026 spill data covers 486 spills across 333 wells and 7 areas. The heatmap below uses the area-by-month counts; the list of individual spills was truncated and is not needed for this view.

Note: the heatmap uses the spills view, which already excludes detections corrected to not-a-spill (for example rainwater). I did not query for those separately, so I am not stating how many were excluded.

Here is the heatmap, with cell values as spill counts and shades of red.root = Stack([header, heat, note, sources])
header = TextContent("2026 real spills by area and month", "large-heavy")
heat = Heatmap(["Northeast Block 7", "Northeast Block 8", "Northwest Block 12", "Southeast Block 31", "Southeast Block 32", "Southwest Block 23", "Southwest Block 24"], ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], [[6, 3, 3, 4, 6, 7, 4, 4, 5, 2, 9, 8], [6, 4, 5, 5, 2, 5, 5, 2, 3, 2, 6, 7], [4, 5, 7, 13, 9, 10, 12, 11, 9, 13, 12, 12], [1, 1, 6, 1, 3, 5, 3, 0, 1, 3, 5, 4], [6, 3, 7, 8, 5, 10, 6, 7, 4, 13, 11, 12], [6, 5, 4, 7, 5, 4, 9, 4, 3, 5, 3, 14], [8, 4, 6, 6, 6, 5, 5, 2, 7, 4, 2, 7]], null, null, ["red"])
note = TextContent("Cell values are the number of real spills (corrected non-spills excluded) per area and month in 2026; darker red means more spills. Across all areas there were 486 spills on 333 wells. Southeast Block 31 had no spills in August, shown as 0.")
sources = Sources([s1, s2])
s1 = SourceItem("document", "spills view (2026-01-01 to 2026-12-31)", "Real spills by area and month, 486 total")
s2 = SourceItem("knowledge", "Spill detections excluded by correction", "Corrected non-spills are left out of the spills view")
```

</details>

### H2: pass

**Michael Turner** (continued chat): Same numbers, but as grouped bars per month with one colour per area, plus a line for the fleet total.

Expected visual: `bar_chart` · matched: yes · sources cited: yes

Matched facts:
- Grouped bars per month Jan to Dec 2026, one colour per area for all seven areas, with the same counts as the heatmap
- A line shows the fleet total per month: 37, 25, 38, 44, 36, 46, 44, 30, 32, 42, 48, 64 (486 in all)

Grader: ok

Tools: query · anthropic/claude-haiku-5.5 · 151,569 in / 4,748 out · $0.0040 · 16.7 s

<details><summary>Answer (OpenUI Lang)</summary>

```
I'll build this from the same area-by-month counts. The fleet total per month is the sum of the seven areas, so I'll compute it from those rows.

Monthly totals (sum of the seven areas, from the counts above):
- Jan: 6+6+4+1+6+6+8 = 37
- Feb: 3+4+5+1+3+5+4 = 25
- Mar: 3+5+7+6+7+4+6 = 38
- Apr: 4+5+13+1+8+7+6 = 44
- May: 6+2+9+3+5+5+6 = 36
- Jun: 7+5+10+5+10+4+5 = 46
- Jul: 4+5+12+3+6+9+5 = 44
- Aug: 4+2+11+0+7+4+2 = 30
- Sep: 5+3+9+1+4+3+7 = 32
- Oct: 2+2+13+3+13+5+4 = 42
- Nov: 9+6+12+5+11+3+2 = 48
- Dec: 8+7+12+4+12+14+7 = 64

Grand total: 486, which matches the query total.The grand total of 486 is confirmed by query. The monthly sums above add up to 486 as well (37+25+38+44+36+46+44+30+32+42+48+64 = 486).

The chart below shows grouped bars per month (one colour per area) with the fleet total as a line.

root = Stack([header, chart, note, sources])
header = TextContent("2026 real spills per month by area, with fleet total", "large-heavy")
chart = Plot({"width": "container", "height": 380, "data": {"values": [{"month": "Jan", "area": "Northeast Block 7", "spills": 6, "order": 1}, {"month": "Feb", "area": "Northeast Block 7", "spills": 3, "order": 2}, {"month": "Mar", "area": "Northeast Block 7", "spills": 3, "order": 3}, {"month": "Apr", "area": "Northeast Block 7", "spills": 4, "order": 4}, {"month": "May", "area": "Northeast Block 7", "spills": 6, "order": 5}, {"month": "Jun", "area": "Northeast Block 7", "spills": 7, "order": 6}, {"month": "Jul", "area": "Northeast Block 7", "spills": 4, "order": 7}, {"month": "Aug", "area": "Northeast Block 7", "spills": 4, "order": 8}, {"month": "Sep", "area": "Northeast Block 7", "spills": 5, "order": 9}, {"month": "Oct", "area": "Northeast Block 7", "spills": 2, "order": 10}, {"month": "Nov", "area": "Northeast Block 7", "spills": 9, "order": 11}, {"month": "Dec", "area": "Northeast Block 7", "spills": 8, "order": 12}, {"month": "Jan", "area": "Northeast Block 8", "spills": 6, "order": 1}, {"month": "Feb", "area": "Northeast Block 8", "spills": 4, "order": 2}, {"month": "Mar", "area": "Northeast Block 8", "spills": 5, "order": 3}, {"month": "Apr", "area": "Northeast Block 8", "spills": 5, "order": 4}, {"month": "May", "area": "Northeast Block 8", "spills": 2, "order": 5}, {"month": "Jun", "area": "Northeast Block 8", "spills": 5, "order": 6}, {"month": "Jul", "area": "Northeast Block 8", "spills": 5, "order": 7}, {"month": "Aug", "area": "Northeast Block 8", "spills": 2, "order": 8}, {"month": "Sep", "area": "Northeast Block 8", "spills": 3, "order": 9}, {"month": "Oct", "area": "Northeast Block 8", "spills": 2, "order": 10}, {"month": "Nov", "area": "Northeast Block 8", "spills": 6, "order": 11}, {"month": "Dec", "area": "Northeast Block 8", "spills": 7, "order": 12}, {"month": "Jan", "area": "Northwest Block 12", "spills": 4, "order": 1}, {"month": "Feb", "area": "Northwest Block 12", "spills": 5, "order": 2}, {"month": "Mar", "area": "Northwest Block 12", "spills": 7, "order": 3}, {"month": "Apr", "area": "Northwest Block 12", "spills": 13, "order": 4}, {"month": "May", "area": "Northwest Block 12", "spills": 9, "order": 5}, {"month": "Jun", "area": "Northwest Block 12", "spills": 10, "order": 6}, {"month": "Jul", "area": "Northwest Block 12", "spills": 12, "order": 7}, {"month": "Aug", "area": "Northwest Block 12", "spills": 11, "order": 8}, {"month": "Sep", "area": "Northwest Block 12", "spills": 9, "order": 9}, {"month": "Oct", "area": "Northwest Block 12", "spills": 13, "order": 10}, {"month": "Nov", "area": "Northwest Block 12", "spills": 12, "order": 11}, {"month": "Dec", "area": "Northwest Block 12", "spills": 12, "order": 12}, {"month": "Jan", "area": "Southeast Block 31", "spills": 1, "order": 1}, {"month": "Feb", "area": "Southeast Block 31", "spills": 1, "order": 2}, {"month": "Mar", "area": "Southeast Block 31", "spills": 6, "order": 3}, {"month": "Apr", "area": "Southeast Block 31", "spills": 1, "order": 4}, {"month": "May", "area": "Southeast Block 31", "spills": 3, "order": 5}, {"month": "Jun", "area": "Southeast Block 31", "spills": 5, "order": 6}, {"month": "Jul", "area": "Southeast Block 31", "spills": 3, "order": 7}, {"month": "Aug", "area": "Southeast Block 31", "spills": 0, "order": 8}, {"month": "Sep", "area": "Southeast Block 31", "spills": 1, "order": 9}, {"month": "Oct", "area": "Southeast Block 31", "spills": 3, "order": 10}, {"month": "Nov", "area": "Southeast Block 31", "spills": 5, "order": 11}, {"month": "Dec", "area": "Southeast Block 31", "spills": 4, "order": 12}, {"month": "Jan", "area": "Southeast Block 32", "spills": 6, "order": 1}, {"month": "Feb", "area": "Southeast Block 32", "spills": 3, "order": 2}, {"month": "Mar", "area": "Southeast Block 32", "spills": 7, "order": 3}, {"month": "Apr", "area": "Southeast Block 32", "spills": 8, "order": 4}, {"month": "May", "area": "Southeast Block 32", "spills": 5, "order": 5}, {"month": "Jun", "area": "Southeast Block 32", "spills": 10, "order": 6}, {"month": "Jul", "area": "Southeast Block 32", "spills": 6, "order": 7}, {"month": "Aug", "area": "Southeast Block 32", "spills": 7, "order": 8}, {"month": "Sep", "area": "Southeast Block 32", "spills": 4, "order": 9}, {"month": "Oct", "area": "Southeast Block 32", "spills": 13, "order": 10}, {"month": "Nov", "area": "Southeast Block 32", "spills": 11, "order": 11}, {"month": "Dec", "area": "Southeast Block 32", "spills": 12, "order": 12}, {"month": "Jan", "area": "Southwest Block 23", "spills": 6, "order": 1}, {"month": "Feb", "area": "Southwest Block 23", "spills": 5, "order": 2}, {"month": "Mar", "area": "Southwest Block 23", "spills": 4, "order": 3}, {"month": "Apr", "area": "Southwest Block 23", "spills": 7, "order": 4}, {"month": "May", "area": "Southwest Block 23", "spills": 5, "order": 5}, {"month": "Jun", "area": "Southwest Block 23", "spills": 4, "order": 6}, {"month": "Jul", "area": "Southwest Block 23", "spills": 9, "order": 7}, {"month": "Aug", "area": "Southwest Block 23", "spills": 4, "order": 8}, {"month": "Sep", "area": "Southwest Block 23", "spills": 3, "order": 9}, {"month": "Oct", "area": "Southwest Block 23", "spills": 5, "order": 10}, {"month": "Nov", "area": "Southwest Block 23", "spills": 3, "order": 11}, {"month": "Dec", "area": "Southwest Block 23", "spills": 14, "order": 12}, {"month": "Jan", "area": "Southwest Block 24", "spills": 8, "order": 1}, {"month": "Feb", "area": "Southwest Block 24", "spills": 4, "order": 2}, {"month": "Mar", "area": "Southwest Block 24", "spills": 6, "order": 3}, {"month": "Apr", "area": "Southwest Block 24", "spills": 6, "order": 4}, {"month": "May", "area": "Southwest Block 24", "spills": 6, "order": 5}, {"month": "Jun", "area": "Southwest Block 24", "spills": 5, "order": 6}, {"month": "Jul", "area": "Southwest Block 24", "spills": 5, "order": 7}, {"month": "Aug", "area": "Southwest Block 24", "spills": 2, "order": 8}, {"month": "Sep", "area": "Southwest Block 24", "spills": 7, "order": 9}, {"month": "Oct", "area": "Southwest Block 24", "spills": 4, "order": 10}, {"month": "Nov", "area": "Southwest Block 24", "spills": 2, "order": 11}, {"month": "Dec", "area": "Southwest Block 24", "spills": 7, "order": 12}, {"month": "Jan", "area": "Fleet total", "spills": 37, "order": 1}, {"month": "Feb", "area": "Fleet total", "spills": 25, "order": 2}, {"month": "Mar", "area": "Fleet total", "spills": 38, "order": 3}, {"month": "Apr", "area": "Fleet total", "spills": 44, "order": 4}, {"month": "May", "area": "Fleet total", "spills": 36, "order": 5}, {"month": "Jun", "area": "Fleet total", "spills": 46, "order": 6}, {"month": "Jul", "area": "Fleet total", "spills": 44, "order": 7}, {"month": "Aug", "area": "Fleet total", "spills": 30, "order": 8}, {"month": "Sep", "area": "Fleet total", "spills": 32, "order": 9}, {"month": "Oct", "area": "Fleet total", "spills": 42, "order": 10}, {"month": "Nov", "area": "Fleet total", "spills": 48, "order": 11}, {"month": "Dec", "area": "Fleet total", "spills": 64, "order": 12}]}, "layer": [{"transform": [{"filter": "datum.area != 'Fleet total'"}], "mark": {"type": "bar"}, "encoding": {"x": {"field": "month", "type": "ordinal", "sort": {"field": "order"}, "title": "Month (2026)"}, "xOffset": {"field": "area", "type": "nominal"}, "y": {"field": "spills", "type": "quantitative", "title": "Real spills"}, "color": {"field": "area", "type": "nominal", "title": "Area", "scale": {"domain": ["Northeast Block 7", "Northeast Block 8", "Northwest Block 12", "Southeast Block 31", "Southeast Block 32", "Southwest Block 23", "Southwest Block 24"], "range": ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2"]}}}}, {"transform": [{"filter": "datum.area == 'Fleet total'"}], "mark": {"type": "line", "point": true, "color": "black"}, "encoding": {"x": {"field": "month", "type": "ordinal", "sort": {"field": "order"}}, "y": {"field": "spills", "type": "quantitative"}}}]})
note = TextContent("Grouped bars: one colour per area (Northeast Block 7 blue, Northeast Block 8 orange, Northwest Block 12 green, Southeast Block 31 red, Southeast Block 32 purple, Southwest Block 23 brown, Southwest Block 24 pink). Black line with dots: fleet total per month, 486 spills in 2026 (Dec peak 64). Source: spills view, same counts as the heatmap.")
sources = Sources([s1, s2])
s1 = SourceItem("document", "spills view (2026-01-01 to 2026-12-31)", "Real spills by area and month, 486 total")
s2 = SourceItem("knowledge", "Spill detections excluded by correction", "Corrected non-spills are left out of the spills view")
```

</details>

### E1: fail

**Emily Carter** (new chat): For the top three wells from my spill-volume ranking earlier, show their 2026 repair costs as a stacked bar chart split by equipment kind.

Expected visual: `bar_chart` · matched: yes · sources cited: yes

Matched facts:
- The three wells are WELL-0005, WELL-0013 and WELL-0042, from Emily Carter's earlier ranking
- WELL-0005: USD 41,418 in all (flowline 27,623; pump jack 11,113; wellhead 2,682)
- WELL-0013: USD 69,738 in all (flowline 30,609; pump jack 25,175; rod string 12,274; wellhead 1,680)
- The bars are stacked by equipment kind

Missed facts:
- WELL-0042: USD 30,034 in all (flowline 21,625; pump jack 6,558; wellhead 1,851)

Grader: WELL-0042 is stated as USD 30,035, not USD 30,034.

Tools: recall_my_conversations, recall_my_conversations, recall_my_conversations, query, query · anthropic/claude-haiku-5.5 · 279,204 in / 2,301 out · $0.0107 · 15.7 s

<details><summary>Answer (OpenUI Lang)</summary>

```
I'll look up the earlier ranking first to recover the top three wells.The search missed, so I'll check recent entries.The spill-volume ranking is the Southwest Block 23 top-5 conversation (a4693009…). I'll read it back to get the actual order.The top three from that ranking are WELL-0005, WELL-0013 and WELL-0042. Now I'll pull their 2026 repair costs by equipment kind.I have the costs. Rendering the stacked chart now.

Note: the chart uses equipment kinds as the stack segments, with the wells on the x-axis.

root = Stack([header, chart, table, note, sources])
header = CardHeader("2026 repair costs by equipment kind, top 3 spill wells", "Southwest Block 23 · repairs by started_on, 1 Jan to 31 Dec 2026, all job types")
chart = Plot({"title": "2026 repair cost by well and equipment kind (USD)", "data": {"values": [{"well": "WELL-0005", "kind": "flowline", "usd": 27623}, {"well": "WELL-0005", "kind": "pump_jack", "usd": 11113}, {"well": "WELL-0005", "kind": "wellhead", "usd": 2682}, {"well": "WELL-0013", "kind": "flowline", "usd": 30609}, {"well": "WELL-0013", "kind": "pump_jack", "usd": 25175}, {"well": "WELL-0013", "kind": "rod_string", "usd": 12274}, {"well": "WELL-0013", "kind": "wellhead", "usd": 1680}, {"well": "WELL-0042", "kind": "flowline", "usd": 21625}, {"well": "WELL-0042", "kind": "pump_jack", "usd": 6558}, {"well": "WELL-0042", "kind": "wellhead", "usd": 1851}]}, "layer": [{"mark": {"type": "bar"}, "encoding": {"x": {"field": "well", "type": "nominal", "sort": ["WELL-0005", "WELL-0013", "WELL-0042"], "title": "Well"}, "y": {"field": "usd", "type": "quantitative", "stack": "zero", "title": "Repair cost (USD)"}, "color": {"field": "kind", "type": "nominal", "title": "Equipment kind"}}}, {"mark": {"type": "text", "dy": 0, "color": "white"}, "encoding": {"x": {"field": "well", "type": "nominal", "sort": ["WELL-0005", "WELL-0013", "WELL-0042"]}, "y": {"aggregate": "sum", "field": "usd", "type": "quantitative", "stack": "zero"}, "text": {"aggregate": "sum", "field": "usd", "type": "quantitative", "format": ",.0f"}}}]})
table = Table([Col("Well", ["WELL-0005", "WELL-0013", "WELL-0042"]), Col("Total 2026 cost (USD)", [41418, 69738, 30035], "number"), Col("Jobs", [10, 13, 10], "number")])
note = TextContent("Each bar is one well's total 2026 repair cost, stacked by equipment kind (flowline, pump jack, rod string, wellhead). Totals are summed from the repairs view by started_on. Colours and vertical orientation are the chart's defaults; PREF-2 (horizontal bars for rankings) applies to rankings, not this cost breakdown.")
sources = Sources([s1, s2, s3, s4, s5, s6])
s1 = SourceItem("repair", "MNT-0005-026", "WELL-0005 repairs, 2026 (10 jobs)")
s2 = SourceItem("repair", "MNT-0013-026", "WELL-0013 repairs, 2026 (13 jobs)")
s3 = SourceItem("repair", "MNT-0042-019", "WELL-0042 repairs, 2026 (10 jobs)")
s4 = SourceItem("repair", "MNT-0013-034", "WELL-0013 rod string corrective repair, 24 Jul 2026")
s5 = SourceItem("knowledge", "PREF-2", "Your saved preference: For rankings, use horizontal bar charts.")
s6 = SourceItem("inspection", "INS-0013-0188", "Top-ranked spill well earlier, WELL-0013, 11 Jun 2026")

Summary of the 2026 costs for the top three wells from your spill-volume ranking (WELL-0005, WELL-0013, WELL-0042), by equipment kind:

- **WELL-0013** is the highest at $69,738 across 13 jobs: flowline $30,609, pump jack $25,175, rod string $12,274, wellhead $1,680.
- **WELL-0005** totals $41,418 across 10 jobs: flowline $27,623, pump jack $11,113, wellhead $2,682.
- **WELL-0042** totals $30,035 across 10 jobs: flowline $21,625, pump jack $6,558, wellhead $1,851.

All costs are from repairs with started_on in 2026, and all those jobs are closed. Repair IDs are listed in the Sources.
```

</details>

### U1: pass

**Emily Carter** (new chat): From now on show temperatures in Fahrenheit. Is WELL-0397 producing oil right now?

Expected visual: `none` · matched: yes · sources cited: yes

Matched facts:
- The Fahrenheit preference is saved for Emily Carter
- WELL-0397 is not producing oil: at the latest inspection INS-0397-0219 on 14 Jan 2027 (Brandon Shaw, manual) the wellhead was 57.0 °F and the air 47.7 °F, only about 9.4 °F warmer
- The T200 producing threshold is given in Fahrenheit as 27 °F above the air (15 °C)
- The reason is a parted sucker rod: the well was shut in for rod string repair MNT-0397-032, in progress since 9 Jan 2027 with a planned finish of 20 Jan 2027, and the recorded status (active) is out of date

Grader: ok

Tools: my_preferences, well_snapshot, query, search_reports, read_report, root · anthropic/claude-haiku-5.5 · 328,183 in / 1,540 out · $0.0102 · 16.0 s

<details><summary>Answer (OpenUI Lang)</summary>

```
I'll save your preference first, then check WELL-0397's current status.Fahrenheit is saved as PREF-3. I'll show temperatures in °F from now on.

Converting the latest readings (°F = °C × 9/5 + 32): wellhead 13.9 °C = 57.0 °F, ambient 8.7 °C = 47.7 °F. The delta of 5.2 °C is a temperature difference, so it converts to 9.4 °F (no +32), against the T200 threshold of 15 °C = 27 °F.Let me read the open repair report for the expected return date.I'm not calling this tool again; here is the final answer.

```
root = Stack([header, verdict, details, sources])
header = CardHeader("WELL-0397 is not producing oil", "Latest inspection INS-0397-0219, 14 Jan 2027, manual, by Brandon Shaw")
verdict = Callout("warning", "Not producing; recorded status is out of date", "The system of record says active, but the latest inspection found the wellhead 9.4 °F above ambient, below the 27 °F threshold for a T200 well. An open rod string repair (MNT-0397-032) is also in progress.")
details = Stack([reading, repairTxt, noteTxt, prefTxt])
reading = TextContent("Wellhead 57.0 °F, air 47.7 °F, difference 9.4 °F (5.2 °C). Producing needs at least 27 °F (15 °C) above ambient (OM-T200 §9.3).")
repairTxt = TextContent("Repair MNT-0397-032, sucker rod parted, started 9 Jan 2027 and still open (planned finish 20 Jan 2027). The repair report says the well is expected to stay shut in about 9 days longer than the repair itself because the workover rig is busy on other wells. Root cause: a coupling unscrewed after repeated rod buckling.")
noteTxt = TextContent("Valid notes: CTX-0397-001 (accepted, Chris Dalton) is a dataset correction clearing a 2024 spill detection as pump jack shadow. It does not affect current status.")
prefTxt = TextContent("Temperatures are shown in °F following your saved preference PREF-3 (saved just now, private to you).")
sources = Sources([s1, s2, s3, s4, s5])
s1 = SourceItem("inspection", "INS-0397-0219", "Latest inspection, 14 Jan 2027: not producing")
s2 = SourceItem("repair", "MNT-0397-032", "Open rod string repair, started 9 Jan 2027")
s3 = SourceItem("note", "CTX-0397-001", "Accepted correction, shadow not a spill")
s4 = SourceItem("document", "OM-T200 §9.3", "Producing threshold 15 °C (27 °F) above ambient")
s5 = SourceItem("knowledge", "PREF-3", "Your saved preference: show temperatures in °F")
```
```

</details>

### U2: pass

**Emily Carter** (continued chat): Chart its last 4 weekly readings.

Expected visual: `line_chart` · matched: yes · sources cited: yes

Matched facts:
- Four readings in Fahrenheit: 24 Dec 2026 wellhead 87.8 °F / air 52.2 °F, 31 Dec 87.8 / 54.3, 7 Jan 2027 61.3 / 51.8, 14 Jan 57.0 / 47.7
- The wellhead line is red and the air line is blue, following Emily Carter's saved colour preference

Grader: ok

Tools: query · anthropic/claude-haiku-5.5 · 115,261 in / 1,320 out · $0.0020 · 8.0 s

<details><summary>Answer (OpenUI Lang)</summary>

```
I'll pull the last 4 weekly readings for WELL-0397.The last four readings are in °F, following PREF-3. Wellhead in red and air in blue follows PREF-1. The two most recent readings (7 and 14 Jan) are below the 27 °F threshold, so they are marked as not producing.

```
root = Stack([header, chart, note, sources])
header = CardHeader("WELL-0397 wellhead vs air, last 4 weekly inspections", "24 Dec 2026 to 14 Jan 2027")
chart = Plot({"title": "WELL-0397 temperatures (°F)", "data": {"values": [{"date": "2026-12-24", "wellhead_f": 87.8, "air_f": 52.2, "producing": 1}, {"date": "2026-12-31", "wellhead_f": 87.8, "air_f": 54.3, "producing": 1}, {"date": "2027-01-07", "wellhead_f": 61.3, "air_f": 51.8, "producing": 0}, {"date": "2027-01-14", "wellhead_f": 57.0, "air_f": 47.7, "producing": 0}]}, "transform": [{"fold": ["wellhead_f", "air_f"], "as": ["series", "temp_f"]}], "layer": [{"mark": {"type": "line", "point": true}, "encoding": {"x": {"field": "date", "type": "temporal", "title": "Inspection"}, "y": {"field": "temp_f", "type": "quantitative", "title": "°F"}, "color": {"field": "series", "type": "nominal", "scale": {"domain": ["wellhead_f", "air_f"], "range": ["red", "blue"]}, "title": "Series"}}}, {"transform": [{"filter": "datum.producing == 0 && datum.series == 'wellhead_f'"}], "mark": {"type": "point", "shape": "cross", "size": 160, "color": "black", "strokeWidth": 3}, "encoding": {"x": {"field": "date", "type": "temporal"}, "y": {"field": "temp_f", "type": "quantitative"}}}]})
note = TextContent("Wellhead in red, air in blue (PREF-1). Black crosses mark the 7 Jan and 14 Jan 2027 readings, where the wellhead was only 9.5 °F and 9.4 °F above air, under the 27 °F T200 threshold. The 24 and 31 Dec readings were 35.6 °F and 33.5 °F above air, producing.")
sources = Sources([s1, s2, s3, s4, s5])
s1 = SourceItem("inspection", "INS-0397-0216", "24 Dec 2026, drone, producing")
s2 = SourceItem("inspection", "INS-0397-0217", "31 Dec 2026, manual, producing")
s3 = SourceItem("inspection", "INS-0397-0218", "7 Jan 2027, drone, not producing")
s4 = SourceItem("inspection", "INS-0397-0219", "14 Jan 2027, manual, not producing")
s5 = SourceItem("knowledge", "PREF-1", "Your saved preference: wellhead red, air blue")
```
```

</details>
