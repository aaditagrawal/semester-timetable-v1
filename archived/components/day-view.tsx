"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CourseTile } from "@/components/course-tile";
import {
    timeSlots,
    weekSchedule,
    Day,
    courses,
    isSlotPassed,
    isSlotActive,
    Course,
    LabBatch,
    timeToMinutes,
} from "@/lib/timetable-data";
import { UserElectiveSelections } from "@/lib/hooks/use-timetable";
import { SunIcon, MoonIcon, PlusIcon, ClockIcon, MapPinIcon } from "@phosphor-icons/react";

interface DayViewProps {
    day: Day;
    currentTime: Date;
    selections: UserElectiveSelections;
    getSelectedElective: (type: "PE-1" | "PE-2" | "OE" | "FC-2") => Course | null;
    labBatch: LabBatch | null;
    onConfigureElective?: () => void;
}

interface ClassEntry {
    course: Course | null;
    electiveType?: "PE-1" | "PE-2" | "OE" | "FC-2";
    isUnconfigured?: boolean;
    timeSlot: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
    isPassed: boolean;
    isLab: boolean;
    room?: string;
    durationSlots?: number;
}

// Calculate how many slots a class spans based on its end time
function calculateDurationSlots(startSlotIndex: number, endTime: string): number {
    const endMinutes = timeToMinutes(endTime);
    let slots = 1;

    for (let i = startSlotIndex + 1; i < timeSlots.length; i++) {
        const slotEndMinutes = timeToMinutes(timeSlots[i].end);
        // If the class ends at or after this slot's end, include it
        if (endMinutes >= timeToMinutes(timeSlots[i].start)) {
            slots++;
        }
        // If the class ends before or at this slot's end, stop
        if (endMinutes <= slotEndMinutes) {
            break;
        }
    }

    return slots;
}

