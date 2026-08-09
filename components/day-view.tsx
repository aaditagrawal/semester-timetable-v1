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
  daySchedules,
  dayIndex,
  Day,
  courses,
  isPeriodPassed,
  isPeriodActive,
  Course,
  ElectiveType,
  isStudentProject,
  LabBatch,
  timeToMinutes,
  type NowSnapshot,
} from "@/lib/timetable-data";
import { UserElectiveSelections, TileLabelMode } from "@/lib/hooks/use-timetable";
import { SunIcon, MoonIcon, PlusIcon, ClockIcon, MapPinIcon } from "@phosphor-icons/react";

interface DayViewProps {
  day: Day;
  /** The clock reduced to a weekday and a minute-of-day; see `snapshotNow`. */
  now: NowSnapshot;
  selections: UserElectiveSelections;
  /** Every basket's resolved course, already looked up. */
  selectedElectives: Record<ElectiveType, Course | null>;
  labBatch: LabBatch | null;
  onConfigureElective?: () => void;
  showRoom?: boolean;
  labelMode?: TileLabelMode;
}

interface ClassEntry {
  course: Course | null;
  electiveType?: ElectiveType;
  isUnconfigured?: boolean;
  timeSlot: string;
  startTime: string;
  endTime: string;
  /** Start, in minutes from midnight — what the ordering and the day split use. */
  startMin: number;
  isActive: boolean;
  isPassed: boolean;
  isLab: boolean;
  room?: string;
  durationSlots?: number;
}

// Calculate how many slots a class spans based on its end time
function calculateDurationSlots(startSlotIndex: number, endMin: number): number {
  let slots = 1;

  for (let i = startSlotIndex + 1; i < timeSlots.length; i++) {
    // If the class ends at or after this slot's end, include it
    if (endMin >= timeSlots[i].startMin) {
      slots++;
    }
    // If the class ends before or at this slot's end, stop
    if (endMin <= timeSlots[i].endMin) {
      break;
    }
  }

  return slots;
}

/** Noon, in minutes from midnight — where the day splits into morning and afternoon. */
const NOON = 12 * 60;

export function DayView({
  day,
  now,
  selections,
  selectedElectives,
  labBatch,
  onConfigureElective,
  showRoom = false,
  labelMode = "abbreviation",
}: DayViewProps) {
  /**
   * The day's classes, derived only when something that shapes them moves.
   *
   * This ran on every render — and under the old one-second clock, that meant
   * every second. It walked `weekSchedule[day]` with `Object.entries`,
   * `parseInt`-ed each key back into the number it started as, then sorted the
   * result with a comparator that re-split both time strings on every single
   * comparison. `daySchedules` is already the non-empty periods in slot order,
   * so the walk is direct and the sort has nothing left to do for the ordinary
   * case; it stays only because a lab's `timeOverride` can move a period out
   * of slot order, and it now sorts on an integer the entry already carries.
   */
  const {
    morningClasses,
    afternoonClasses,
    activeClass,
    nextClass,
    unconfiguredCount,
    hasClasses,
  } = React.useMemo(() => {
    const index = dayIndex[day];
    const classEntries: ClassEntry[] = [];
    const processedSlots = new Set<number>();

    for (const { slotIndex, slot, entry } of daySchedules[day]) {
      if (processedSlots.has(slotIndex)) continue;

      let startTime = slot.start;
      let endTime = slot.end;
      let startMin = slot.startMin;
      let endMin = slot.endMin;

      // Handle labs with batch-specific assignment
      if (entry.isLab && entry.labInfo && labBatch) {
        if (entry.labInfo.timeOverride) {
          startTime = entry.labInfo.timeOverride.start;
          endTime = entry.labInfo.timeOverride.end;
          startMin = timeToMinutes(startTime);
          endMin = timeToMinutes(endTime);
        }

        // Get the lab for user's batch
        const batchLab = entry.labInfo[labBatch];
        const labCourse = courses[batchLab.course];

        if (labCourse) {
          classEntries.push({
            course: { ...labCourse, room: batchLab.room },
            timeSlot: `${startTime} - ${endTime}`,
            startTime,
            endTime,
            startMin,
            isActive: isPeriodActive(startMin, endMin, now, index),
            isPassed: isPeriodPassed(endMin, now, index),
            isLab: true,
            room: batchLab.room,
            durationSlots: calculateDurationSlots(slotIndex, endMin),
          });
        }

        // Mark subsequent lab slots as processed
        for (let i = slotIndex + 1; i < timeSlots.length; i++) {
          if (
            timeSlots[i].startMin < endMin ||
            (weekSchedule[day][i] === null && i < slotIndex + 3)
          ) {
            processedSlots.add(i);
          }
        }
        continue;
      }

      // Handle electives (show even if not configured)
      if (entry.isElective && entry.electiveType) {
        const electiveType: ElectiveType = entry.electiveType;

        // Traded for the student project: a free period, so neither a class
        // nor a gap to prompt about — leave it out of the day entirely.
        if (isStudentProject(electiveType, selections[electiveType])) continue;

        const course = selectedElectives[electiveType];
        classEntries.push({
          course,
          electiveType,
          isUnconfigured: !course,
          timeSlot: `${startTime} - ${endTime}`,
          startTime,
          endTime,
          startMin,
          isActive: course ? isPeriodActive(startMin, endMin, now, index) : false,
          isPassed: isPeriodPassed(endMin, now, index),
          isLab: false,
        });
        continue;
      }

      // Handle regular courses
      const course = courses[entry.courseAbbreviation];
      if (course) {
        classEntries.push({
          course,
          timeSlot: `${startTime} - ${endTime}`,
          startTime,
          endTime,
          startMin,
          isActive: isPeriodActive(startMin, endMin, now, index),
          isPassed: isPeriodPassed(endMin, now, index),
          isLab: false,
        });
      }
    }

    // Sort by start time
    classEntries.sort((a, b) => a.startMin - b.startMin);

    return {
      morningClasses: classEntries.filter((c) => c.startMin < NOON),
      afternoonClasses: classEntries.filter((c) => c.startMin >= NOON),
      hasClasses: classEntries.length > 0,
      activeClass: classEntries.find((c) => c.isActive && c.course),
      nextClass: classEntries.find((c) => !c.isPassed && !c.isActive && c.course),
      unconfiguredCount: classEntries.reduce((count, c) => count + (c.isUnconfigured ? 1 : 0), 0),
    };
  }, [day, now, selections, selectedElectives, labBatch]);

  const renderClassCard = (entry: ClassEntry, idx: number) => {
    if (entry.isUnconfigured && entry.electiveType) {
      // Unconfigured elective - show prominent add prompt
      return (
        <Card
          key={idx}
          size="sm"
          className={`border-dashed border-2 border-muted-foreground/30 bg-muted/10 ${entry.isPassed ? "opacity-40" : ""}`}
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
                  <Badge variant="outline" className="mb-1">
                    {entry.electiveType}
                  </Badge>
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
      <Card
        key={idx}
        size="sm"
        className={entry.isActive ? "ring-2 ring-primary bg-primary/5" : ""}
      >
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
                showRoom={showRoom}
                labelMode={labelMode}
              />
            </div>
            {entry.isActive && (
              <Badge variant="default" className="shrink-0">
                NOW
              </Badge>
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
                  {unconfiguredCount} elective{unconfiguredCount > 1 ? "s" : ""} not configured
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
                {afternoonClasses.map((entry, idx) =>
                  renderClassCard(entry, morningClasses.length + idx),
                )}
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
