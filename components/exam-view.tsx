"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Course, ExamEntry, midSemesterExams } from "@/lib/timetable-data";
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
    const todayStr = now.getFullYear() + "-" +
        String(now.getMonth() + 1).padStart(2, "0") + "-" +
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
    const pe2Selection = getSelectedElective("PE-2");
    const isCRA4402 = pe2Selection?.code === "CRA 4402";

    const allExams = React.useMemo(() => {
        let exams = [...midSemesterExams];
        if (isCRA4402) {
            exams = exams.filter((e) => e.electiveType !== "PE-2");
            exams.push({
                courseAbbreviation: "PE-2",
                courseCode: "CRA 4402",
                courseName: pe2Selection!.name,
                date: "2026-03-26",
                startTime: "17:00",
                endTime: "18:00",
                isElective: true,
                electiveType: "PE-2",
            });
        }
        return exams.sort((a, b) => a.date.localeCompare(b.date));
    }, [isCRA4402, pe2Selection]);

    // Compute statuses client-side to avoid hydration mismatch with server-rendered dates
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    const examStatuses = allExams.map((exam) =>
        mounted ? getExamStatus(exam.date, exam.endTime) : "upcoming" as const
    );
    const highlightIdx = mounted ? examStatuses.findIndex((s) => s !== "past") : -1;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="space-y-1 px-1">
                <div className="flex items-center gap-2">
                    <BookOpenIcon className="size-5 text-primary" weight="fill" />
                    <h2 className="text-lg font-semibold">Mid Semester Exams</h2>
                </div>
                <p className="text-xs text-muted-foreground">March 2026 &middot; 2:15 PM &ndash; 3:45 PM</p>
            </div>

            {/* Exam list */}
            <div className="space-y-2">
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
                                    ? "opacity-50"
                                    : isHighlighted
                                      ? "ring-2 ring-primary bg-primary/5"
                                      : ""
                            }
                        >
                            <CardContent className="py-2">
                                <div className="flex items-center gap-3">
                                    <div className="text-xs text-muted-foreground w-24 shrink-0 flex flex-col items-start gap-0.5">
                                        <span className="flex items-center gap-1">
                                            <CalendarIcon className="size-3" />
                                            <span className="font-mono">
                                                {formatDate(exam.date)}
                                            </span>
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px]">
                                            <ClockIcon className="size-3" />
                                            {exam.startTime} &ndash; {exam.endTime}
                                        </span>
                                    </div>
                                    <Separator orientation="vertical" className="h-10" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium truncate">
                                                {courseName}
                                            </p>
                                            {isUnconfiguredElective && exam.electiveType && (
                                                <Badge variant="outline" className="shrink-0">
                                                    {exam.electiveType}
                                                </Badge>
                                            )}
                                        </div>
                                        {courseCode && (
                                            <p className="text-[10px] text-muted-foreground">
                                                {courseCode}
                                            </p>
                                        )}
                                    </div>
                                    <Badge
                                        variant={
                                            status === "today"
                                                ? "default"
                                                : status === "past"
                                                  ? "secondary"
                                                  : "outline"
                                        }
                                        className="shrink-0"
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
