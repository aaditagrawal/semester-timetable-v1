"use client";

import { classNames } from "@/ui.stylex";

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
          className={` ${classNames.dayView195} ${entry.isPassed ? classNames.dayView194 : ""}`}
        >
          <CardContent className={classNames.dayView196}>
            <div className={classNames.dayView197}>
              <div className={classNames.dayView198}>
                <span className={classNames.dayView199}>{entry.startTime}</span>
                <span className={classNames.dayView200}>to {entry.endTime}</span>
              </div>
              <Separator orientation="vertical" className={classNames.dayView201} />
              <div className={classNames.dayView202}>
                <div>
                  <Badge variant="outline" className={classNames.dayView203}>
                    {entry.electiveType}
                  </Badge>
                  <p className={classNames.home22}>Not configured</p>
                </div>
                {onConfigureElective && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onConfigureElective}
                    className={classNames.dayView204}
                  >
                    <PlusIcon className={classNames.setupModal75} />
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
      <Card key={idx} size="sm" className={entry.isActive ? classNames.dayView205 : ""}>
        <CardContent className={classNames.dayView196}>
          <div className={classNames.dayView197}>
            <div className={classNames.dayView198}>
              <span className={classNames.dayView199}>{entry.startTime}</span>
              <span className={classNames.dayView200}>to {entry.endTime}</span>
            </div>
            <Separator orientation="vertical" className={classNames.dayView201} />
            <div className={classNames.setupModal78}>
              <CourseTile
                course={entry.course}
                timeSlot={entry.timeSlot}
                isActive={entry.isActive}
                isPassed={entry.isPassed}
                isLab={entry.isLab}
                className={classNames.dayView206}
                durationSlots={entry.durationSlots}
                showRoom={showRoom}
                labelMode={labelMode}
              />
            </div>
            {entry.isActive && (
              <Badge variant="default" className={classNames.dayView207}>
                NOW
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={classNames.home17}>
      {/* Alert for unconfigured electives */}
      {unconfiguredCount > 0 && onConfigureElective && (
        <Card className={classNames.dayView208}>
          <CardContent className={classNames.dayView209}>
            <div className={classNames.dayView210}>
              <div>
                <p className={classNames.dayView211}>
                  {unconfiguredCount} elective{unconfiguredCount > 1 ? "s" : ""} not configured
                </p>
                <p className={classNames.dayView212}>
                  Add your course details to see full schedule
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onConfigureElective}
                className={classNames.dayView213}
              >
                <PlusIcon className={classNames.setupModal80} />
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current/Next class highlight */}
      {activeClass && activeClass.course && (
        <Card className={classNames.dayView214}>
          <CardContent className={classNames.dayView215}>
            <div className={classNames.dayView216}>
              <div className={classNames.dayView217}>
                <div className={classNames.home18}>
                  <Badge variant="default">LIVE</Badge>
                  <span className={classNames.setupModal60}>{activeClass.timeSlot}</span>
                </div>
                <p className={classNames.dayView218}>{activeClass.course.name}</p>
                <div className={classNames.dayView219}>
                  {activeClass.course.room && (
                    <span className={classNames.dayView220}>
                      <MapPinIcon className={classNames.setupModal75} />
                      {activeClass.course.room}
                    </span>
                  )}
                  <span className={classNames.dayView220}>
                    <ClockIcon className={classNames.setupModal75} />
                    {activeClass.course.abbreviation}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!activeClass && nextClass && nextClass.course && (
        <Card className={classNames.dayView221}>
          <CardContent className={classNames.dayView209}>
            <div className={classNames.dayView216}>
              <div className={classNames.dayView222}>
                <div className={classNames.home18}>
                  <Badge variant="secondary">NEXT UP</Badge>
                  <span className={classNames.setupModal60}>{nextClass.timeSlot}</span>
                </div>
                <p className={classNames.home20}>{nextClass.course.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Classes list */}
      {hasClasses ? (
        <div className={classNames.dayView223}>
          {/* Morning */}
          {morningClasses.length > 0 && (
            <div className={classNames.home13}>
              <div className={classNames.dayView224}>
                <SunIcon className={classNames.setupModal53} weight="fill" />
                <span className={classNames.dayView225}>Morning</span>
                <Separator className={classNames.setupModal78} />
              </div>
              <div className={classNames.home13}>
                {morningClasses.map((entry, idx) => renderClassCard(entry, idx))}
              </div>
            </div>
          )}

          {/* Afternoon */}
          {afternoonClasses.length > 0 && (
            <div className={classNames.home13}>
              <div className={classNames.dayView224}>
                <MoonIcon className={classNames.setupModal53} weight="fill" />
                <span className={classNames.dayView225}>Afternoon</span>
                <Separator className={classNames.setupModal78} />
              </div>
              <div className={classNames.home13}>
                {afternoonClasses.map((entry, idx) =>
                  renderClassCard(entry, morningClasses.length + idx),
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className={classNames.dayView226}>
            <p className={classNames.dayView227}>No classes today</p>
            <p className={classNames.dayView228}>Enjoy your day off! 🎉</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
