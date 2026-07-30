/**
 * One render's worth of grid work.
 *
 * The week view walks 6 days x 9 slots = 54 cells, and for each one resolves the
 * selected elective and asks whether the slot is active or already passed. Under
 * the old 1 Hz clock this ran once a second, forever, on a phone.
 *
 * Two independent things make that cheaper, and they land in different commits,
 * so this measures them separately. An earlier version of this file did not: its
 * "before" case used the old resolver while its "after" case used an index that
 * did not exist yet, which credited this commit with the next one's win.
 *
 *   before        verbatim pre-change predicates + the linear-scan resolver
 *   predicates    integer predicates + daySchedules, resolver held fixed
 *   full stack    both, which is what the app runs today
 */

import { bench } from "./harness";
import {
  days,
  dayIndex,
  timeSlots,
  weekSchedule,
  daySchedules,
  electiveGroups,
  isPeriodActive,
  isPeriodPassed,
  snapshotNow,
  type Day,
  type ElectiveOption,
  type ElectiveType,
} from "../lib/timetable-data";

const SELECTIONS: Partial<Record<ElectiveType, string>> = {
  "PE-3": "ict-4403-e",
  "PE-4": electiveGroups[1].options[0].id,
  "PE-5": electiveGroups[2].options[0].id,
  "PE-6": electiveGroups[3].options[0].id,
  "PE-7": electiveGroups[4].options[0].id,
  OE: electiveGroups[5].options[0].id,
};

const NOW = new Date(2026, 7, 25, 11, 45); // a Tuesday, mid-morning

/* -------------------------------------------------------------------------- */
/* The predicates being replaced, copied verbatim from before the change      */
/* -------------------------------------------------------------------------- */

function beforeTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function beforeIsSlotPassed(slotEnd: string, currentTime: Date, day: Day): boolean {
  const currentDay = currentTime.getDay();
  const targetDayIndex = days.indexOf(day) + 1;

  if (currentDay !== targetDayIndex) {
    if (currentDay === 0) return false;
    if (currentDay > targetDayIndex) return true;
    return false;
  }

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  return currentMinutes > beforeTimeToMinutes(slotEnd);
}

function beforeIsSlotActive(
  slotStart: string,
  slotEnd: string,
  currentTime: Date,
  day: Day,
): boolean {
  const currentDay = currentTime.getDay();
  if (currentDay !== days.indexOf(day) + 1) return false;

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  return (
    currentMinutes >= beforeTimeToMinutes(slotStart) &&
    currentMinutes < beforeTimeToMinutes(slotEnd)
  );
}

/* -------------------------------------------------------------------------- */
/* Resolvers                                                                   */
/* -------------------------------------------------------------------------- */

// Mirrors the pre-change lib/hooks/use-timetable.ts: rebuild the option list,
// then scan it. Replaced by lib/elective-index.ts two commits later.
function resolveByScan(type: ElectiveType): ElectiveOption | null {
  const id = SELECTIONS[type];
  if (!id) return null;
  const group = electiveGroups.find((g) => g.type === type);
  return [...(group?.options ?? [])].find((o) => o.id === id) ?? null;
}

const RESOLVED = new Map<ElectiveType, ElectiveOption | null>();
for (const group of electiveGroups) {
  const id = SELECTIONS[group.type];
  RESOLVED.set(group.type, id ? (group.options.find((o) => o.id === id) ?? null) : null);
}
const resolveByIndex = (type: ElectiveType) => RESOLVED.get(type) ?? null;

/* -------------------------------------------------------------------------- */
/* Passes                                                                      */
/* -------------------------------------------------------------------------- */

/** The pass as it was: walk weekSchedule, parse time strings per cell. */
function passBefore(resolve: (type: ElectiveType) => ElectiveOption | null): number {
  let painted = 0;
  for (const day of days) {
    const schedule = weekSchedule[day];
    for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex += 1) {
      const entry = schedule[slotIndex];
      if (!entry) continue;
      const slot = timeSlots[slotIndex];
      const course = entry.electiveType ? resolve(entry.electiveType) : null;
      if (!course) continue;
      if (beforeIsSlotActive(slot.start, slot.end, NOW, day)) painted += 1;
      if (beforeIsSlotPassed(slot.end, NOW, day)) painted += 1;
    }
  }
  return painted;
}

/** The pass now: precomputed schedule, integer predicates, one "now" snapshot. */
function passAfter(resolve: (type: ElectiveType) => ElectiveOption | null): number {
  const now = snapshotNow(NOW);
  let painted = 0;
  for (const day of days) {
    const index = dayIndex[day];
    for (const period of daySchedules[day]) {
      const course = period.entry.electiveType ? resolve(period.entry.electiveType) : null;
      if (!course) continue;
      if (isPeriodActive(period.slot.startMin, period.slot.endMin, now, index)) painted += 1;
      if (isPeriodPassed(period.slot.endMin, now, index)) painted += 1;
    }
  }
  return painted;
}

// Parity gate: every variant must agree, or the comparison means nothing.
const counts = [
  passBefore(resolveByScan),
  passAfter(resolveByScan),
  passBefore(resolveByIndex),
  passAfter(resolveByIndex),
];
if (new Set(counts).size !== 1) {
  throw new Error(`grid passes disagree: ${counts.join(", ")}`);
}

bench("week grid: full render pass (54 cells, 18 scheduled)", [
  { name: "before", fn: () => passBefore(resolveByScan), unitsPerOp: 54 },
  {
    // This commit's own contribution, with the resolver held fixed.
    name: "this commit: integer predicates + daySchedules",
    fn: () => passAfter(resolveByScan),
    unitsPerOp: 54,
  },
  {
    // What the stack reaches once the elective index lands too.
    name: "with the elective index as well",
    fn: () => passAfter(resolveByIndex),
    unitsPerOp: 54,
  },
]);

const NOW_SNAPSHOT = snapshotNow(NOW);

bench("passed predicate (one cell)", [
  { name: "before: parses the time string", fn: () => beforeIsSlotPassed("11:30", NOW, "TUE") },
  { name: "after: integer compare", fn: () => isPeriodPassed(690, NOW_SNAPSHOT, 1) },
]);

bench("active predicate (one cell)", [
  {
    name: "before: parses both time strings",
    fn: () => beforeIsSlotActive("10:30", "11:30", NOW, "TUE"),
  },
  { name: "after: integer compare", fn: () => isPeriodActive(630, 690, NOW_SNAPSHOT, 1) },
]);
