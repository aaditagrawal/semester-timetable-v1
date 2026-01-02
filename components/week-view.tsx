"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CourseTile } from "@/components/course-tile";
import { Badge } from "@/components/ui/badge";
import {
    timeSlots,
    weekSchedule,
    days,
    Day,
    courses,
    isSlotPassed,
    isSlotActive,
    Course,
    LabBatch,
} from "@/lib/timetable-data";
import { UserElectiveSelections } from "@/lib/hooks/use-timetable";

interface WeekViewProps {
    currentTime: Date;
    selections: UserElectiveSelections;
    getSelectedElective: (type: "PE-1" | "PE-2" | "OE" | "FC-2") => Course | null;
    labBatch: LabBatch | null;
    onConfigureElective?: () => void;
}

export function WeekView({
    currentTime,
    selections,
    getSelectedElective,
    labBatch,
    onConfigureElective,
}: WeekViewProps) {
    const currentDay = currentTime.getDay();
    const currentDayName = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][
        currentDay
    ] as Day;

    // Helper to render a cell
    const renderCell = (day: Day, slotIndex: number) => {
        const entry = weekSchedule[day]?.[slotIndex];
        const slot = timeSlots[slotIndex];

        if (!entry) {
            return <div className="h-full min-h-[44px] bg-muted/5" />;
        }

        let course: Course | null = null;
        let startTime = slot.start;
        let endTime = slot.end;
        let isLab = false;

        if (entry.isLab && entry.labInfo && labBatch) {
            if (entry.labInfo.timeOverride) {
                startTime = entry.labInfo.timeOverride.start;
                endTime = entry.labInfo.timeOverride.end;
            }
            const batchLab = entry.labInfo[labBatch];
            const labCourse = courses[batchLab.course];
            if (labCourse) {
                course = { ...labCourse, room: batchLab.room };
                isLab = true;
            }
        } else if (entry.isElective && entry.electiveType) {
            course = getSelectedElective(entry.electiveType);
            const isPassed = isSlotPassed(endTime, currentTime, day);

            if (!course) {
                // Show unconfigured elective placeholder
                return (
                    <div
                        className={cn(
                            "h-full min-h-[44px] flex flex-col items-center justify-center bg-muted/20 border border-dashed border-muted-foreground/20 cursor-pointer hover:bg-muted/30 transition-colors",
                            isPassed && "opacity-40"
                        )}
                        onClick={onConfigureElective}
                    >
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                            {entry.electiveType}
                        </Badge>
                    </div>
                );
            }
        } else {
            course = courses[entry.courseAbbreviation];
        }

        if (!course) {
            return <div className="h-full min-h-[44px] bg-muted/5" />;
        }

        const isPassed = isSlotPassed(endTime, currentTime, day);
        const isActive = isSlotActive(startTime, endTime, currentTime, day);

        return (
            <CourseTile
                course={course}
                timeSlot={`${startTime} - ${endTime}`}
                isActive={isActive}
                isPassed={isPassed}
                isLab={isLab}
                className="h-full"
            />
        );
    };

    return (
        <div className="overflow-x-auto -mx-4 px-4 pb-4">
            <div className="min-w-[700px]">
                {/* Grid */}
                <div className="grid grid-cols-[56px_repeat(6,1fr)] gap-px bg-border/30">
                    {/* Header row */}
                    <div className="bg-background p-2" />
                    {days.map((day) => (
                        <div
                            key={day}
                            className={cn(
                                "bg-background p-2 text-center text-xs font-medium",
                                day === currentDayName && "bg-primary/10 text-primary"
                            )}
                        >
                            {day}
                        </div>
                    ))}

                    {/* Time slot rows */}
                    {timeSlots.map((slot, slotIndex) => (
                        <React.Fragment key={slot.label}>
                            {/* Time label */}
                            <div className="bg-background p-1.5 text-[10px] text-muted-foreground flex items-center justify-center">
                                <span className="leading-tight text-center font-mono">
                                    {slot.start}
                                </span>
                            </div>

                            {/* Day cells */}
                            {days.map((day) => (
                                <div
                                    key={`${day}-${slotIndex}`}
                                    className={cn(
                                        "bg-background",
                                        day === currentDayName && "bg-primary/5"
                                    )}
                                >
                                    {renderCell(day, slotIndex)}
                                </div>
                            ))}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
}
