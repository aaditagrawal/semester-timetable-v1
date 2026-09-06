"use client";

import { classNames } from "@/ui.stylex";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Course } from "@/lib/timetable-data";
import { ExamEntry, endSemesterExams } from "@/archived/lib/exam-data";
import { UserElectiveSelections } from "@/lib/hooks/use-timetable";
import { CalendarIcon, ClockIcon, BookOpenIcon } from "@phosphor-icons/react";

interface ExamViewProps {
  selections: UserElectiveSelections;
  getSelectedElective: (type: "PE-1" | "PE-2" | "OE" | "FC-2") => Course | null;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getExamStatus(dateStr: string, endTime: string): "past" | "today" | "upcoming" {
  const now = new Date();
  const todayStr =
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(now.getDate()).padStart(2, "0");

  if (dateStr < todayStr) return "past";
  if (dateStr === todayStr) {
    const [endH, endM] = endTime.split(":").map(Number);
    if (now.getHours() > endH || (now.getHours() === endH && now.getMinutes() >= endM)) {
      return "past";
    }
    return "today";
  }
  return "upcoming";
}

function getDaysRemaining(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const examDate = new Date(dateStr + "T00:00:00");
  const diff = examDate.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function ExamView({ selections, getSelectedElective }: ExamViewProps) {
  const allExams = React.useMemo(() => {
    return [...endSemesterExams].sort((a, b) => a.date.localeCompare(b.date));
  }, []);

  // Compute statuses client-side to avoid hydration mismatch with server-rendered dates
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const examStatuses = allExams.map((exam) =>
    mounted ? getExamStatus(exam.date, exam.endTime) : ("upcoming" as const),
  );
  const highlightIdx = mounted ? examStatuses.findIndex((s) => s !== "past") : -1;

  return (
    <div className={classNames.home17}>
      {/* Header */}
      <div className={classNames.examViewEndsem325}>
        <div className={classNames.home18}>
          <BookOpenIcon className={classNames.examViewEndsem326} weight="fill" />
          <h2 className={classNames.examViewEndsem327}>End Semester Exams</h2>
        </div>
        <p className={classNames.home22}>May 2026 &middot; 2:00 PM &ndash; 5:00 PM</p>
      </div>

      {/* Exam list */}
      <div className={classNames.home13}>
        {allExams.map((exam, idx) => {
          const status = examStatuses[idx];
          const isHighlighted = idx === highlightIdx;
          const daysRemaining = getDaysRemaining(exam.date);

          // Resolve elective course if applicable
          let courseName = exam.courseName;
          let courseCode = exam.courseCode;
          let isUnconfiguredElective = false;

          if (exam.isElective && exam.electiveType) {
            const selected = getSelectedElective(exam.electiveType);
            if (selected) {
              courseName = selected.name;
              courseCode = selected.code;
            } else {
              isUnconfiguredElective = true;
            }
          }

          return (
            <Card
              key={idx}
              size="sm"
              className={
                status === "past"
                  ? classNames.examViewEndsem328
                  : isHighlighted
                    ? classNames.dayView205
                    : ""
              }
            >
              <CardContent className={classNames.dayView196}>
                <div className={classNames.dayView197}>
                  <div className={classNames.examViewEndsem329}>
                    <span className={classNames.dayView220}>
                      <CalendarIcon className={classNames.setupModal75} />
                      <span className={classNames.dayView199}>{formatDate(exam.date)}</span>
                    </span>
                    <span className={classNames.examViewEndsem330}>
                      <ClockIcon className={classNames.setupModal75} />
                      {exam.startTime} &ndash; {exam.endTime}
                    </span>
                  </div>
                  <Separator orientation="vertical" className={classNames.dayView201} />
                  <div className={classNames.setupModal65}>
                    <div className={classNames.home18}>
                      <p className={classNames.examViewEndsem331}>{courseName}</p>
                      {isUnconfiguredElective && exam.electiveType && (
                        <Badge variant="outline" className={classNames.dayView207}>
                          {exam.electiveType}
                        </Badge>
                      )}
                    </div>
                    {courseCode && <p className={classNames.setupModal60}>{courseCode}</p>}
                  </div>
                  <Badge
                    variant={
                      status === "today" ? "default" : status === "past" ? "secondary" : "outline"
                    }
                    className={classNames.dayView207}
                  >
                    {status === "today"
                      ? "Today"
                      : status === "past"
                        ? "Completed"
                        : `${daysRemaining}d`}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
