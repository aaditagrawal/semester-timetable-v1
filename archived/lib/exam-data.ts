// Archived exam schedules. Kept out of lib/ so the live timetable data only
// carries the current semester; re-import from here when exam season returns.

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

// Sem VI end-semester exams, AY 2025-26
export const midSemesterExams: ExamEntry[] = [
  {
    courseAbbreviation: "EEFM",
    courseCode: "HUM 3021",
    courseName: "Engineering Economics and Financial Management",
    date: "2026-05-04",
    startTime: "14:00",
    endTime: "17:00",
  },
  {
    courseAbbreviation: "NPACN",
    courseCode: "ICT 3225",
    courseName: "Network Programming and Advanced Communication Networks",
    date: "2026-05-06",
    startTime: "14:00",
    endTime: "17:00",
  },
  {
    courseAbbreviation: "FC-2",
    courseCode: "",
    courseName: "Flexi Core 2",
    date: "2026-05-08",
    startTime: "14:00",
    endTime: "17:00",
    isElective: true,
    electiveType: "FC-2",
  },
  {
    courseAbbreviation: "PE-1",
    courseCode: "",
    courseName: "Program Elective 1",
    date: "2026-05-11",
    startTime: "14:00",
    endTime: "17:00",
    isElective: true,
    electiveType: "PE-1",
  },
  {
    courseAbbreviation: "PE-2",
    courseCode: "",
    courseName: "Program Elective 2",
    date: "2026-05-13",
    startTime: "14:00",
    endTime: "17:00",
    isElective: true,
    electiveType: "PE-2",
  },
  {
    courseAbbreviation: "OE",
    courseCode: "",
    courseName: "Open Elective",
    date: "2026-05-15",
    startTime: "14:00",
    endTime: "17:00",
    isElective: true,
    electiveType: "OE",
  },
];
