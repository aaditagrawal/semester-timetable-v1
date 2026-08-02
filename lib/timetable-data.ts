import { electiveOptions } from "@/lib/elective-options";

// Timetable data structure for MIT Manipal - School of Computer Engineering
// Semester VII BTECH[IT_CCE], AY 2026-27
//
// The section timetable sheet is headed "AY 2025-26", but that header is stale:
// this cohort sat its Sem VI end-semester exams in May 2026, and the elective
// allocation data these courses come from is published for AY 2026-27.

export interface Faculty {
  name: string;
}

export interface Course {
  abbreviation: string;
  code: string;
  name: string;
  faculty: Faculty[];
  room?: string;
}

/**
 * Elective slots that appear in this semester's grid. Everything in Sem VII is
 * an elective, so changing this list is what re-targets the app at a new sem.
 */
export type ElectiveType = "PE-3" | "PE-4" | "PE-5" | "PE-6" | "PE-7" | "OE";

export const electiveTypes: ElectiveType[] = [
  "PE-3",
  "PE-4",
  "PE-5",
  "PE-6",
  "PE-7",
  "OE",
];

export const electiveTypeLabels: Record<ElectiveType, string> = {
  "PE-3": "Program Elective 3",
  "PE-4": "Program Elective 4",
  "PE-5": "Program Elective 5",
  "PE-6": "Program Elective 6",
  "PE-7": "Program Elective 7",
  OE: "Open Elective",
};

export interface ElectiveOption extends Course {
  id: string;
}

/**
 * Offered inside the Open Elective basket for students doing the student
 * project instead. It is an ordinary option so the existing pick-list, the
 * selected-course card and search all render it for free, but it resolves to
 * no course: `getSelectedElective` returns null and the views leave its three
 * periods off the grid rather than drawing an "not configured" prompt.
 *
 * Generated ids are `<course-code>[-<section>]` and user-added ones are
 * `custom-…`, so this cannot collide with a real course.
 */
export const STUDENT_PROJECT_ID = "student-project";

export const studentProjectOption: ElectiveOption = {
  id: STUDENT_PROJECT_ID,
  abbreviation: "Student Project",
  code: "",
  name: "No open elective — these periods stay off your timetable",
  faculty: [],
};

/**
 * Only the OE can be traded for the project — the five program electives are
 * compulsory. Scoping the check here means a hand-edited backup that sets the
 * sentinel on a PE just fails to match, rather than deleting a class.
 */
export function isStudentProject(
  type: ElectiveType,
  selectedId: string | undefined,
): boolean {
  return type === "OE" && selectedId === STUDENT_PROJECT_ID;
}

export interface ElectiveGroup {
  type: ElectiveType;
  options: ElectiveOption[];
}

export interface TimeSlot {
  start: string; // HH:MM format
  end: string; // HH:MM format
  label: string;
  /**
   * `start`/`end` as minutes from midnight, derived once at module load.
   *
   * Every "is this slot active / already over" question is an integer
   * comparison; without these it was a `split(":")` and a `map(Number)` — two
   * throwaway arrays — on each side of each comparison, for each of the 54
   * grid cells, on each render.
   */
  startMin: number;
  endMin: number;
}

export type LabBatch = "B1" | "B2";

export interface LabBatchInfo {
  course: string;
  room: string;
}

export interface ScheduleEntry {
  courseAbbreviation: string; // Reference to course abbreviation or elective type
  isElective?: boolean;
  electiveType?: ElectiveType;
  /**
   * Lab scaffolding is unused this semester — Sem VII's grid is entirely
   * electives — but is kept because labs recur most semesters and the renderers
   * in day-view/week-view/calendar-export already handle them. The branches are
   * inert while no entry sets `isLab`, not dead in the delete-me sense.
   */
  isLab?: boolean;
  labInfo?: {
    // Batch-specific lab assignments
    B1: LabBatchInfo;
    B2: LabBatchInfo;
    timeOverride?: { start: string; end: string };
  };
}

export interface DaySchedule {
  [timeSlotIndex: number]: ScheduleEntry | null;
}

export interface WeekSchedule {
  [day: string]: DaySchedule;
}

