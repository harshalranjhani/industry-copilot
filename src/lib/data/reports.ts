export interface ComplianceCheck {
  /** e.g. SR-02, or a free label such as "HSE notice" or "Manual §10". */
  protocol: string;
  /** e.g. Met, Not met, In progress, Action required. */
  result: string;
  detail: string;
}

export interface ReportFacts {
  /** Hours from discovery to containment ("contained about 7 hours after…"), or null. */
  containmentHours: number | null;
  /** The spill class the report states ("(moderate class)"), or null. */
  statedClass: string | null;
  /** Every row of the report's "Compliance check" table, in order. */
  checks: ComplianceCheck[];
}

const unbold = (cell: string) => cell.replaceAll("*", "").trim();

/** Extracts the facts that exist only in a repair report's free text. */
export function parseReport(text: string): ReportFacts {
  const containment = /contained\s+about\s+(\d+(?:\.\d+)?)\s*hours/i.exec(text)?.[1];
  const statedClass =
    /\((minor|moderate|reportable|major) class\)/i.exec(text)?.[1] ??
    /\bis an? (minor|moderate|reportable|major) spill/i.exec(text)?.[1];

  const checks: ComplianceCheck[] = [];
  const section = /^#{2,3} Compliance check\s*$([\s\S]*?)(?=^#{1,3} |(?![\s\S]))/im.exec(text)?.[1] ?? "";
  for (const line of section.split("\n")) {
    const cells = line.trim().replace(/^\||\|$/g, "").split("|").map(unbold);
    if (!line.trim().startsWith("|") || cells.length < 3) continue;
    const [protocol, result, ...rest] = cells;
    if (protocol === "Protocol" || /^-+$/.test(protocol!)) continue;
    checks.push({ protocol: protocol!, result: result!, detail: rest.join(" | ") });
  }

  return {
    containmentHours: containment === undefined ? null : Number(containment),
    statedClass: statedClass?.toLowerCase() ?? null,
    checks,
  };
}
