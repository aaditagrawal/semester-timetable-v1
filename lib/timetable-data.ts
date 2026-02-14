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
  PLACT: {
    abbreviation: "PLACT",
    code: "N/A",
    name: "Placement Activities",
    faculty: [{ name: "Placement Cell" }],
    room: "TBD",
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
          { name: "Ms. Shwetha [B5]" },
        ],
        room: "AB5 - 203 [B1], 205 [B2], 206 [B3], 306 [B4], 307 [B5]",
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
    options: [
      {
        id: "oe-aae4311",
        abbreviation: "AAE 4311",
        code: "AAE 4311",
        name: "OPEN ELECTIVE - INTRODUCTION TO AEROSPACE ENGINEERING",
        faculty: [{ name: "TBD" }],
        room: "AB5 206",
      },
      {
        id: "oe-aae4313",
        abbreviation: "AAE 4313",
        code: "AAE 4313",
        name: "Introduction to Automobile Engineering",
        faculty: [{ name: "TBD" }],
        room: "AB5 207",
      },
      {
        id: "oe-bme4315",
        abbreviation: "BME 4315",
        code: "BME 4315",
        name: "OPEN ELECTIVE - INTRODUCTION TO NANOTECHNOLOGY AND CHARACTERIZATION TECHNIQUES",
        faculty: [{ name: "TBD" }],
        room: "AB5 208",
      },
      {
        id: "oe-che4311",
        abbreviation: "CHE 4311",
        code: "CHE 4311",
        name: "Industrial Pollution Control",
        faculty: [{ name: "TBD" }],
        room: "AB5 209",
      },
      {
        id: "oe-che4312",
        abbreviation: "CHE 4312",
        code: "CHE 4312",
        name: "Risk and Safety Management in Industries",
        faculty: [{ name: "TBD" }],
        room: "AB5 210",
      },
      {
        id: "oe-chm4312",
        abbreviation: "CHM 4312",
        code: "CHM 4312",
        name: "OPEN ELECTIVE - SUSTAINABLE CHEMICAL PROCESSES AND PRODUCTS",
        faculty: [{ name: "TBD" }],
        room: "AB5 211",
      },
      {
        id: "oe-cie4313",
        abbreviation: "CIE 4313",
        code: "CIE 4313",
        name: "Environmental Management",
        faculty: [{ name: "TBD" }],
        room: "AB5 212",
      },
      {
        id: "oe-cie4314",
        abbreviation: "CIE 4314",
        code: "CIE 4314",
        name: "OPEN ELECTIVE - GEOLOGY FOR ENGINEERS",
        faculty: [{ name: "TBD" }],
        room: "AB5 303",
      },
      {
        id: "oe-cie4316",
        abbreviation: "CIE 4316",
        code: "CIE 4316",
        name: "Strength of Materials",
        faculty: [{ name: "TBD" }],
        room: "AB5 304",
      },
      {
        id: "oe-cse4456",
        abbreviation: "CSE 4456",
        code: "CSE 4456",
        name: "iOS Application Development",
        faculty: [{ name: "TBD" }],
        room: "Apple Studio Lab, Innovation Centre",
      },
      {
        id: "oe-ece4311",
        abbreviation: "ECE 4311",
        code: "ECE 4311",
        name: "Consumer Electronics",
        faculty: [{ name: "TBD" }],
        room: "AB5 305",
      },
      {
        id: "oe-ece4323",
        abbreviation: "ECE 4323",
        code: "ECE 4323",
        name: "Vedic Mathematics and its Applications in Modern Technologies",
        faculty: [{ name: "TBD" }],
        room: "AB5 306",
      },
      {
        id: "oe-ele4311",
        abbreviation: "ELE 4311",
        code: "ELE 4311",
        name: "MATLAB for Engineers",
        faculty: [{ name: "TBD" }],
        room: "AB5 201, AB5 202",
      },
      {
        id: "oe-ele4312",
        abbreviation: "ELE 4312",
        code: "ELE 4312",
        name: "Essentials of Energy Auditing",
        faculty: [{ name: "TBD" }],
        room: "AB5 411",
      },
      {
        id: "oe-hum4322",
        abbreviation: "HUM 4322",
        code: "HUM 4322",
        name: "OPEN ELECTIVE - Film Studies",
        faculty: [{ name: "TBD" }],
        room: "AB5 308",
      },
      {
        id: "oe-hum4323",
        abbreviation: "HUM 4323",
        code: "HUM 4323",
        name: "OPEN ELECTIVE - German for Beginners",
        faculty: [{ name: "TBD" }],
        room: "AB5 403",
      },
      {
        id: "oe-hum4329",
        abbreviation: "HUM 4329",
        code: "HUM 4329",
        name: "Creative Communication: Art, Media, Culture and Ideas",
        faculty: [{ name: "TBD" }],
        room: "AB5 309",
      },
      {
        id: "oe-hum4337",
        abbreviation: "HUM 4337",
        code: "HUM 4337",
        name: "Introduction to Enterprise Risk Management",
        faculty: [{ name: "TBD" }],
        room: "AB5 310A",
      },
      {
        id: "oe-ice4314",
        abbreviation: "ICE 4314",
        code: "ICE 4314",
        name: "Sensor Technology",
        faculty: [{ name: "TBD" }],
        room: "AB5 310B",
      },
      {
        id: "oe-ice4316",
        abbreviation: "ICE 4316",
        code: "ICE 4316",
        name: "Virtual Instrumentation",
        faculty: [{ name: "TBD" }],
        room: "AB5 407",
      },
      {
        id: "oe-ice4318",
        abbreviation: "ICE 4318",
        code: "ICE 4318",
        name: "Outdoor Leadership",
        faculty: [{ name: "TBD" }],
        room: "AB5 311",
      },
      {
        id: "oe-ice4319",
        abbreviation: "ICE 4319",
        code: "ICE 4319",
        name: "Himalayan Outdoor Leadership",
        faculty: [{ name: "TBD" }],
        room: "AB5 301",
      },
      {
        id: "oe-ice4320",
        abbreviation: "ICE 4320",
        code: "ICE 4320",
        name: "Nature Journaling",
        faculty: [{ name: "TBD" }],
        room: "AB5 302",
      },
      {
        id: "oe-iie4310",
        abbreviation: "IIE 4310",
        code: "IIE 4310",
        name: "OPEN ELECTIVE - Medical Emergency and First Aid",
        faculty: [{ name: "TBD" }],
        room: "Academic Block 5 – 313",
      },
      {
        id: "oe-iie4315",
        abbreviation: "IIE 4315",
        code: "IIE 4315",
        name: "OPEN ELECTIVE - Reporting and Writing",
        faculty: [{ name: "TBD" }],
        room: "Academic Block 5 – 314",
      },
      {
        id: "oe-iie4318",
        abbreviation: "IIE 4318",
        code: "IIE 4318",
        name: "OPEN ELECTIVE - Media Production Techniques",
        faculty: [{ name: "TBD" }],
        room: "Academic Block 5 – 402",
      },
      {
        id: "oe-iie4324",
        abbreviation: "IIE 4324",
        code: "IIE 4324",
        name: "OPEN ELECTIVE - Yoga",
        faculty: [{ name: "TBD" }],
        room: "Academic Block 5 – 312",
      },
      {
        id: "oe-iie4333",
        abbreviation: "IIE 4333",
        code: "IIE 4333",
        name: "OPEN ELECTIVE - Meditation and Conscious Living Course",
        faculty: [{ name: "TBD" }],
        room: "Academic Block 5 – 315",
      },
      {
        id: "oe-iie4334",
        abbreviation: "IIE 4334",
        code: "IIE 4334",
        name: "OPEN ELECTIVE - Discerning India: Living Cultures of Tulunadu",
        faculty: [{ name: "TBD" }],
        room: "Academic Block 5 – 316",
      },
      {
        id: "oe-iie4335",
        abbreviation: "IIE 4335",
        code: "IIE 4335",
        name: "OPEN ELECTIVE - Introduction to Foreign Language – French I",
        faculty: [{ name: "TBD" }],
        room: "ONLINE",
      },
      {
        id: "oe-mat5301",
        abbreviation: "MAT 5301",
        code: "MAT 5301",
        name: "OPEN ELECTIVE - Applied Graph Theory",
        faculty: [{ name: "TBD" }],
        room: "AB5 404",
      },
      {
        id: "oe-mat5302",
        abbreviation: "MAT 5302",
        code: "MAT 5302",
        name: "OPEN ELECTIVE - Applied Linear Algebra",
        faculty: [{ name: "TBD" }],
        room: "AB5 405",
      },
      {
        id: "oe-mat5305",
        abbreviation: "MAT 5305",
        code: "MAT 5305",
        name: "OPEN ELECTIVE - Optimization Techniques",
        faculty: [{ name: "TBD" }],
        room: "AB5 410",
      },
      {
        id: "oe-mie4311",
        abbreviation: "MIE 4311",
        code: "MIE 4311",
        name: "Introduction to Composite Materials",
        faculty: [{ name: "TBD" }],
        room: "AB5 203, AB5 205",
      },
      {
        id: "oe-mie4312",
        abbreviation: "MIE 4312",
        code: "MIE 4312",
        name: "Introduction to Biomechanics",
        faculty: [{ name: "TBD" }],
        room: "AB5 406",
      },
      {
        id: "oe-mie4313",
        abbreviation: "MIE 4313",
        code: "MIE 4313",
        name: "Introduction to Operations Research",
        faculty: [{ name: "TBD" }],
        room: "AB5 408",
      },
      {
        id: "oe-mte4315",
        abbreviation: "MTE 4315",
        code: "MTE 4315",
        name: "Introduction to Industrial Robotics",
        faculty: [{ name: "TBD" }],
        room: "AB5 409",
      },
    ],
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
    7: { courseAbbreviation: "PLACT" },
    8: { courseAbbreviation: "PLACT" },
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
    7: { courseAbbreviation: "PLACT" },
    8: { courseAbbreviation: "PLACT" },
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

