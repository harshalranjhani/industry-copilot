"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useIsStreaming } from "@openuidev/react-lang";
import type { View } from "vega";
import { useDarkTheme } from "./print-mode";
import { toPlotSpec } from "./visuals";

/** The app's look for every plot; a spec's own config still wins. */
function themeConfig(dark: boolean) {
  const text = dark ? "#d7dfda" : "#2b322e";
  const grid = dark ? "#303a34" : "#e0e6e1";
  return {
    background: "transparent",
    font: "inherit",
    view: { stroke: null },
    axis: { labelColor: text, titleColor: text, gridColor: grid, domainColor: grid, tickColor: grid },
    legend: { labelColor: text, titleColor: text },
    title: { color: text, anchor: "start" as const, fontSize: 14 },
    header: { labelColor: text, titleColor: text },
    range: { category: ["#2a9d8f", "#e76f51", "#457b9d", "#e9c46a", "#8e6cc9", "#6a994e", "#d1495b", "#00a6d6"] },
  };
}

/**
 * A Vega-Lite chart drawn from the model's spec, for anything the fixed charts
 * can't do (chosen colours, orientation, layers, reference lines, dual axes…).
 * The spec only gets inline data: url fields are stripped and the loader refuses every fetch.
 */
export function PlotView({ spec: raw, height }: { spec?: unknown; height?: unknown }) {
  const spec = useMemo(() => toPlotSpec(raw), [raw]);
  const key = useMemo(() => (spec ? JSON.stringify(spec) : ""), [spec]);
  const streaming = useIsStreaming();
  const dark = useDarkTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const viewRef = useRef<View | null>(null);

  useEffect(() => {
    if (!spec || !containerRef.current) return;
    let cancelled = false;
    let finalize: (() => void) | undefined;
    // Wait for the spec to settle: during streaming it changes on every chunk.
    const timer = setTimeout(async () => {
      const [{ default: embed }, vega] = await Promise.all([import("vega-embed"), import("vega")]);
      if (cancelled || !containerRef.current) return;
      const refuse = async () => {
        throw new Error("Plots only use inline data");
      };
      const loader = { ...vega.loader(), load: refuse, sanitize: refuse, http: refuse, file: refuse };
      try {
        const result = await embed(
          containerRef.current,
          {
            width: "container",
            ...(typeof height === "number" && height > 80 && height < 1200 ? { height } : {}),
            ...spec,
            config: { ...themeConfig(dark), ...((spec.config as object) ?? {}) },
          } as never,
          { actions: false, renderer: "svg", loader: loader as never, tooltip: true },
        );
        if (cancelled) result.finalize();
        else {
          viewRef.current = result.view;
          finalize = () => {
            viewRef.current = null;
            result.finalize();
          };
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      finalize?.();
    };
    // `key` stands for the spec's content, so a re-parse with the same spec doesn't redraw.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, height, dark]);

  const title = typeof spec?.title === "string" ? spec.title : "chart";
  const download = async (type: "png" | "svg") => {
    const view = viewRef.current;
    if (!view) return;
    // The chart is drawn on a transparent background; a downloaded file gets the page's, so its text stays readable.
    const previous = view.background();
    view.background(getComputedStyle(document.body).backgroundColor || "#ffffff");
    const url = await view.runAsync().then(() => view.toImageURL(type, type === "png" ? 2 : 1));
    await view.background(previous).runAsync();
    const name = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "chart";
    Object.assign(document.createElement("a"), { href: url, download: `${name}.${type}` }).click();
  };

  if (!spec) return streaming ? <div className="copilot-plot copilot-plot-pending">Drawing chart…</div> : null;
  return (
    <figure className="copilot-plot" aria-label={title}>
      {!streaming && !error && (
        <div className="copilot-plot-tools" data-export-skip="">
          <button type="button" onClick={() => void download("png")} title="Download this chart as PNG">
            PNG
          </button>
          <button type="button" onClick={() => void download("svg")} title="Download this chart as SVG">
            SVG
          </button>
        </div>
      )}
      <div ref={containerRef} style={{ width: "100%" }} />
      {error && !streaming && <figcaption className="copilot-plot-error">This chart could not be drawn: {error}</figcaption>}
    </figure>
  );
}
