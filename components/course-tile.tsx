"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CourseDetail } from "@/components/course-detail";
import { Course } from "@/lib/timetable-data";
import { Badge } from "@/components/ui/badge";

interface CourseTileProps {
    course: Course;
    timeSlot: string;
    isActive?: boolean;
    isPassed?: boolean;
    isLab?: boolean;
    className?: string;
    /** Number of time slots this class spans - affects height proportionally */
    durationSlots?: number;
}

export function CourseTile({
    course,
    timeSlot,
    isActive = false,
    isPassed = false,
    isLab = false,
    className,
    durationSlots = 1,
}: CourseTileProps) {
    // Base height is 44px per slot, with some extra for multi-slot items
    const heightStyle = durationSlots > 1
        ? { minHeight: `${44 * durationSlots + (durationSlots - 1) * 4}px` }
        : undefined;

    const baseClasses = cn(
        "group relative flex items-center justify-center px-2 py-2 min-h-[44px] text-xs font-medium transition-all duration-200 cursor-pointer select-none",
        "hover:bg-accent active:scale-[0.98]",
        className
    );

    const stateClasses = cn(
        // Default state
        "bg-card ring-1 ring-foreground/10",
        // Passed state - grayed out
        isPassed && "opacity-40 bg-muted/50 text-muted-foreground",
        // Active state - highlighted border
        isActive && "ring-2 ring-primary bg-primary/10 opacity-100"
    );

    return (
        <CourseDetail
            course={course}
            timeSlot={timeSlot}
            isActive={isActive}
            isPassed={isPassed}
        >
            <div
                className={cn(baseClasses, stateClasses, "flex-col gap-0.5")}
                style={heightStyle}
            >
                <span className="font-semibold">{course.abbreviation}</span>
                {isLab && (
                    <Badge variant="secondary" className="text-[9px] h-3.5 px-1">
                        LAB
                    </Badge>
                )}
            </div>
        </CourseDetail>
    );
}
