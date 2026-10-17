"use client";

/** Browser-only downloads of one answer: a light, paginated PDF (answer, data tables, sources) and a CSV of its data. */
import { Renderer } from "@openuidev/react-lang";
import { ThemeProvider } from "@openuidev/react-ui";
import { printLibrary } from "./app-library";
import { type AnswerData, answerCsv, exportFileName, pdfText } from "./export-data";
import { PrintModeContext } from "./print-mode";

/** Marks parts of an answer (its action bar, chart buttons) that a snapshot leaves out. */
export const EXPORT_SKIP_ATTRIBUTE = "data-export-skip";

type Rgb = [number, number, number];
const ACCENT: Rgb = [22, 118, 96];
const INK: Rgb = [20, 26, 23];
const MUTED: Rgb = [98, 108, 102];
const RULE: Rgb = [224, 230, 225];
const MARGIN = 44;
/** The offscreen answer's width in CSS pixels: about an A4 text column, so text and charts keep a readable size. */
const PRINT_WIDTH = 720;
// A blank pixel for images (map tiles) a snapshot can't fetch, so one blocked tile doesn't fail the PDF.
const BLANK_PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

/** The app's light palette, set on the offscreen copy so it prints light whatever the screen's theme. */
const LIGHT_VARS = {
  "--copilot-background": "#ffffff",
  "--copilot-surface": "#ffffff",
  "--copilot-accent": "#167660",
  "--copilot-accent-soft": "#e9f3ee",
  "--copilot-line": "#e0e6e1",
  "--copilot-muted": "#626c66",
} as const;

