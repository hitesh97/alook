import { describe, it, expect } from "vitest";
import {
  parseRepeatInterval,
  formatRepeatInterval,
  unitLabel,
  formatRepeatDisplay,
  isValidUnit,
} from "./repeat-interval-utils";

describe("parseRepeatInterval", () => {
  it("parses valid intervals", () => {
    expect(parseRepeatInterval("1day")).toEqual({ count: 1, unit: "day" });
    expect(parseRepeatInterval("30min")).toEqual({ count: 30, unit: "min" });
    expect(parseRepeatInterval("2week")).toEqual({ count: 2, unit: "week" });
    expect(parseRepeatInterval("12month")).toEqual({ count: 12, unit: "month" });
    expect(parseRepeatInterval("24hour")).toEqual({ count: 24, unit: "hour" });
  });

  it("returns null for invalid inputs", () => {
    expect(parseRepeatInterval("")).toBeNull();
    expect(parseRepeatInterval("weekly")).toBeNull();
    expect(parseRepeatInterval("1year")).toBeNull();
    expect(parseRepeatInterval("0day")).toBeNull();
    expect(parseRepeatInterval("day")).toBeNull();
    expect(parseRepeatInterval("1 day")).toBeNull();
  });
});

describe("formatRepeatInterval", () => {
  it("composes count and unit", () => {
    expect(formatRepeatInterval(1, "day")).toBe("1day");
    expect(formatRepeatInterval(30, "min")).toBe("30min");
    expect(formatRepeatInterval(12, "month")).toBe("12month");
  });

  it("round-trips with parse", () => {
    for (const raw of ["1day", "2week", "30min", "12month", "24hour"]) {
      const parsed = parseRepeatInterval(raw)!;
      expect(formatRepeatInterval(parsed.count, parsed.unit)).toBe(raw);
    }
  });
});

describe("unitLabel", () => {
  it("returns singular for count=1", () => {
    expect(unitLabel("day", 1)).toBe("day");
    expect(unitLabel("min", 1)).toBe("minute");
    expect(unitLabel("hour", 1)).toBe("hour");
    expect(unitLabel("week", 1)).toBe("week");
    expect(unitLabel("month", 1)).toBe("month");
  });

  it("returns plural for count>1", () => {
    expect(unitLabel("day", 3)).toBe("days");
    expect(unitLabel("min", 30)).toBe("minutes");
    expect(unitLabel("hour", 24)).toBe("hours");
    expect(unitLabel("week", 2)).toBe("weeks");
    expect(unitLabel("month", 12)).toBe("months");
  });
});

describe("formatRepeatDisplay", () => {
  it("formats count=1 without number", () => {
    expect(formatRepeatDisplay("1day")).toBe("Every day");
    expect(formatRepeatDisplay("1hour")).toBe("Every hour");
    expect(formatRepeatDisplay("1week")).toBe("Every week");
    expect(formatRepeatDisplay("1month")).toBe("Every month");
    expect(formatRepeatDisplay("1min")).toBe("Every minute");
  });

  it("formats count>1 with number and plural", () => {
    expect(formatRepeatDisplay("2week")).toBe("Every 2 weeks");
    expect(formatRepeatDisplay("30min")).toBe("Every 30 minutes");
    expect(formatRepeatDisplay("12month")).toBe("Every 12 months");
  });

  it("returns raw string for unparseable input", () => {
    expect(formatRepeatDisplay("weekly")).toBe("weekly");
    expect(formatRepeatDisplay("")).toBe("");
  });
});

describe("isValidUnit", () => {
  it("accepts valid units", () => {
    expect(isValidUnit("min")).toBe(true);
    expect(isValidUnit("hour")).toBe(true);
    expect(isValidUnit("day")).toBe(true);
    expect(isValidUnit("week")).toBe(true);
    expect(isValidUnit("month")).toBe(true);
  });

  it("rejects invalid units", () => {
    expect(isValidUnit("year")).toBe(false);
    expect(isValidUnit("")).toBe(false);
    expect(isValidUnit("days")).toBe(false);
  });
});
