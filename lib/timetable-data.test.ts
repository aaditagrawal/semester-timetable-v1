/**
 * Behaviour parity for the schedule predicates.
 *
 * The precomputed indices in `timetable-data.ts` exist purely to make the grid
 * cheaper to draw; they are worthless if they change what the grid says. This
 * pins the new integer predicates against a verbatim copy of the string/`Date`
 * implementations they replaced, over the whole cross-product that matters:
 * every weekday (including Sunday, which has its own rule), every slot, and
 * every interesting minute around each slot boundary.
 *
 * Run with `bun test`.
 */

import { describe, expect, test } from "bun:test";
import {
  dayIndex,
  days,
  daySchedules,
  isPeriodActive,
  isPeriodPassed,
  isSlotActive,
  isSlotPassed,
  snapshotNow,
  timeSlots,
  timeToMinutes,
  weekSchedule,
  type Day,
} from "./timetable-data";

/* -------------------------------------------------------------------------- */
/* The implementations being replaced, copied verbatim from before the change  */
/* -------------------------------------------------------------------------- */

function referenceIsSlotPassed(slotEnd: string, currentTime: Date, day: Day): boolean {
  const currentDay = currentTime.getDay();
  const index = days.indexOf(day);
  const targetDayIndex = index + 1;

  if (currentDay !== targetDayIndex) {
    if (currentDay === 0) return false;
    if (currentDay > targetDayIndex) return true;
    return false;
  }

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const slotEndMinutes = timeToMinutes(slotEnd);
  return currentMinutes > slotEndMinutes;
}

function referenceIsSlotActive(
  slotStart: string,
  slotEnd: string,
  currentTime: Date,
  day: Day,
): boolean {
  const currentDay = currentTime.getDay();
  const index = days.indexOf(day);
  const targetDayIndex = index + 1;

  if (currentDay !== targetDayIndex) return false;

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  return currentMinutes >= timeToMinutes(slotStart) && currentMinutes < timeToMinutes(slotEnd);
}

/* -------------------------------------------------------------------------- */

/**
 * A week of real instants: Sunday 26 July 2026 through Saturday 1 August 2026,
 * so every `Date#getDay` value from 0 to 6 is covered by an actual date rather
 * than a synthesised one.
 */
const WEEK = Array.from({ length: 7 }, (_, offset) => new Date(2026, 6, 26 + offset));

/** Minutes worth probing: both edges of every slot, either side, plus the ends of the day. */
const PROBE_MINUTES = (() => {
  const minutes = new Set<number>([0, 1, 12 * 60, 23 * 60 + 59]);
  for (const slot of timeSlots) {
    for (const edge of [slot.startMin, slot.endMin]) {
      minutes.add(edge - 1);
      minutes.add(edge);
      minutes.add(edge + 1);
    }
  }
  return [...minutes].filter((m) => m >= 0 && m < 24 * 60).sort((a, b) => a - b);
})();

function at(base: Date, minutes: number): Date {
  const date = new Date(base);
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
}

describe("isPeriodPassed / isPeriodActive match the string predicates they replace", () => {
  test(`over ${WEEK.length} weekdays x ${PROBE_MINUTES.length} minutes x ${timeSlots.length} slots x ${days.length} days`, () => {
    let comparisons = 0;

    for (const baseDate of WEEK) {
      for (const minutes of PROBE_MINUTES) {
        const currentTime = at(baseDate, minutes);
        const now = snapshotNow(currentTime);

        for (const day of days) {
          const index = dayIndex[day];

          for (const slot of timeSlots) {
            expect(isPeriodPassed(slot.endMin, now, index)).toBe(
              referenceIsSlotPassed(slot.end, currentTime, day),
            );
            expect(isPeriodActive(slot.startMin, slot.endMin, now, index)).toBe(
              referenceIsSlotActive(slot.start, slot.end, currentTime, day),
            );
            // The kept string wrappers must agree too — labs still use them.
            expect(isSlotPassed(slot.end, currentTime, day)).toBe(
              referenceIsSlotPassed(slot.end, currentTime, day),
            );
            expect(isSlotActive(slot.start, slot.end, currentTime, day)).toBe(
              referenceIsSlotActive(slot.start, slot.end, currentTime, day),
            );
            comparisons += 4;
          }
        }
      }
    }

    // Guards against the loops silently collapsing to nothing.
    expect(comparisons).toBeGreaterThan(10_000);
  });

  test("Sunday shows the coming week rather than a fully greyed-out one", () => {
    const sunday = at(WEEK[0], 23 * 60);
    expect(sunday.getDay()).toBe(0);
    const now = snapshotNow(sunday);
    for (const day of days) {
      for (const slot of timeSlots) {
        expect(isPeriodPassed(slot.endMin, now, dayIndex[day])).toBe(false);
      }
    }
  });
});

describe("precomputed indices agree with the source data", () => {
  test("every slot's minutes match its time strings", () => {
    for (const slot of timeSlots) {
      expect(slot.startMin).toBe(timeToMinutes(slot.start));
      expect(slot.endMin).toBe(timeToMinutes(slot.end));
      expect(slot.endMin).toBeGreaterThan(slot.startMin);
    }
  });

  test("dayIndex matches the position in days", () => {
    for (const day of days) expect(dayIndex[day]).toBe(days.indexOf(day));
  });

  test("daySchedules holds exactly the non-null entries, in slot order", () => {
    let total = 0;
    for (const day of days) {
      const periods = daySchedules[day];
      const expected = Object.entries(weekSchedule[day])
        .filter(([, entry]) => entry !== null)
        .map(([index]) => Number(index))
        .sort((a, b) => a - b);

      expect(periods.map((p) => p.slotIndex)).toEqual(expected);
      for (const period of periods) {
        expect(period.entry).toBe(weekSchedule[day][period.slotIndex]!);
        expect(period.slot).toBe(timeSlots[period.slotIndex]);
      }
      total += periods.length;
    }
    // The published Sem VII grid: 18 scheduled periods, all of them electives.
    expect(total).toBe(18);
  });
});