function save(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement("a"), { href: url, download: fileName });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadAnswerCsv(data: AnswerData) {
  // A byte-order mark so spreadsheet apps read °, · and — correctly.
  save(new Blob(["﻿", answerCsv(data)], { type: "text/csv;charset=utf-8" }), exportFileName(data.title, "csv"));
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Waits until plots have drawn and map tiles have loaded, or the time runs out. */
async function settle(root: HTMLElement, plots: number, timeoutMs = 6000) {
  const deadline = Date.now() + timeoutMs;
  await sleep(400);
  while (Date.now() < deadline) {
    const drawn = root.querySelectorAll(".copilot-plot svg").length >= plots;
    const tiles = [...root.querySelectorAll<HTMLImageElement>(".leaflet-tile-pane img")];
    const tilesLoaded = tiles.every((img) => img.complete);
    if (drawn && tilesLoaded) break;
    await sleep(150);
  }
  await sleep(250);
}

/** Renders the answer offscreen in the light theme with the print library, and returns its element and a cleanup. */
async function renderForPrint(content: string): Promise<{ element: HTMLElement; dispose: () => void }> {
  const { createRoot } = await import("react-dom/client");
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.className = "copilot-print";
  Object.assign(host.style, { position: "fixed", left: "-10000px", top: "0", width: `${PRINT_WIDTH}px`, background: "#ffffff", color: "#141a17" });
  for (const [name, value] of Object.entries(LIGHT_VARS)) host.style.setProperty(name, value);
  document.body.append(host);
  const root = createRoot(host);
  root.render(
    <PrintModeContext.Provider value={true}>
      <ThemeProvider
        mode="light"
        lightTheme={{ background: "#ffffff", foreground: "#ffffff", textBrand: "#167660", invertedBackground: "#167660" }}
      >
        <div className="copilot-print-answer">
          <Renderer response={content} library={printLibrary} isStreaming={false} />
        </div>
      </ThemeProvider>
    </PrintModeContext.Provider>,
  );
  await settle(host, (content.match(/\bPlot\(/g) ?? []).length);
  return {
    element: host.querySelector<HTMLElement>(".copilot-print-answer") ?? host,
    dispose: () => {
      root.unmount();
      host.remove();
    },
  };
}

export interface AnswerPdfInput {
  /** The answer's OpenUI Lang. */
  content: string;
  data: AnswerData;
  question?: string;
  /** Lines under the title, e.g. who asked, the model and when. */
  meta: string[];
}

export async function downloadAnswerPdf({ content, data, question, meta }: AnswerPdfInput) {
  const [{ jsPDF }, { default: autoTable }, { toPng }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
    import("html-to-image"),
  ]);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const inner = width - MARGIN * 2;
  const bottom = height - MARGIN - 14;
  let y = MARGIN;

  const newPage = () => {
    doc.addPage();
    y = MARGIN;
  };
  const write = (text: string, size: number, style: "normal" | "bold", color: Rgb, gap = 4) => {
    doc.setFont("helvetica", style).setFontSize(size).setTextColor(...color);
    for (const line of doc.splitTextToSize(pdfText(text), inner) as string[]) {
      if (y + size + gap > bottom) newPage();
      doc.text(line, MARGIN, y + size);
      y += size + gap;
    }
  };
  const rule = (gapAfter = 14) => {
    doc.setDrawColor(...RULE).setLineWidth(0.75).line(MARGIN, y, width - MARGIN, y);
    y += gapAfter;
  };

  // Title block.
  doc.setFillColor(...ACCENT).rect(0, 0, width, 6, "F");
  write("ASSET INTELLIGENCE COPILOT", 7.5, "bold", ACCENT, 8);
  write(data.title ?? question ?? "Copilot answer", 18, "bold", INK, 5);
  if (data.subtitle) write(data.subtitle, 10.5, "normal", MUTED, 4);
  y += 6;
  if (question && question !== data.title) write(`Question: ${question}`, 9.5, "normal", INK, 3);
  for (const line of meta) write(line, 8, "normal", MUTED, 3);
  y += 6;
  rule();

  // The answer, drawn light and placed block by block so pages break between blocks, not through lines.
  const { element, dispose } = await renderForPrint(content);
  try {
    const scale = inner / PRINT_WIDTH;
    const fullPage = (bottom - MARGIN) / scale;
    const snapshot = (el: HTMLElement) =>
      toPng(el, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        imagePlaceholder: BLANK_PIXEL,
        filter: (node) => !(node instanceof HTMLElement && node.hasAttribute(EXPORT_SKIP_ATTRIBUTE)),
      });
    const place = async (el: HTMLElement): Promise<void> => {
      const box = el.getBoundingClientRect();
      if (box.height < 1 || box.width < 1) return;
      const h = box.height * scale;
      const children = [...el.children].filter((c): c is HTMLElement => c instanceof HTMLElement);
      // Too tall for what is left of the page: a big block with parts is split into them; anything else moves to the next page.
      if (y + h > bottom && children.length > 0 && (box.height > fullPage || h > (bottom - MARGIN) * 0.35)) {
        for (const child of children) await place(child);
        return;
      }
      if (y + h > bottom && y > MARGIN) newPage();
      // One indivisible block taller than a page (rare: a very tall chart) is shrunk to fit it.
      const fit = Math.min(1, (bottom - y) / h);
      const left = MARGIN + (box.left - element.getBoundingClientRect().left) * scale;
      doc.addImage(await snapshot(el), "PNG", left, y, box.width * scale * fit, h * fit);
      y += h * fit + 6;
    };
    await place(element);
  } finally {
    dispose();
  }

  const table = (title: string, head: string[], body: (string | number)[][]) => {
    if (y + 70 > bottom) newPage();
    write(title, 10.5, "bold", INK, 6);
    autoTable(doc, {
      startY: y,
      head: [head.map(pdfText)],
      body: body.map((row) => row.map(pdfText)),
      margin: { left: MARGIN, right: MARGIN, bottom: height - bottom },
      theme: "plain",
      styles: { font: "helvetica", fontSize: 8, cellPadding: { top: 4, bottom: 4, left: 6, right: 6 }, textColor: INK, overflow: "linebreak" },
      headStyles: { fillColor: [233, 243, 238], textColor: ACCENT, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 248] },
      bodyStyles: { lineColor: RULE, lineWidth: { bottom: 0.5 } },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
  };

  if (data.tables.length) {
    y += 8;
    if (y + 90 > bottom) newPage();
    rule(16);
    write("Data", 14, "bold", ACCENT, 4);
    write("The values behind this answer's tables, charts and maps.", 8.5, "normal", MUTED, 12);
    for (const t of data.tables) table(t.title, t.columns, t.rows);
  }
  if (data.sources.length) {
    if (y + 90 > bottom) newPage();
    rule(16);
    write("Sources", 14, "bold", ACCENT, 10);
    table("Records and documents cited", ["Kind", "Reference", "Supports"], data.sources.map((s) => [s.kind.replace("_", " "), s.reference, s.label]));
  }

  const pages = doc.getNumberOfPages();
  const stamp = new Date().toLocaleDateString("en-GB", { dateStyle: "medium" });
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page).setFont("helvetica", "normal").setFontSize(7).setTextColor(...MUTED);
    doc.text(`Asset Intelligence Copilot · ${stamp}`, MARGIN, height - 22);
    doc.text(`Page ${page} of ${pages}`, width - MARGIN, height - 22, { align: "right" });
  }
  doc.save(exportFileName(data.title ?? question, "pdf"));
}
