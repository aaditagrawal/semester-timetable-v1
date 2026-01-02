"use client";

import * as React from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Course } from "@/lib/timetable-data";
import { MapPinIcon, UserIcon, BookIcon, ClockIcon } from "@phosphor-icons/react";

interface CourseDetailProps {
    course: Course;
    timeSlot?: string;
    isActive?: boolean;
    isPassed?: boolean;
    children: React.ReactNode;
}

export function CourseDetail({
    course,
    timeSlot,
    isActive,
    isPassed,
    children,
}: CourseDetailProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
            <DropdownMenuContent
                align="center"
                className="w-72"
                sideOffset={8}
            >
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{course.abbreviation}</span>
                    <div className="flex gap-1">
                        {isActive && (
                            <Badge variant="default" className="text-[10px] h-4">
                                LIVE
                            </Badge>
                        )}
                        {isPassed && (
                            <Badge variant="secondary" className="text-[10px] h-4">
                                DONE
                            </Badge>
                        )}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="px-2 py-2 space-y-3">
                    {/* Course name */}
                    <div className="flex items-start gap-2">
                        <BookIcon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-medium">{course.name}</p>
                            <p className="text-[10px] text-muted-foreground">{course.code}</p>
                        </div>
                    </div>

                    {/* Time slot */}
                    {timeSlot && (
                        <div className="flex items-center gap-2">
                            <ClockIcon className="size-4 text-muted-foreground shrink-0" />
                            <p className="text-xs">{timeSlot}</p>
                        </div>
                    )}

                    {/* Room */}
                    {course.room && (
                        <div className="flex items-center gap-2">
                            <MapPinIcon className="size-4 text-muted-foreground shrink-0" />
                            <p className="text-xs">{course.room}</p>
                        </div>
                    )}

                    {/* Faculty */}
                    <div className="flex items-start gap-2">
                        <UserIcon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                            {course.faculty.map((f, idx) => (
                                <p key={idx} className="text-xs">
                                    {f.name}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