// Helper to parse time string to minutes from midnight
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Time slots for the timetable
export const timeSlots: TimeSlot[] = [
  { start: "08:00", end: "09:00", label: "8:00-9:00" },
  { start: "09:00", end: "10:00", label: "9:00-10:00" },
  { start: "10:00", end: "10:30", label: "10:00-10:30" },
  { start: "10:30", end: "11:30", label: "10:30-11:30" },
  { start: "11:30", end: "12:30", label: "11:30-12:30" },
  { start: "13:00", end: "14:00", label: "13:00-14:00" },
  { start: "14:00", end: "15:00", label: "14:00-15:00" },
  { start: "15:00", end: "15:30", label: "15:00-15:30" },
  { start: "15:30", end: "16:30", label: "15:30-16:30" },
].map((slot) => ({
  ...slot,
  startMin: timeToMinutes(slot.start),
  endMin: timeToMinutes(slot.end),
}));

// Day labels
export const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
export type Day = (typeof days)[number];

/**
 * `Day` -> its position in `days`, so the predicates below stop doing a linear
 * `days.indexOf` per call. Small either way at six entries; the point is that
 * it is a property read rather than a scan in a loop that runs per cell.
 */
export const dayIndex: Record<Day, number> = Object.fromEntries(
  days.map((day, index) => [day, index]),
) as Record<Day, number>;

/**
 * Minutes-from-midnight for every "HH:MM" the schedule actually contains.
 *
 * The string-taking predicates are kept for callers that still hold a time
 * string (lab `timeOverride`s), and this turns their parse into a map hit.
 */
const MINUTES_BY_TIME = new Map<string, number>();
for (const slot of timeSlots) {
  MINUTES_BY_TIME.set(slot.start, slot.startMin);
  MINUTES_BY_TIME.set(slot.end, slot.endMin);
}

function minutesOf(time: string): number {
  const cached = MINUTES_BY_TIME.get(time);
  if (cached !== undefined) return cached;
  const parsed = timeToMinutes(time);
  MINUTES_BY_TIME.set(time, parsed);
  return parsed;
}

/**
 * Core (non-elective) courses. Sem VII has none — every slot in the grid is an
 * elective the student picks in setup.
 */
export const courses: Record<string, Course> = {};

// Elective groups, populated from the published Sem VII allocation sheets.
// Students can still add anything missing as a custom elective in setup.
export const electiveGroups: ElectiveGroup[] = electiveTypes.map((type) => ({
  type,
  options: electiveOptions[type],
}));

// Weekly schedule — Sem VII BTECH[IT_CCE]
// Index corresponds to timeSlots array index
export const weekSchedule: WeekSchedule = {
  MON: {
    0: null,
    1: null,
    2: null, // Break
    3: null,
    4: null,
    5: null, // Lunch break
    6: { courseAbbreviation: "PE-6", isElective: true, electiveType: "PE-6" },
    7: null,
    8: { courseAbbreviation: "PE-7", isElective: true, electiveType: "PE-7" },
  },
  TUE: {
    0: { courseAbbreviation: "OE", isElective: true, electiveType: "OE" },
    1: { courseAbbreviation: "PE-3", isElective: true, electiveType: "PE-3" },
    2: null,
    3: { courseAbbreviation: "PE-4", isElective: true, electiveType: "PE-4" },
    4: { courseAbbreviation: "PE-5", isElective: true, electiveType: "PE-5" },
    5: null,
    6: null,
    7: null,
    8: null,
  },
  WED: {
    0: null,
    1: null,
    2: null,
    3: null,
    4: null,
    5: { courseAbbreviation: "OE", isElective: true, electiveType: "OE" },
    6: { courseAbbreviation: "PE-4", isElective: true, electiveType: "PE-4" },
    7: null,
    8: { courseAbbreviation: "PE-5", isElective: true, electiveType: "PE-5" },
  },
  THU: {
    0: { courseAbbreviation: "PE-7", isElective: true, electiveType: "PE-7" },
    1: { courseAbbreviation: "PE-6", isElective: true, electiveType: "PE-6" },
    2: null,
    3: { courseAbbreviation: "PE-3", isElective: true, electiveType: "PE-3" },
    4: { courseAbbreviation: "OE", isElective: true, electiveType: "OE" },
    5: null,
    6: null,
    7: null,
    8: null,
  },
  FRI: {
    0: null,
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: { courseAbbreviation: "PE-3", isElective: true, electiveType: "PE-3" },
    7: null,
    8: { courseAbbreviation: "PE-4", isElective: true, electiveType: "PE-4" },
  },
  SAT: {
    0: { courseAbbreviation: "PE-6", isElective: true, electiveType: "PE-6" },
    1: { courseAbbreviation: "PE-5", isElective: true, electiveType: "PE-5" },
    2: null,
    3: { courseAbbreviation: "PE-7", isElective: true, electiveType: "PE-7" },
    4: null,
    5: null,
    6: null,
    7: null,
    8: null,
  },
};

