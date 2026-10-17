import { createParser } from "@openuidev/react-lang";
import { compile } from "vega-lite";
import { describe, expect, it } from "vitest";
import { promptLibrary } from "./library";
import { copilotPromptOptions } from "./prompt-options";
import { toPlotSpec } from "./visuals";

describe("the prompt's Plot example", () => {
  it("parses as OpenUI Lang and compiles as Vega-Lite", () => {
    const example = copilotPromptOptions.examples!.find((e) => e.includes("Plot("))!;
    const program = example.slice(example.indexOf("root ="));
    const parsed = createParser(promptLibrary.toJSONSchema(), promptLibrary.root).parse(program);
    expect(parsed.meta.errors).toEqual([]);
    const plot = (function find(n: any): any {
      if (n && typeof n === "object") {
        if (n.typeName === "Plot") return n;
        for (const v of Object.values(n)) {
          const hit = find(v);
          if (hit) return hit;
        }
      }
    })(parsed.root);
    expect(plot).toBeDefined();
    const spec = toPlotSpec(plot.props.spec);
    expect(spec).not.toBeNull();
    expect(() => compile(spec as never)).not.toThrow();
  });
});

describe("colours on the fixed charts", () => {
  const parse = (program: string) => createParser(promptLibrary.toJSONSchema(), promptLibrary.root).parse(program);

  it("parse with null placeholders before the colors argument", () => {
    const parsed = parse(`root = Stack([c])
c = BarChart(["a", "b"], [Series("Spills", [1, 2])], null, null, null, null, ["red"])`);
    expect(parsed.meta.errors).toEqual([]);
    expect(JSON.stringify(parsed.root)).toContain('"colors":["red"]');
  });

  it("hand the colours to the chart as its palette", () => {
    const BarChart = promptLibrary.components.BarChart!;
    const element = BarChart.component({
      props: { labels: ["a"], series: [{ props: { category: "Spills", values: [1] } }], variant: null, colors: ["red", "url(x)"] },
    } as never) as { props: { customPalette?: string[]; variant?: unknown } };
    expect(element.props.customPalette).toEqual(["red"]);
    expect(element.props.variant).toBeUndefined();
  });
});
