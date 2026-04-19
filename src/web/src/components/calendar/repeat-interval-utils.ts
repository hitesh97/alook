export type RepeatUnit = "min" | "hour" | "day" | "week" | "month";

export interface ParsedInterval {
  count: number;
  unit: RepeatUnit;
}

const INTERVAL_RE = /^(\d+)(min|hour|day|week|month)$/;

export function parseRepeatInterval(raw: string): ParsedInterval | null {
  const m = INTERVAL_RE.exec(raw);
  if (!m) return null;
  const count = parseInt(m[1]!, 10);
  if (count < 1) return null;
  return { count, unit: m[2]! as RepeatUnit };
}

export function formatRepeatInterval(count: number, unit: RepeatUnit): string {
  return `${count}${unit}`;
}

const UNIT_LABELS: Record<RepeatUnit, [string, string]> = {
  min: ["minute", "minutes"],
  hour: ["hour", "hours"],
  day: ["day", "days"],
  week: ["week", "weeks"],
  month: ["month", "months"],
};

export function unitLabel(unit: RepeatUnit, count: number): string {
  return count === 1 ? UNIT_LABELS[unit][0] : UNIT_LABELS[unit][1];
}

export function formatRepeatDisplay(raw: string): string {
  const parsed = parseRepeatInterval(raw);
  if (!parsed) return raw;
  const { count, unit } = parsed;
  if (count === 1) return `Every ${UNIT_LABELS[unit][0]}`;
  return `Every ${count} ${UNIT_LABELS[unit][1]}`;
}

const VALID_UNITS: Set<string> = new Set([
  "min",
  "hour",
  "day",
  "week",
  "month",
]);

export function isValidUnit(s: string): s is RepeatUnit {
  return VALID_UNITS.has(s);
}

export const REPEAT_UNITS: RepeatUnit[] = [
  "min",
  "hour",
  "day",
  "week",
  "month",
];

export const PRESET_INTERVALS = [
  { value: "1hour", label: "Every hour" },
  { value: "1day", label: "Every day" },
  { value: "1week", label: "Every week" },
  { value: "1month", label: "Every month" },
] as const;