/** A period that is actually scheduled, paired with the slot it sits in. */
export interface ScheduledPeriod {
  slotIndex: number;
  slot: TimeSlot;
  entry: ScheduleEntry;
}

/**
 * Every day's scheduled periods, in slot order, with the empty slots dropped.
 *
 * `weekSchedule` is authored as a slot-indexed object with explicit nulls,
 * which reads well next to the printed sheet but means each render had to
 * `Object.entries` it, `parseInt` every key back into a number and re-sort the
 * result. The schedule is a build-time constant, so all of that is done once
 * here instead — 18 scheduled periods across the week, found by walking the
 * slots in order rather than by sorting.
 */
export const daySchedules: Record<Day, ScheduledPeriod[]> = Object.fromEntries(
  days.map((day) => {
    const schedule = weekSchedule[day];
    const periods: ScheduledPeriod[] = [];
    for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex += 1) {
      const entry = schedule?.[slotIndex];
      if (entry) periods.push({ slotIndex, slot: timeSlots[slotIndex], entry });
    }
    return [day, periods];
  }),
) as Record<Day, ScheduledPeriod[]>;

/**
 * The current instant reduced to the only two numbers the grid asks about.
 *
 * Taken once per render and passed down, so a tick reads the `Date` once
 * instead of four times per cell — and, more usefully, so the predicates below
 * are pure integer comparisons that a memoised cell can be keyed on.
 */
export interface NowSnapshot {
  /** 0 = Sunday, matching `Date#getDay`. */
  dayOfWeek: number;
  /** Minutes from midnight. */
  minutes: number;
}

export function snapshotNow(currentTime: Date): NowSnapshot {
  return {
    dayOfWeek: currentTime.getDay(),
    minutes: currentTime.getHours() * 60 + currentTime.getMinutes(),
  };
}

/**
 * Has this period already finished?
 *
 * `index` is the day's position in `days` (0 = Monday), which is one less than
 * the same day's `Date#getDay` value.
 */
export function isPeriodPassed(
  slotEndMin: number,
  now: NowSnapshot,
  index: number,
): boolean {
  const targetDayIndex = index + 1;

  if (now.dayOfWeek !== targetDayIndex) {
    // Sunday sits between two weeks. The views show the *coming* week (the day
    // selector falls back to Monday), so nothing on it has happened yet —
    // treating it as passed would grey out every class and hide "NEXT UP".
    if (now.dayOfWeek === 0) return false;
    return now.dayOfWeek > targetDayIndex;
  }

  return now.minutes > slotEndMin;
}

export function isPeriodActive(
  slotStartMin: number,
  slotEndMin: number,
  now: NowSnapshot,
  index: number,
): boolean {
  if (now.dayOfWeek !== index + 1) return false;
  return now.minutes >= slotStartMin && now.minutes < slotEndMin;
}

/**
 * String/`Date` forms of the two predicates above.
 *
 * Kept because lab periods carry their times as strings (`labInfo.timeOverride`)
 * rather than as slot indices, so there is still a caller that has nothing but
 * an "HH:MM". Everything on the per-cell path should use the numeric pair.
 */
export function isSlotPassed(
  slotEnd: string,
  currentTime: Date,
  day: Day,
): boolean {
  return isPeriodPassed(minutesOf(slotEnd), snapshotNow(currentTime), dayIndex[day]);
}

export function isSlotActive(
  slotStart: string,
  slotEnd: string,
  currentTime: Date,
  day: Day,
): boolean {
  return isPeriodActive(
    minutesOf(slotStart),
    minutesOf(slotEnd),
    snapshotNow(currentTime),
    dayIndex[day],
  );
}
