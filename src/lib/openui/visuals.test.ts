import { describe, expect, it } from "vitest";
import { toHeatmapData, toMapPoints } from "./visuals";

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
