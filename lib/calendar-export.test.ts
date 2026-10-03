import { expect, test } from "bun:test";
import { electiveGroups } from "./timetable-data";
import { generateICS } from "./calendar-export";

test("a one-day export contains no classes after its end date", () => {
  for (const includeRecurrence of [false, true]) {
    const result = generateICS(
      Object.fromEntries(electiveGroups.map((group) => [group.type, group.options[0].id])),
      [],
      {
        semesterStartDate: new Date(2026, 9, 5),
        semesterEndDate: new Date(2026, 9, 5),
        includeRecurrence,
      },
    );
    const starts = [...result.matchAll(/DTSTART;TZID=Asia\/Kolkata:(\d{8})/g)].map(
      (match) => match[1],
    );
    expect(starts.length).toBeGreaterThan(0);
    expect(starts.every((date) => date === "20261005")).toBe(true);
  }
});
test("reversed and invalid calendar ranges are rejected", () => {
  for (const semesterStartDate of [new Date(2026, 9, 6), new Date(NaN)]) {
    expect(() =>
      generateICS({}, [], {
        semesterStartDate,
        semesterEndDate: new Date(2026, 9, 5),
        includeRecurrence: true,
      }),
    ).toThrow(RangeError);
  }
});
