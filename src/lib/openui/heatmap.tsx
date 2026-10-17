"use client";

import { useMemo } from "react";
import { HeatmapChart, type HeatmapChartData } from "@openuidev/react-ui";
import { useDarkTheme } from "./print-mode";
import { type HeatmapInput, expandRamp, toHeatmapData, toPalette } from "./visuals";

let probe: CanvasRenderingContext2D | null | undefined;

/** Any CSS colour as #rrggbb, using the browser's own parser ("red" → "#ff0000"). */
function toHex(color: string): string {
  probe ??= document.createElement("canvas").getContext("2d");
  if (!probe) return color;
  probe.fillStyle = "#000000";
  probe.fillStyle = color;
  return probe.fillStyle;
}

/** OpenUI's heatmap primitive, fed from the model's rows, columns and value matrix. */
export function HeatmapView(props: HeatmapInput & { palette?: unknown; diverging?: unknown }) {
  const { rows, columns, values, rowTotals, columnTotals, palette: rawPalette, diverging } = props;
  const dark = useDarkTheme();
  const palette = useMemo(() => {
    const colors = toPalette(rawPalette);
    if (!colors) return undefined;
    return expandRamp(colors.map(toHex), undefined, dark ? "#1d2420" : "#f7f7f7");
  }, [rawPalette, dark]);
  const heatmap = useMemo(
    () => toHeatmapData({ rows, columns, values, rowTotals, columnTotals }),
    [rows, columns, values, rowTotals, columnTotals],
  );
  if (!heatmap) return null;
  const rowCount = Object.keys(heatmap.data[0]).length - 1;
  return (
    <HeatmapChart
      // Missing cells are undefined; the chart renders those as muted "no value" cells.
      data={heatmap.data as HeatmapChartData}
      categoryKey={heatmap.categoryKey}
      showCellLabels
      customPalette={palette}
      rampMode={diverging === true ? "diverging" : "sequential"}
      legend={false}
      height={Math.max(160, rowCount * 36 + 90)}
    />
  );
}