export function DayView({
    day,
    currentTime,
    selections,
    getSelectedElective,
    labBatch,
    onConfigureElective,
}: DayViewProps) {
    const daySchedule = weekSchedule[day];

    // Build list of classes for the day
    const classEntries: ClassEntry[] = [];
    const processedSlots = new Set<number>();

    Object.entries(daySchedule).forEach(([slotIndexStr, entry]) => {
        const slotIndex = parseInt(slotIndexStr);

        if (!entry || processedSlots.has(slotIndex)) return;

        const slot = timeSlots[slotIndex];
        let startTime = slot.start;
        let endTime = slot.end;

        // Handle labs with batch-specific assignment
        if (entry.isLab && entry.labInfo && labBatch) {
            if (entry.labInfo.timeOverride) {
                startTime = entry.labInfo.timeOverride.start;
                endTime = entry.labInfo.timeOverride.end;
            }

            // Get the lab for user's batch
            const batchLab = entry.labInfo[labBatch];
            const labCourse = courses[batchLab.course];

            if (labCourse) {
                const durationSlots = calculateDurationSlots(slotIndex, endTime);
                classEntries.push({
                    course: { ...labCourse, room: batchLab.room },
                    timeSlot: `${startTime} - ${endTime}`,
                    startTime,
                    endTime,
                    isActive: isSlotActive(startTime, endTime, currentTime, day),
                    isPassed: isSlotPassed(endTime, currentTime, day),
                    isLab: true,
                    room: batchLab.room,
                    durationSlots,
                });
            }

            // Mark subsequent lab slots as processed
            for (let i = slotIndex + 1; i < timeSlots.length; i++) {
                const nextSlot = timeSlots[i];
                if (
                    nextSlot.start < endTime ||
                    (daySchedule[i] === null && i < slotIndex + 3)
                ) {
                    processedSlots.add(i);
                }
            }
            return;
        }

        // Handle electives (show even if not configured)
        if (entry.isElective && entry.electiveType) {
            const course = getSelectedElective(entry.electiveType);
            classEntries.push({
                course,
                electiveType: entry.electiveType,
                isUnconfigured: !course,
                timeSlot: `${startTime} - ${endTime}`,
                startTime,
                endTime,
                isActive: course ? isSlotActive(startTime, endTime, currentTime, day) : false,
                isPassed: isSlotPassed(endTime, currentTime, day),
                isLab: false,
            });
            return;
        }

        // Handle regular courses
        const course = courses[entry.courseAbbreviation];
        if (course) {
            classEntries.push({
                course,
                timeSlot: `${startTime} - ${endTime}`,
                startTime,
                endTime,
                isActive: isSlotActive(startTime, endTime, currentTime, day),
                isPassed: isSlotPassed(endTime, currentTime, day),
                isLab: false,
            });
        }
    });

    // Sort by start time
    classEntries.sort((a, b) => {
        const aMinutes =
            parseInt(a.startTime.split(":")[0]) * 60 +
            parseInt(a.startTime.split(":")[1]);
        const bMinutes =
            parseInt(b.startTime.split(":")[0]) * 60 +
            parseInt(b.startTime.split(":")[1]);
        return aMinutes - bMinutes;
    });

    const morningClasses = classEntries.filter((c) => {
        const hour = parseInt(c.startTime.split(":")[0]);
        return hour < 12;
    });

    const afternoonClasses = classEntries.filter((c) => {
        const hour = parseInt(c.startTime.split(":")[0]);
        return hour >= 12;
    });

    const hasClasses = classEntries.length > 0;
    const activeClass = classEntries.find((c) => c.isActive && c.course);
    const nextClass = classEntries.find((c) => !c.isPassed && !c.isActive && c.course);
    const unconfiguredCount = classEntries.filter((c) => c.isUnconfigured).length;

    const renderClassCard = (entry: ClassEntry, idx: number) => {
        if (entry.isUnconfigured && entry.electiveType) {
            // Unconfigured elective - show prominent add prompt
            return (
                <Card
                    key={idx}
                    size="sm"
                    className={`border-dashed border-2 border-muted-foreground/30 bg-muted/10 ${entry.isPassed ? 'opacity-40' : ''}`}
                >
                    <CardContent className="py-2">
                        <div className="flex items-center gap-3">
                            <div className="text-xs text-muted-foreground w-24 shrink-0 flex flex-col">
                                <span className="font-mono">{entry.startTime}</span>
                                <span className="text-[10px]">to {entry.endTime}</span>
                            </div>
                            <Separator orientation="vertical" className="h-10" />
                            <div className="flex-1 flex items-center justify-between">
                                <div>
                                    <Badge variant="outline" className="mb-1">{entry.electiveType}</Badge>
                                    <p className="text-xs text-muted-foreground">Not configured</p>
                                </div>
                                {onConfigureElective && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onConfigureElective}
                                        className="gap-1"
                                    >
                                        <PlusIcon className="size-3" />
                                        Add
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        if (!entry.course) return null;

        return (
            <Card key={idx} size="sm" className={entry.isActive ? 'ring-2 ring-primary bg-primary/5' : ''}>
                <CardContent className="py-2">
                    <div className="flex items-center gap-3">
                        <div className="text-xs text-muted-foreground w-24 shrink-0 flex flex-col">
                            <span className="font-mono">{entry.startTime}</span>
                            <span className="text-[10px]">to {entry.endTime}</span>
                        </div>
                        <Separator orientation="vertical" className="h-10" />
                        <div className="flex-1">
                            <CourseTile
                                course={entry.course}
                                timeSlot={entry.timeSlot}
                                isActive={entry.isActive}
                                isPassed={entry.isPassed}
                                isLab={entry.isLab}
                                className="min-h-10"
                                durationSlots={entry.durationSlots}
                            />
                        </div>
                        {entry.isActive && (
                            <Badge variant="default" className="shrink-0">NOW</Badge>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-4">
            {/* Alert for unconfigured electives */}
            {unconfiguredCount > 0 && onConfigureElective && (
                <Card className="bg-primary/10 border-primary/30">
                    <CardContent className="py-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-primary">
                                    {unconfiguredCount} elective{unconfiguredCount > 1 ? 's' : ''} not configured
                                </p>
                                <p className="text-[10px] text-primary/70">
                                    Add your course details to see full schedule
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onConfigureElective}
                                className="border-primary/50 text-primary hover:bg-primary/20"
                            >
                                <PlusIcon className="size-3 mr-1" />
                                Configure
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Current/Next class highlight */}
            {activeClass && activeClass.course && (
                <Card className="ring-2 ring-primary bg-gradient-to-r from-primary/10 to-primary/5">
                    <CardContent className="py-4">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant="default">LIVE</Badge>
                                    <span className="text-[10px] text-muted-foreground">{activeClass.timeSlot}</span>
                                </div>
                                <p className="text-sm font-semibold">{activeClass.course.name}</p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    {activeClass.course.room && (
                                        <span className="flex items-center gap-1">
                                            <MapPinIcon className="size-3" />
                                            {activeClass.course.room}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <ClockIcon className="size-3" />
                                        {activeClass.course.abbreviation}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {!activeClass && nextClass && nextClass.course && (
                <Card className="bg-muted/30">
                    <CardContent className="py-3">
                        <div className="flex items-start justify-between">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">NEXT UP</Badge>
                                    <span className="text-[10px] text-muted-foreground">{nextClass.timeSlot}</span>
                                </div>
                                <p className="text-sm font-medium">{nextClass.course.name}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Classes list */}
            {hasClasses ? (
                <div className="space-y-5">
                    {/* Morning */}
                    {morningClasses.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                                <SunIcon className="size-4" weight="fill" />
                                <span className="font-medium">Morning</span>
                                <Separator className="flex-1" />
                            </div>
                            <div className="space-y-2">
                                {morningClasses.map((entry, idx) => renderClassCard(entry, idx))}
                            </div>
                        </div>
                    )}

                    {/* Afternoon */}
                    {afternoonClasses.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                                <MoonIcon className="size-4" weight="fill" />
                                <span className="font-medium">Afternoon</span>
                                <Separator className="flex-1" />
                            </div>
                            <div className="space-y-2">
                                {afternoonClasses.map((entry, idx) => renderClassCard(entry, morningClasses.length + idx))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground text-sm mb-1">No classes today</p>
                        <p className="text-xs text-muted-foreground/70">Enjoy your day off! 🎉</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
