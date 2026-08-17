"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CourseTile } from "@/components/course-tile";
import { Badge } from "@/components/ui/badge";
import {
  timeSlots,
  weekSchedule,
  days,
  dayIndex,
  Day,
  courses,
  isPeriodActive,
  isPeriodPassed,
  Course,
  ElectiveType,
  isStudentProject,
  LabBatch,
  timeToMinutes,
  type NowSnapshot,
} from "@/lib/timetable-data";
import { UserElectiveSelections, TileLabelMode } from "@/lib/hooks/use-timetable";

interface WeekViewProps {
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

// Calculate how many slots a lab spans based on its timeOverride
function calculateLabRowSpan(startSlotIndex: number, endMin: number): number {
  let rowSpan = 1;

  for (let i = startSlotIndex + 1; i < timeSlots.length; i++) {
    // If the lab ends at or after this slot's end, include it
    if (endMin >= timeSlots[i].startMin) {
      rowSpan++;
    }
    // If the lab ends before or at this slot's end, stop
    if (endMin <= timeSlots[i].endMin) {
      break;
    }
  }

  return rowSpan;
}

// Base height per minute for consistent sizing
const PIXELS_PER_MINUTE = 0.9;

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

/** An empty period. One element, shared by every blank cell in the grid. */
const BLANK_CELL = <div className="h-full min-h-[44px] bg-muted/5" />;

export function WeekView({
  now,
  selections,
  selectedElectives,
  labBatch,
  onConfigureElective,
  showRoom = false,
  labelMode = "abbreviation",
}: WeekViewProps) {
  // Kept as a `DayName`, not a `Day`: on Sunday this is "SUN", which the grid
  // has no column for, and every use below is an equality test against a `Day`
  // that simply never matches.
  const currentDayName = DAY_NAMES[now.dayOfWeek];

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

        const rowSpan = calculateLabRowSpan(
          slotIndex,
          timeToMinutes(entry.labInfo.timeOverride.end),
        );

        // Mark slots after the first one as consumed
        for (let i = 1; i < rowSpan; i++) {
          consumed.add(`${day}-${slotIndex + i}`);
        }
      });
    });

    return consumed;
  }, [labBatch]);

  /**
   * The whole grid, rebuilt only when something it depends on moves.
   *
   * Before, the 54 cells were re-derived on every render of the parent, which
   * under the old one-second clock meant every second. The dependency list
   * below is the honest answer to "what can change a cell": the minute, the
   * user's courses, the lab batch and the two display settings. Nothing else
   * in the app touches this grid.
   */
  const rows = React.useMemo(() => {
    const renderCell = (
      day: Day,
      slotIndex: number,
    ): { element: React.ReactNode; rowSpan: number; height?: number } | null => {
      // Skip if this slot is consumed by a previous lab
      if (consumedSlots.has(`${day}-${slotIndex}`)) {
        return null;
      }

      const entry = weekSchedule[day]?.[slotIndex];
      const slot = timeSlots[slotIndex];

      if (!entry) {
        return { element: BLANK_CELL, rowSpan: 1 };
      }

      const index = dayIndex[day];
      let course: Course | null = null;
      let startMin = slot.startMin;
      let endMin = slot.endMin;
      let startTime = slot.start;
      let endTime = slot.end;
      let isLab = false;
      let rowSpan = 1;
      let durationHeight: number | undefined;

      if (entry.isLab && entry.labInfo && labBatch) {
        if (entry.labInfo.timeOverride) {
          startTime = entry.labInfo.timeOverride.start;
          endTime = entry.labInfo.timeOverride.end;
          startMin = timeToMinutes(startTime);
          endMin = timeToMinutes(endTime);
          rowSpan = calculateLabRowSpan(slotIndex, endMin);
          durationHeight = Math.round((endMin - startMin) * PIXELS_PER_MINUTE);
        }
        const batchLab = entry.labInfo[labBatch];
        const labCourse = courses[batchLab.course];
        if (labCourse) {
          course = { ...labCourse, room: batchLab.room };
          isLab = true;
        }
      } else if (entry.isElective && entry.electiveType) {
        course = selectedElectives[entry.electiveType];

        // Traded for the student project the cell falls through to the same
        // blank an unscheduled period gets, rather than a dashed
        // placeholder inviting a course that is never coming.
        if (!course && !isStudentProject(entry.electiveType, selections[entry.electiveType])) {
          const isPassed = isPeriodPassed(endMin, now, index);
          // Show unconfigured elective placeholder
          return {
            element: (
              <div
                className={cn(
                  "h-full min-h-[44px] flex flex-col items-center justify-center bg-muted/20 border border-dashed border-muted-foreground/20 cursor-pointer hover:bg-muted/30 transition-colors",
                  isPassed && "opacity-40",
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
        return { element: BLANK_CELL, rowSpan: 1 };
      }

      return {
        element: (
          <CourseTile
            course={course}
            timeSlot={`${startTime} - ${endTime}`}
            isActive={isPeriodActive(startMin, endMin, now, index)}
            isPassed={isPeriodPassed(endMin, now, index)}
            isLab={isLab}
            className="h-full"
            durationSlots={rowSpan}
            showRoom={showRoom}
            labelMode={labelMode}
          />
        ),
        rowSpan,
        height: durationHeight,
      };
    };

    return timeSlots.map((slot, slotIndex) => ({
      slot,
      cells: days.map((day) => ({ day, cell: renderCell(day, slotIndex) })),
    }));
  }, [
    now,
    selections,
    selectedElectives,
    labBatch,
    consumedSlots,
    onConfigureElective,
    showRoom,
    labelMode,
  ]);

  return (
    <div className="overflow-x-auto -mx-4 px-4 pb-4">
      <div className="min-w-[700px]">
        {/* Grid - using table for proper row spanning */}
        <table
          className="w-full border-collapse"
          style={{ borderSpacing: "1px", background: "hsl(var(--border) / 0.3)" }}
        >
          <thead>
            <tr>
              <th className="bg-background p-2 w-14" />
              {days.map((day) => (
                <th
                  key={day}
                  className={cn(
                    "bg-background p-2 text-center text-xs font-medium",
                    day === currentDayName && "bg-primary/10 text-primary",
                  )}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ slot, cells }, slotIndex) => (
              <tr key={slot.label}>
                {/* Time label */}
                <td className="bg-background p-1.5 text-[10px] text-muted-foreground text-center">
                  <span className="leading-tight font-mono">{slot.start}</span>
                </td>

                {/* Day cells */}
                {cells.map(({ day, cell }) => {
                  if (cell === null) {
                    // Slot is consumed by a lab - don't render
                    return null;
                  }

                  // For multi-slot cells, use duration-based height if available
                  // Otherwise fall back to row-based calculation
                  const cellHeight =
                    cell.rowSpan > 1
                      ? {
                          height: cell.height
                            ? `${cell.height}px`
                            : `${44 * cell.rowSpan + (cell.rowSpan - 1)}px`,
                        }
                      : undefined;

                  return (
                    <td
                      key={`${day}-${slotIndex}`}
                      rowSpan={cell.rowSpan}
                      style={cellHeight}
                      className={cn("bg-background p-0", day === currentDayName && "bg-primary/5")}
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
