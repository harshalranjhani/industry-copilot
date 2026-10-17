import { createParser } from "@openuidev/react-lang";
import { describe, expect, it } from "vitest";
import { answerCsv, exportFileName, extractAnswerData, pdfText } from "./export-data";
import { promptLibrary } from "./library";

const parse = (program: string) => createParser(promptLibrary.toJSONSchema(), promptLibrary.root).parse(program).root;

describe("extractAnswerData", () => {
  it("collects tables, charts, plots, maps, heatmaps and sources in reading order", () => {
    const root = parse(`root = Stack([card, sources])
card = Card([header, table, bars, plot, map, heat])
header = CardHeader("Spills in Northeast Block 8", "Last 90 days")
table = Table([Col("Well", ["WELL-0151", "WELL-0165"]), Col("Volume (bbl)", [5.4, 1.2], "number")])
bars = BarChart(["Jul", "Sep"], [Series("Spills", [3, 1])], null, "Month", null, null, ["red"])
plot = Plot({"title": "Volume vs containment", "data": {"values": [{"well": "WELL-0151", "bbl": 5.4, "hours": 6.4}]}, "mark": "point"})
map = GeoMap([{lat: 32.1, lon: -102.1, label: "WELL-0151", value: 5.4}])
heat = Heatmap(["NE-08"], ["Jul", "Aug"], [[4, 0]])
sources = Sources([SourceItem("inspection", "INS-0151-0201", "Spill")])`);
    const data = extractAnswerData(root);
    expect(data.title).toBe("Spills in Northeast Block 8");
    expect(data.subtitle).toBe("Last 90 days");
    expect(data.tables.map((t) => t.title)).toEqual([
      "Spills in Northeast Block 8 · Table",
      "Spills in Northeast Block 8 · Bar chart",
      "Spills in Northeast Block 8 · Volume vs containment",
      "Spills in Northeast Block 8 · Map",
      "Spills in Northeast Block 8 · Heatmap",
    ]);
    expect(data.tables[0]).toMatchObject({ columns: ["Well", "Volume (bbl)"], rows: [["WELL-0151", 5.4], ["WELL-0165", 1.2]] });
    expect(data.tables[1]).toMatchObject({ columns: ["Month", "Spills"], rows: [["Jul", 3], ["Sep", 1]] });
    expect(data.tables[2]).toMatchObject({ columns: ["well", "bbl", "hours"], rows: [["WELL-0151", 5.4, 6.4]] });
    expect(data.tables[3]).toMatchObject({ columns: ["Label", "Latitude", "Longitude", "Value"], rows: [["WELL-0151", 32.1, -102.1, 5.4]] });
    expect(data.tables[4]).toMatchObject({ columns: ["", "Jul", "Aug"], rows: [["NE-08", 4, 0]] });
    expect(data.sources).toEqual([{ kind: "inspection", reference: "INS-0151-0201", label: "Spill" }]);
  });

  it("finds a plot's data in its layers, once per distinct data set", () => {
    const root = parse(`root = Stack([p])
p = Plot({"layer": [{"data": {"values": [{"a": 1}]}, "mark": "line"}, {"data": {"values": [{"a": 1}]}, "mark": "point"}, {"data": {"values": [{"b": 2}]}, "mark": "rule"}]})`);
    expect(extractAnswerData(root).tables.map((t) => t.columns)).toEqual([["a"], ["b"]]);
  });

  it("returns nothing for an answer without data", () => {
    expect(extractAnswerData(parse(`root = Stack([TextContent("hi")])`))).toEqual({ tables: [], sources: [] });
  });
});

describe("downloads", () => {
  it("writes every table under its title, quoting cells that need it", () => {
    const csv = answerCsv({
      tables: [{ title: "Wells", columns: ["Well", "Note"], rows: [["WELL-0001", 'Said "shut in", 7 Oct']] }],
      sources: [{ kind: "note", reference: "CTX-0001-003", label: "Shut-in" }],
    });
    expect(csv).toBe('Wells\nWell,Note\nWELL-0001,"Said ""shut in"", 7 Oct"\n\nSources\nKind,Reference,Supports\nnote,CTX-0001-003,Shut-in\n');
  });

  it("keeps PDF text inside the built-in fonts", () => {
    expect(pdfText("3.2 °C → below ≥15 °C ✕ 🛢")).toBe("3.2 °C -> below >=15 °C x ");
  });

  it("names files after the answer", () => {
    expect(exportFileName("WELL-0001 is not producing oil", "pdf")).toBe("well-0001-is-not-producing-oil.pdf");
    expect(exportFileName(undefined, "csv")).toBe("copilot-answer.csv");
  });
});
