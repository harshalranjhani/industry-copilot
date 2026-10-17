# 04: Map and heatmap visuals

**What to build:** When an answer is about locations, the copilot shows an interactive map with pins. When it's about two dimensions, such as area × month, it shows a heatmap. Both are custom OpenUI components, added to the extended library and described to the model through the generated prompt, so the model can pick them or the user can ask for them by name. This slice can be built in parallel by a sub-agent against the agreed props.

**Blocked by:** 01 — Chat skeleton

**Status:** ready-for-agent

- [ ] `GeoMap`: Leaflet with OpenStreetMap tiles, auto-fit to its points. Props: points with lat, lon, label, and optional detail and value. A popup shows each point's label and detail
- [ ] `Heatmap`: wraps OpenUI's heatmap primitive. Props: row labels, column labels, a value matrix, and optional row and column totals. Cells show their values, and the colour scale is readable in light and dark themes
- [ ] Both are registered in the library slots for Stack and Card children, with descriptions that tell the model when to use each
- [ ] Both render correctly while streaming (partial props don't crash) and after completion
- [ ] Demo: asking for a map of a few wells, or a heatmap of any small matrix, renders correctly in the chat. Once 03 has landed, Q7 renders 4 pins and Q8 renders the 4×10 area × month heatmap with totals
