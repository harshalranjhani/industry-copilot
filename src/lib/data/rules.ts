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

/**
 * Parses the spill class volume bounds (the lower bound of Moderate,
 * Reportable and Major) from the table in the SOP's "Spill classes" section.
 * Fails naming the SOP when no SOP states them.
 */
export function parseSopRules(sops: Sop[]): Rule[] {
  for (const sop of sops) {
    const section = sections(sop.text).find((s) => /^#{2,3} \d+(?:\.\d+)?\.? Spill classes/im.test(s.text));
    if (!section) continue;
    const rules: Rule[] = [];
    for (const { cls, key } of SPILL_CLASS_BOUNDS) {
      const value = toNumber(new RegExp(`^\\|\\s*${cls}\\s*\\|\\s*(\\d+(?:\\.\\d+)?)\\s*bbl`, "im").exec(section.text)?.[1]);
      if (value === undefined) throw new Error(`Spill class bound "${key}" not found in ${sop.documentId}`);
      rules.push({ wellType: FLEET_WIDE, key, value, unit: "bbl", document: sop.documentId, section: section.number });
    }
    return rules;
  }
  const names = sops.map((s) => s.documentId).join(", ") || "no SOP";
  throw new Error(`Spill class bounds not found: no SOP has a "Spill classes" section (looked in ${names}; the spill class table is expected in SOP-SR)`);
}
