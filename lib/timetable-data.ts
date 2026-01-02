// Timetable data structure for MIT Manipal - School of Computer Engineering
// Semester VI BTECH[CCE]-B, AY 2025-26

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

export interface ElectiveOption extends Course {
    id: string;
}

export interface ElectiveGroup {
    type: "PE-1" | "PE-2" | "OE" | "FC-2";
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
    electiveType?: "PE-1" | "PE-2" | "OE" | "FC-2";
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

// Core courses
export const courses: Record<string, Course> = {
    EEFM: {
        abbreviation: "EEFM",
        code: "HUM 3021",
        name: "Engineering Economics and Financial Management",
        faculty: [{ name: "Prof. Pranav Joshi" }],
        room: "AB5-306",
    },
    NPACN: {
        abbreviation: "NPACN",
        code: "ICT 3225",
        name: "Network Programming and Advanced Communication Networks",
        faculty: [{ name: "Dr. Adesh N D" }],
        room: "AB5-306",
    },
    MADL: {
        abbreviation: "MADL",
        code: "ICT 3243",
        name: "Mobile Application Development Lab",
        faculty: [{ name: "Mrs. Pooja S" }, { name: "Ms. Jayashree Hegde K" }],
    },
    NDPL: {
        abbreviation: "NDPL",
        code: "ICT 3244",
        name: "Network Design and Programming Lab",
        faculty: [{ name: "Dr. Adesh N D" }, { name: "Dr. Ushakiran" }],
    },
};

// Elective groups with options
export const electiveGroups: ElectiveGroup[] = [
    {
        type: "FC-2",
        options: [
            {
                id: "fc2-a2",
                abbreviation: "A2",
                code: "ICT 3228",
                name: "Cloud Technologies",
                faculty: [{ name: "Dr. Manjula Shenoy" }],
                room: "AB5-201",
            },
            {
                id: "fc2-b2",
                abbreviation: "B2",
                code: "ICT 3229",
                name: "Data Mining and Predictive Analytics",
                faculty: [{ name: "Mr. E. Sreehari" }],
                room: "AB5-202",
            },
            {
                id: "fc2-c2",
                abbreviation: "C2",
                code: "ICT 3230",
                name: "Full Stack Development",
                faculty: [
                    { name: "Dr. Raghavendra Achar [B1]" },
                    { name: "Shanmukharaj [B2]" },
                    { name: "Dr. Roshan David Jathanna [B3]" },
                    { name: "Dr. Mayank Patel [B4]" },
                ],
                room: "AB5-203, 205, 206, 306",
            },
            {
                id: "fc2-d2",
                abbreviation: "D2",
                code: "ICT 3223",
                name: "Software Verification and Validation",
                faculty: [{ name: "Dr Raviraj Holla" }],
                room: "AB5-308",
            },
        ],
    },
    {
        type: "PE-1",
        options: [], // User adds their own
    },
    {
        type: "PE-2",
        options: [], // User adds their own
    },
    {
        type: "OE",
        options: [], // User adds their own
    },
];

// Weekly schedule based on the timetable image
// Index corresponds to timeSlots array index
export const weekSchedule: WeekSchedule = {
    MON: {
        0: { courseAbbreviation: "PE-1", isElective: true, electiveType: "PE-1" },
        1: { courseAbbreviation: "FC-2", isElective: true, electiveType: "FC-2" },
        2: null, // Break
        3: { courseAbbreviation: "EEFM" },
        4: { courseAbbreviation: "OE", isElective: true, electiveType: "OE" },
        5: null, // Lunch break
        6: {
            courseAbbreviation: "LAB",
            isLab: true,
            labInfo: {
                B1: { course: "MADL", room: "CL-16" },
                B2: { course: "NDPL", room: "CL-18" },
                timeOverride: { start: "14:00", end: "16:30" },
            },
        },
        7: null, // Part of lab
        8: null, // Part of lab
    },
    TUE: {
        0: null,
        1: null,
        2: null,
        3: null,
        4: null,
        5: { courseAbbreviation: "PE-2", isElective: true, electiveType: "PE-2" },
        6: { courseAbbreviation: "NPACN" },
        7: null,
        8: null,
    },
    WED: {
        0: { courseAbbreviation: "PE-2", isElective: true, electiveType: "PE-2" },
        1: { courseAbbreviation: "NPACN" },
        2: null,
        3: { courseAbbreviation: "PE-1", isElective: true, electiveType: "PE-1" },
        4: { courseAbbreviation: "FC-2", isElective: true, electiveType: "FC-2" },
        5: null,
        6: null,
        7: null,
        8: null,
    },
    THU: {
        0: {
            courseAbbreviation: "LAB",
            isLab: true,
            labInfo: {
                // Thursday: Batches swap labs
                B1: { course: "NDPL", room: "CL-18" },
                B2: { course: "MADL", room: "CL-16" },
                timeOverride: { start: "08:30", end: "11:00" },
            },
        },
        1: null, // Part of lab
        2: null, // Part of lab
        3: null,
        4: null,
        5: { courseAbbreviation: "EEFM" },
        6: { courseAbbreviation: "OE", isElective: true, electiveType: "OE" },
        7: null,
        8: null,
    },
    FRI: {
        0: { courseAbbreviation: "EEFM" },
        1: { courseAbbreviation: "OE", isElective: true, electiveType: "OE" },
        2: null,
        3: { courseAbbreviation: "PE-2", isElective: true, electiveType: "PE-2" },
        4: { courseAbbreviation: "NPACN" },
        5: null,
        6: null,
        7: null,
        8: null,
    },
    SAT: {
        0: null,
        1: null,
        2: null,
        3: null,
        4: null,
        5: { courseAbbreviation: "PE-1", isElective: true, electiveType: "PE-1" },
        6: { courseAbbreviation: "FC-2", isElective: true, electiveType: "FC-2" },
        7: null,
        8: { courseAbbreviation: "NPACN" },
    },
};

// Helper function to get course details
export function getCourseByAbbreviation(
    abbreviation: string,
    selectedElectives?: Record<string, string>
): Course | null {
    // First check core courses
    if (courses[abbreviation]) {
        return courses[abbreviation];
    }

    // Then check electives
    for (const group of electiveGroups) {
        if (group.type === abbreviation && selectedElectives?.[group.type]) {
            const selectedOption = group.options.find(
                (opt) => opt.id === selectedElectives[group.type]
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
    day: Day
): boolean {
    const currentDay = currentTime.getDay(); // 0 = Sunday
    const dayIndex = days.indexOf(day);
    const targetDayIndex = dayIndex + 1; // days array is 0-indexed starting Monday

    // If it's a different day of the week
    if (currentDay !== targetDayIndex) {
        // For this week's comparison
        if (currentDay > targetDayIndex) {
            return true; // Day has passed this week
        }
        if (currentDay === 0) {
            return true; // Sunday - all weekdays from last week are passed
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
    day: Day
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