// Exam schedule data
export interface ExamEntry {
  courseAbbreviation: string;
  courseCode: string;
  courseName: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isElective?: boolean;
  electiveType?: "PE-1" | "PE-2" | "OE" | "FC-2";
}

export const midSemesterExams: ExamEntry[] = [
  {
    courseAbbreviation: "EEFM",
    courseCode: "HUM 3021",
    courseName: "Engineering Economics and Financial Management",
    date: "2026-03-06",
    startTime: "14:15",
    endTime: "15:45",
  },
  {
    courseAbbreviation: "NPACN",
    courseCode: "ICT 3225",
    courseName: "Network Programming and Advanced Communication Networks",
    date: "2026-03-07",
    startTime: "14:15",
    endTime: "15:45",
  },
  {
    courseAbbreviation: "FC-2",
    courseCode: "",
    courseName: "Flexi Core 2",
    date: "2026-03-09",
    startTime: "14:15",
    endTime: "15:45",
    isElective: true,
    electiveType: "FC-2",
  },
  {
    courseAbbreviation: "PE-1",
    courseCode: "",
    courseName: "Program Elective 1",
    date: "2026-03-10",
    startTime: "14:15",
    endTime: "15:45",
    isElective: true,
    electiveType: "PE-1",
  },
  {
    courseAbbreviation: "PE-2",
    courseCode: "",
    courseName: "Program Elective 2",
    date: "2026-03-11",
    startTime: "14:15",
    endTime: "15:45",
    isElective: true,
    electiveType: "PE-2",
  },
  {
    courseAbbreviation: "OE",
    courseCode: "",
    courseName: "Open Elective",
    date: "2026-03-12",
    startTime: "14:15",
    endTime: "15:45",
    isElective: true,
    electiveType: "OE",
  },
];

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
