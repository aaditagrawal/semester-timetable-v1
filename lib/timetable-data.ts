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

/**
 * Stored in `selections` where an option id would go, to mean "I'm doing the
 * student project instead of taking a course in this basket".
 *
 * It is deliberately a selection value rather than an entry in the basket: a
 * project is not a course, has no slot on the section grid, and the point of
 * choosing it is that those periods go away. Everything that resolves a
 * selection to a course returns null for it, and the renderers drop the slot
 * rather than draw an unconfigured placeholder.
 *
 * Generated option ids are `<course-code>[-<section>]` and user-added ones are
 * `custom-…`, so this can never collide with a real course.
 */
export const STUDENT_PROJECT_ID = "student-project";

export const STUDENT_PROJECT_LABEL = "Student Project";

/**
 * Baskets the student project can be taken in place of. Only the open elective
 * is optional this semester — the five program electives are compulsory.
 */
export const projectEligibleTypes: ElectiveType[] = ["OE"];

export function isProjectEligible(type: ElectiveType): boolean {
  return projectEligibleTypes.includes(type);
}

/** True when this basket's slots should disappear from the grid entirely. */
export function isStudentProjectSelection(
  selectedId: string | undefined,
): boolean {
  return selectedId === STUDENT_PROJECT_ID;
}

export interface ElectiveOption extends Course {
  id: string;
}

export interface ElectiveGroup {
  type: ElectiveType;
  options: ElectiveOption[];
}

export interface TimeSlot {
  start: string; // HH:MM format
  end: string; // HH:MM format
  label: string;
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
];

// Day labels
export const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
export type Day = (typeof days)[number];

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

// Helper function to get course details
export function getCourseByAbbreviation(
  abbreviation: string,
  selectedElectives?: Record<string, string>,
): Course | null {
  // First check core courses
  if (courses[abbreviation]) {
    return courses[abbreviation];
  }

  // Then check electives
  for (const group of electiveGroups) {
    if (group.type === abbreviation && selectedElectives?.[group.type]) {
      const selectedOption = group.options.find(
        (opt) => opt.id === selectedElectives[group.type],
      );
      if (selectedOption) {
        return selectedOption;
      }
    }
    // Also check by ID
    for (const option of group.options) {
      if (option.id === abbreviation || option.abbreviation === abbreviation) {
        return option;
      }
    }
  }

  return null;
}

// Helper to parse time string to minutes from midnight
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Helper to check if a time slot is in the past
export function isSlotPassed(
  slotEnd: string,
  currentTime: Date,
  day: Day,
): boolean {
  const currentDay = currentTime.getDay(); // 0 = Sunday
  const dayIndex = days.indexOf(day);
  const targetDayIndex = dayIndex + 1; // days array is 0-indexed starting Monday

  // If it's a different day of the week
  if (currentDay !== targetDayIndex) {
    // Sunday sits between two weeks. The views show the *coming* week (the day
    // selector falls back to Monday), so nothing on it has happened yet —
    // treating it as passed would grey out every class and hide "NEXT UP".
    if (currentDay === 0) {
      return false;
    }
    if (currentDay > targetDayIndex) {
      return true; // Day has passed this week
    }
    return false; // Day hasn't come yet this week
  }

  // Same day - compare times
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const slotEndMinutes = timeToMinutes(slotEnd);

  return currentMinutes > slotEndMinutes;
}

// Helper to check if a time slot is currently active
export function isSlotActive(
  slotStart: string,
  slotEnd: string,
  currentTime: Date,
  day: Day,
): boolean {
  const currentDay = currentTime.getDay();
  const dayIndex = days.indexOf(day);
  const targetDayIndex = dayIndex + 1;

  if (currentDay !== targetDayIndex) {
    return false;
  }

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const slotStartMinutes = timeToMinutes(slotStart);
  const slotEndMinutes = timeToMinutes(slotEnd);

  return currentMinutes >= slotStartMinutes && currentMinutes < slotEndMinutes;
}
