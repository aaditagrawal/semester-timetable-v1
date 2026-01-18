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
    timeToMinutes,
} from "@/lib/timetable-data";
import { UserElectiveSelections } from "@/lib/hooks/use-timetable";

interface WeekViewProps {
    currentTime: Date;
    selections: UserElectiveSelections;
    getSelectedElective: (type: "PE-1" | "PE-2" | "OE" | "FC-2") => Course | null;
    labBatch: LabBatch | null;
    onConfigureElective?: () => void;
}

// Calculate how many slots a lab spans based on its timeOverride
function calculateLabRowSpan(startSlotIndex: number, endTime: string): number {
    const endMinutes = timeToMinutes(endTime);
    let rowSpan = 1;

    for (let i = startSlotIndex + 1; i < timeSlots.length; i++) {
        const slotEndMinutes = timeToMinutes(timeSlots[i].end);
        // If the lab ends at or after this slot's end, include it
        if (endMinutes >= timeToMinutes(timeSlots[i].start)) {
            rowSpan++;
        }
        // If the lab ends before or at this slot's end, stop
        if (endMinutes <= slotEndMinutes) {
            break;
        }
    }

    return rowSpan;
}

// Base height per minute for consistent sizing
const PIXELS_PER_MINUTE = 0.9;

// Calculate height in pixels based on actual duration
function calculateDurationHeight(startTime: string, endTime: string): number {
    const durationMinutes = timeToMinutes(endTime) - timeToMinutes(startTime);
    return Math.round(durationMinutes * PIXELS_PER_MINUTE);
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

    // Track which slots have been consumed by multi-slot labs
    // Key format: "DAY-slotIndex"
    const consumedSlots = React.useMemo(() => {
        const consumed = new Set<string>();

        days.forEach((day) => {
            const daySchedule = weekSchedule[day];
            if (!daySchedule) return;

            Object.entries(daySchedule).forEach(([slotIndexStr, entry]) => {
                const slotIndex = parseInt(slotIndexStr);
                if (!entry?.isLab || !entry.labInfo?.timeOverride || !labBatch) return;

                const endTime = entry.labInfo.timeOverride.end;
                const rowSpan = calculateLabRowSpan(slotIndex, endTime);

                // Mark slots after the first one as consumed
                for (let i = 1; i < rowSpan; i++) {
                    consumed.add(`${day}-${slotIndex + i}`);
                }
            });
        });

        return consumed;
    }, [labBatch]);

    // Helper to render a cell
    const renderCell = (day: Day, slotIndex: number): { element: React.ReactNode; rowSpan: number; height?: number } | null => {
        // Skip if this slot is consumed by a previous lab
        if (consumedSlots.has(`${day}-${slotIndex}`)) {
            return null;
        }

        const entry = weekSchedule[day]?.[slotIndex];
        const slot = timeSlots[slotIndex];

        if (!entry) {
            return { element: <div className="h-full min-h-[44px] bg-muted/5" />, rowSpan: 1 };
        }

        let course: Course | null = null;
        let startTime = slot.start;
        let endTime = slot.end;
        let isLab = false;
        let rowSpan = 1;
        let durationHeight: number | undefined;

        if (entry.isLab && entry.labInfo && labBatch) {
            if (entry.labInfo.timeOverride) {
                startTime = entry.labInfo.timeOverride.start;
                endTime = entry.labInfo.timeOverride.end;
                rowSpan = calculateLabRowSpan(slotIndex, endTime);
                durationHeight = calculateDurationHeight(startTime, endTime);
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
                return {
                    element: (
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
                    ),
                    rowSpan: 1,
                };
            }
        } else {
            course = courses[entry.courseAbbreviation];
        }

        if (!course) {
            return { element: <div className="h-full min-h-[44px] bg-muted/5" />, rowSpan: 1 };
        }

        const isPassed = isSlotPassed(endTime, currentTime, day);
        const isActive = isSlotActive(startTime, endTime, currentTime, day);

        return {
            element: (
                <CourseTile
                    course={course}
                    timeSlot={`${startTime} - ${endTime}`}
                    isActive={isActive}
                    isPassed={isPassed}
                    isLab={isLab}
                    className="h-full"
                    durationSlots={rowSpan}
                />
            ),
            rowSpan,
            height: durationHeight,
        };
    };

    return (
        <div className="overflow-x-auto -mx-4 px-4 pb-4">
            <div className="min-w-[700px]">
                {/* Grid - using table for proper row spanning */}
                <table className="w-full border-collapse" style={{ borderSpacing: '1px', background: 'hsl(var(--border) / 0.3)' }}>
                    <thead>
                        <tr>
                            <th className="bg-background p-2 w-14" />
                            {days.map((day) => (
                                <th
                                    key={day}
                                    className={cn(
                                        "bg-background p-2 text-center text-xs font-medium",
                                        day === currentDayName && "bg-primary/10 text-primary"
                                    )}
                                >
                                    {day}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {timeSlots.map((slot, slotIndex) => (
                            <tr key={slot.label}>
                                {/* Time label */}
                                <td className="bg-background p-1.5 text-[10px] text-muted-foreground text-center">
                                    <span className="leading-tight font-mono">
                                        {slot.start}
                                    </span>
                                </td>

                                {/* Day cells */}
                                {days.map((day) => {
                                    const cell = renderCell(day, slotIndex);
                                    if (cell === null) {
                                        // Slot is consumed by a lab - don't render
                                        return null;
                                    }

                                    // For multi-slot cells, use duration-based height if available
                                    // Otherwise fall back to row-based calculation
                                    const cellHeight = cell.rowSpan > 1
                                        ? { height: cell.height ? `${cell.height}px` : `${44 * cell.rowSpan + (cell.rowSpan - 1)}px` }
                                        : undefined;

                                    return (
                                        <td
                                            key={`${day}-${slotIndex}`}
                                            rowSpan={cell.rowSpan}
                                            style={cellHeight}
                                            className={cn(
                                                "bg-background p-0",
                                                day === currentDayName && "bg-primary/5"
                                            )}
                                        >
                                            {cell.element}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
