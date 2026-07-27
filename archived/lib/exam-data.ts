// Archived exam schedules. Kept out of lib/ so the live timetable data only
// carries the current semester; re-import from here when exam season returns.
//
// Both Sem VI sittings are preserved. `exam-view.tsx` renders the mid-semester
// set, `exam-view-endsem.tsx` the end-semester one — they are NOT the same
// dates or slot times, so keep them separate.

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

// Sem VI mid-semester exams — March 2026, 14:15-15:45
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

// Sem VI end-semester exams — May 2026, 14:00-17:00
export const endSemesterExams: ExamEntry[] = [
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
