"use client";

import { useMemo } from "react";
import { HeatmapChart, type HeatmapChartData } from "@openuidev/react-ui";
import { type HeatmapInput, toHeatmapData } from "./visuals";

/** OpenUI's heatmap primitive, fed from the model's rows, columns and value matrix. */
export function HeatmapView(props: HeatmapInput) {
  const { rows, columns, values, rowTotals, columnTotals } = props;
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
      legend={false}
      height={Math.max(160, rowCount * 36 + 90)}
    />
  );
}
