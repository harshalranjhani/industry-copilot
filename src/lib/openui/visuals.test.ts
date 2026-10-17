import { describe, expect, it } from "vitest";
import { expandRamp, styleMapPins, toHeatmapData, toMapOptions, toMapPoints, toPalette, toPlotSpec } from "./visuals";

describe("toMapPoints", () => {
  it("keeps complete points and drops half-streamed or invalid ones", () => {
    const points = toMapPoints([
      { lat: 27.5, lon: 71.2, label: "WELL-0001", detail: "Producing", value: 12 },
      { lat: 27.6, lon: 71.3 }, // label not streamed yet
      { lat: 27.7, label: "WELL-0003" }, // lon not streamed yet
      { lat: 95, lon: 71, label: "bad latitude" },
      null,
      { lat: 27.8, lon: 71.4, label: "WELL-0005" },
    ]);
    expect(points).toEqual([
      { lat: 27.5, lon: 71.2, label: "WELL-0001", detail: "Producing", value: 12 },
      { lat: 27.8, lon: 71.4, label: "WELL-0005" },
    ]);
  });

  it("returns no points before the array has streamed", () => {
    expect(toMapPoints(undefined)).toEqual([]);
  });
});

describe("toHeatmapData", () => {
  it("builds one datum per column, with each row's value, and totals in the labels", () => {
    const heatmap = toHeatmapData({
      rows: ["NE-08", "SW-02"],
      columns: ["Jan", "Feb"],
      values: [
        [1, 2],
        [3, 4],
      ],
      rowTotals: [3, 7],
      columnTotals: [4, 6],
    });
    expect(heatmap).not.toBeNull();
    expect(heatmap!.data).toEqual([
      { [heatmap!.categoryKey]: "Jan · 4", "NE-08 · 3": 1, "SW-02 · 7": 3 },
      { [heatmap!.categoryKey]: "Feb · 6", "NE-08 · 3": 2, "SW-02 · 7": 4 },
    ]);
  });

  it("leaves cells that have not streamed yet empty instead of throwing", () => {
    const heatmap = toHeatmapData({
      rows: ["A", "B"],
      columns: ["x", "y"],
      values: [[1], undefined as unknown as number[]],
    });
    expect(heatmap!.data.map((d) => [d.A, d.B])).toEqual([
      [1, undefined],
      [undefined, undefined],
    ]);
  });

  it("returns null until there is at least one row and one column", () => {
    expect(toHeatmapData({ rows: undefined, columns: ["x"], values: [] })).toBeNull();
    expect(toHeatmapData({ rows: ["A"], columns: [], values: [] })).toBeNull();
  });
});

describe("map styling", () => {
  it("keeps valid pin colours, groups and sizes and drops unsafe ones", () => {
    const [a, b] = toMapPoints([
      { lat: 1, lon: 2, label: "A", color: "#d62828", group: "Not producing", size: 12 },
      { lat: 1, lon: 2, label: "B", color: "url(javascript:x)", group: "", size: 400 },
    ]);
    expect(a).toEqual({ lat: 1, lon: 2, label: "A", color: "#d62828", group: "Not producing", size: 12 });
    expect(b).toEqual({ lat: 1, lon: 2, label: "B" });
  });

  it("reads only known map options", () => {
    expect(toMapOptions({ basemap: "dark", colorBy: "group", palette: ["red", "bad()"], showLabels: true, extra: 1 })).toEqual({
      basemap: "dark",
      colorBy: "group",
      palette: ["red"],
      showLabels: true,
    });
    expect(toMapOptions({ basemap: "moon" })).toEqual({});
  });

  it("colours pins by group with a legend, letting an explicit colour name the group's swatch", () => {
    const points = toMapPoints([
      { lat: 1, lon: 1, label: "A", group: "Not producing", color: "red" },
      { lat: 1, lon: 1, label: "B", group: "Producing" },
      { lat: 1, lon: 1, label: "C", group: "Not producing", color: "red" },
    ]);
    const { pins, legend } = styleMapPins(points, { palette: ["green"], legendTitle: "Status" });
    expect(pins.map((p) => p.color)).toEqual(["red", "green", "red"]);
    expect(legend).toEqual({ title: "Status", items: [{ label: "Not producing", color: "red" }, { label: "Producing", color: "green" }] });
  });

  it("colours pins along a ramp by value", () => {
    const points = toMapPoints([
      { lat: 1, lon: 1, label: "A", value: 0 },
      { lat: 1, lon: 1, label: "B", value: 10 },
      { lat: 1, lon: 1, label: "C", value: 5 },
    ]);
    const { pins, legend } = styleMapPins(points, { colorBy: "value", palette: ["#000000", "#ffffff"] });
    expect(pins.map((p) => p.color)).toEqual(["#000000", "#ffffff", "#808080"]);
    expect(legend?.ramp).toEqual({ colors: ["#000000", "#ffffff"], min: 0, max: 10 });
  });

  it("leaves unstyled pins to the theme", () => {
    expect(styleMapPins(toMapPoints([{ lat: 1, lon: 1, label: "A" }]), {})).toEqual({ pins: [{ radius: 8, color: undefined }] });
  });
});

describe("heatmap palette", () => {
  it("keeps the valid colours given, one or more", () => {
    expect(toPalette(["#fff5f0", "bad()", "#cb181d"])).toEqual(["#fff5f0", "#cb181d"]);
    expect(toPalette("red")).toEqual(["red"]);
    expect(toPalette([])).toBeUndefined();
  });

  it("expands two stops into a smooth ramp, so the grid isn't two-tone", () => {
    const ramp = expandRamp(["#ffffff", "#ff0000"], 5);
    expect(ramp).toEqual(["#ffffff", "#ffbfbf", "#ff8080", "#ff4040", "#ff0000"]);
  });

  it("ramps a single colour up from a pale tint of it", () => {
    const ramp = expandRamp(["#ff0000"], 3, "#ffffff");
    expect(ramp[0]).toBe("#ffebeb");
    expect(ramp[2]).toBe("#ff0000");
  });
});

describe("toPlotSpec", () => {
  it("waits until the spec has something to draw", () => {
    expect(toPlotSpec(undefined)).toBeNull();
    expect(toPlotSpec({ data: { values: [] } })).toBeNull();
  });

  it("removes every url so a plot never fetches", () => {
    const spec = toPlotSpec({
      $schema: "https://vega.github.io/schema/vega-lite/v6.json",
      data: { url: "https://evil.example/data.json" },
      layer: [{ mark: "image", data: { url: "x" }, encoding: { url: { field: "u" } } }],
    });
    expect(JSON.stringify(spec)).not.toContain("url");
    expect(JSON.stringify(spec)).not.toContain("$schema");
  });
});
