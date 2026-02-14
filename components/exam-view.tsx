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

function getDateStatus(dateStr: string): "past" | "today" | "upcoming" {
    const today = new Date();
    const todayStr = today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, "0") + "-" +
        String(today.getDate()).padStart(2, "0");

    if (dateStr < todayStr) return "past";
    if (dateStr === todayStr) return "today";
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
    const sortedExams = [...midSemesterExams].sort((a, b) =>
        a.date.localeCompare(b.date)
    );

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
                {sortedExams.map((exam, idx) => {
                    const status = getDateStatus(exam.date);
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
                                    : status === "today"
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
