export interface Rule {
  wellType: string;
  key: string;
  value: number;
  unit: string;
  /** The document that states the rule (the inherited-from manual when deferred). */
  document: string;
  section: string;
}

/** Well type of a rule that applies fleet-wide, such as the spill class bounds in the Spill Response SOP. */
export const FLEET_WIDE = "*";

export interface Sop {
  documentId: string;
  text: string;
}

export interface Manual {
  wellType: string;
  documentId: string;
  text: string;
}

interface Section {
  number: string;
  text: string;
}

/** Splits a manual into its numbered `##` / `###` sections. */
function sections(text: string): Section[] {
  const found: Section[] = [];
  for (const part of text.split(/^(?=#{2,3} )/m)) {
    const heading = /^#{2,3} (\d+(?:\.\d+)?)\.? /.exec(part);
    if (heading) found.push({ number: heading[1]!, text: part });
  }
  return found;
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

function toNumber(word: string | undefined): number | undefined {
  if (word === undefined) return undefined;
  const value = NUMBER_WORDS[word.toLowerCase()] ?? Number(word);
  return Number.isFinite(value) ? value : undefined;
}

interface RuleDefinition {
  key: string;
  unit: string;
  /** Picks the section of a manual that is about this rule. */
  topic: RegExp;
  /** Reads the value out of that section, or undefined. */
  extract: (sectionText: string) => number | undefined;
}

const RULE_DEFINITIONS: RuleDefinition[] = [
  {
    key: "producing_threshold_c",
    unit: "°C above ambient",
    topic: /°C\s+above\s+\**ambient/i,
    extract: (text) => toNumber(/at least\s+\**(\d+(?:\.\d+)?)\s*°C\s+above\s+\**ambient/i.exec(text)?.[1]),
  },
  {
    key: "temperature_alarm_c",
    unit: "°C",
    topic: /^#{2,3} .*temperature alarm/im,
    extract: (text) => toNumber(/at or below\s+\**(\d+(?:\.\d+)?)\s*°C/i.exec(text)?.[1]),
  },
  {
    key: "spill_shut_in_pct",
    unit: "% of pad area",
    topic: /\d+(?:\.\d+)?\s*%\s*of\s+the\s+pad\s+area/i,
    extract: (text) => toNumber(/(\d+(?:\.\d+)?)\s*%\s*of\s+the\s+pad\s+area/i.exec(text)?.[1]),
  },
  {
    key: "rca_corrective_count",
    unit: "corrective repairs",
    topic: /\bRCA\b|root-cause/i,
    extract: (text) => {
      const match = /(\w+)\s+or\s+more\s+\**corrective|RCA after\s+(\w+)\s+corrective/i.exec(text);
      return toNumber(match?.[1] ?? match?.[2]);
    },
  },
  {
    key: "rca_window_months",
    unit: "months",
    topic: /\bRCA\b|root-cause/i,
    extract: (text) => toNumber(/(\d+)\s+months/i.exec(text)?.[1]),
  },
  {
    key: "escalation_days",
    unit: "consecutive days",
    topic: /consecutive days/i,
    extract: (text) => toNumber(/(?:more than|over)\s+(\d+)\s+consecutive days/i.exec(text)?.[1]),
  },
];

/** "Same as T200 ..." / "follow the T200 manual": the manual a passage defers to. */
const DEFERRAL = /\b(?:same as|follows?)\s+(?:the\s+)?(T\d+)\b/i;

/**
 * Parses each manual's rules. A section that defers to another well type's
 * manual ("Same as T200 section 10") takes the rule from there, as does a rule
 * the manual never states when the manual says it follows another. A required
 * rule that can't be found fails with a message naming the document.
 */
export function parseRules(manuals: Manual[]): Rule[] {
  const byType = new Map(manuals.map((m) => [m.wellType, m]));

  const resolve = (manual: Manual, definition: RuleDefinition, seen: Set<string>): Rule | undefined => {
    seen.add(manual.wellType);
    const deferTo = (text: string) => {
      const type = DEFERRAL.exec(text)?.[1]?.toUpperCase();
      const target = type ? byType.get(type) : undefined;
      return target && !seen.has(target.wellType) ? target : undefined;
    };

    const section = sections(manual.text).find((s) => definition.topic.test(s.text));
    if (section) {
      const target = deferTo(section.text);
      if (target) return resolve(target, definition, seen);
      const value = definition.extract(section.text);
      if (value !== undefined) {
        return {
          wellType: manual.wellType,
          key: definition.key,
          value,
          unit: definition.unit,
          document: manual.documentId,
          section: section.number,
        };
      }
    }
    const target = deferTo(manual.text);
    return target ? resolve(target, definition, seen) : undefined;
  };

  return manuals.flatMap((manual) =>
    RULE_DEFINITIONS.map((definition) => {
      const rule = resolve(manual, definition, new Set());
      if (!rule) {
        throw new Error(
          `Required rule "${definition.key}" not found in ${manual.documentId} (well type ${manual.wellType})`,
        );
      }
      return { ...rule, wellType: manual.wellType };
    }),
  );
}

const SPILL_CLASS_BOUNDS = [
  { cls: "Moderate", key: "spill_class_moderate_min_bbl" },
  { cls: "Reportable", key: "spill_class_reportable_min_bbl" },
  { cls: "Major", key: "spill_class_major_min_bbl" },
] as const;

interface ProtocolRuleDefinition {
  /** The protocol whose row in an SOP's protocol table states the rule, e.g. SR-01. */
  protocol: string;
  key: string;
  unit: string;
  /** Reads the value out of the protocol's requirement text (bold markers removed), or undefined. */
  extract: (requirement: string) => number | undefined;
}

const PROTOCOL_RULE_DEFINITIONS: ProtocolRuleDefinition[] = [
  {
    protocol: "SR-01",
    key: "sr01_notice_hours",
    unit: "hours from discovery to the written notice",
    extract: (text) => toNumber(/within\s+(\d+)\s*hours\s+of\s+discovery/i.exec(text)?.[1]),
  },
  {
    protocol: "SR-01",
    key: "sr01_major_notice_hours",
    unit: "hours from discovery to the written notice (major spill)",
    extract: (text) => toNumber(/within\s+(\d+)\s*hours\s+for\s+a\s+major/i.exec(text)?.[1]),
  },
  {
    protocol: "SR-02",
    key: "sr02_containment_hours",
    unit: "hours from discovery to containment",
    extract: (text) => toNumber(/within\s+(\d+(?:\.\d+)?)\s*hours/i.exec(text)?.[1]),
  },
  {
    protocol: "SR-03",
    key: "sr03_verification_days",
    unit: "days from discovery to agency verification",
    extract: (text) => toNumber(/verified\s+within\s+(\d+)\s*days/i.exec(text)?.[1]),
  },
  {
    protocol: "RC-01",
    key: "rc01_inspection_interval_days",
    unit: "days between inspections at most",
    extract: (text) => toNumber(/once\s+every\s+(\d+)\s*days/i.exec(text)?.[1]),
  },
  {
    protocol: "RC-02",
    key: "rc02_flowline_tests_per_year",
    unit: "flowline integrity tests per calendar year",
    extract: (text) => {
      const match = /\b(once|twice|\w+\s+times)\s+per\s+calendar\s+year/i.exec(text)?.[1]?.toLowerCase();
      if (match === "once") return 1;
      if (match === "twice") return 2;
      return toNumber(match?.replace(/\s+times$/, ""));
    },
  },
  {
    protocol: "RC-04",
    key: "rc04_response_days",
    unit: "days from the notice of violation to the response",
    extract: (text) => toNumber(/within\s+(\d+)\s*days/i.exec(text)?.[1]),
  },
];

/** The requirement text of a protocol's row (`| **SR-01** | ... |`), with its section, or undefined. */
function protocolRow(sop: Sop, protocol: string): { requirement: string; section: string } | undefined {
  const row = new RegExp(`^\\|\\s*\\**${protocol}\\**\\s*\\|\\s*([^|]+)\\|`, "m");
  for (const section of sections(sop.text)) {
    const match = row.exec(section.text);
    if (match) return { requirement: match[1]!.replaceAll("*", ""), section: section.number };
  }
  return undefined;
}

/**
 * Parses the SOPs' fleet-wide rules: the spill class volume bounds (the lower
 * bound of Moderate, Reportable and Major) from the "Spill classes" table, and
 * the protocol deadlines and limits (SR-01, SR-02, SR-03, RC-01, RC-02, RC-04)
 * from the protocol tables. Fails naming the SOP when a rule can't be found.
 */
export function parseSopRules(sops: Sop[]): Rule[] {
  const rules: Rule[] = [];
  const classes = sops
    .map((sop) => ({ sop, section: sections(sop.text).find((s) => /^#{2,3} \d+(?:\.\d+)?\.? Spill classes/im.test(s.text)) }))
    .find(({ section }) => section !== undefined);
  if (!classes) {
    const names = sops.map((s) => s.documentId).join(", ") || "no SOP";
    throw new Error(`Spill class bounds not found: no SOP has a "Spill classes" section (looked in ${names}; the spill class table is expected in SOP-SR)`);
  }
  const { sop: classSop, section } = classes as { sop: Sop; section: Section };
  for (const { cls, key } of SPILL_CLASS_BOUNDS) {
    const value = toNumber(new RegExp(`^\\|\\s*${cls}\\s*\\|\\s*(\\d+(?:\\.\\d+)?)\\s*bbl`, "im").exec(section.text)?.[1]);
    if (value === undefined) throw new Error(`Spill class bound "${key}" not found in ${classSop.documentId}`);
    rules.push({ wellType: FLEET_WIDE, key, value, unit: "bbl", document: classSop.documentId, section: section.number });
  }

  for (const definition of PROTOCOL_RULE_DEFINITIONS) {
    const found = sops
      .map((sop) => ({ sop, row: protocolRow(sop, definition.protocol) }))
      .find(({ row }) => row !== undefined);
    const value = found ? definition.extract(found.row!.requirement) : undefined;
    if (!found || value === undefined) {
      // SR-xx protocols live in SOP-SR, RC-xx in SOP-RC.
      const expected = found?.sop.documentId ?? `SOP-${definition.protocol.split("-")[0]}`;
      throw new Error(`Required rule "${definition.key}" (protocol ${definition.protocol}) not found in ${expected}`);
    }
    rules.push({
      wellType: FLEET_WIDE,
      key: definition.key,
      value,
      unit: definition.unit,
      document: found.sop.documentId,
      section: `${found.row!.section} ${definition.protocol}`,
    });
  }
  return rules;
}
