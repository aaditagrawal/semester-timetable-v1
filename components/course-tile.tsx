"use client";

import { classNames } from "@/ui.stylex";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CourseDetail } from "@/components/course-detail";
import { Course } from "@/lib/timetable-data";
import { TileLabelMode } from "@/lib/hooks/use-timetable";
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
  /** Opt-in (settings): append the room to the course label, e.g. "HCI [G] | AB5-311" */
  showRoom?: boolean;
  /** Settings: label the tile with the abbreviation ("HCI [G]") or the course code ("ICT 4403") */
  labelMode?: TileLabelMode;
}

const BASE = classNames.courseTile229;
const INTERACTIVE = classNames.courseTile230;
// Default state
const STATE_DEFAULT = classNames.courseTile231;
// Passed state - grayed out
const STATE_PASSED = classNames.courseTile232;
// Active state - highlighted border
const STATE_ACTIVE = classNames.courseTile233;

/** Cache the StyleX class composition by layout and time state. */
const CLASS_CACHE = new Map<string, string>();
/** Call sites pass literals, so this holds ~8 entries; the cap is for anyone who later passes a computed one. */
const CLASS_CACHE_LIMIT = 64;

function tileClassName(
  className: string | undefined,
  isPassed: boolean,
  isActive: boolean,
): string {
  const key = `${isPassed ? "p" : ""}${isActive ? "a" : ""}|${className ?? ""}`;
  const cached = CLASS_CACHE.get(key);
  if (cached !== undefined) return cached;

  const value = cn(
    cn(BASE, INTERACTIVE, className),
    cn(STATE_DEFAULT, isPassed && STATE_PASSED, isActive && STATE_ACTIVE),
    classNames.courseTile234,
  );

  if (CLASS_CACHE.size >= CLASS_CACHE_LIMIT) CLASS_CACHE.clear();
  CLASS_CACHE.set(key, value);
  return value;
}

/** Exported for `course-tile.test.ts`, which pins the cache against the expression it replaced. */
export const __tileClassName = tileClassName;

function CourseTileImpl({
  course,
  timeSlot,
  isActive = false,
  isPassed = false,
  isLab = false,
  className,
  durationSlots = 1,
  showRoom = false,
  labelMode = "abbreviation",
}: CourseTileProps) {
  // Base height is 44px per slot, with some extra for multi-slot items
  // (--tile-min-height is consumed by the tile's min-height in ui.stylex.js)
  // SAFETY: `--*` custom properties are valid style keys; React.CSSProperties
  // just doesn't type them.
  const heightStyle: React.CSSProperties | undefined =
    durationSlots > 1
      ? ({
          "--tile-min-height": `${44 * durationSlots + (durationSlots - 1) * 4}px`,
        } as React.CSSProperties)
      : undefined;

  return (
    <CourseDetail course={course} timeSlot={timeSlot} isActive={isActive} isPassed={isPassed}>
      <div className={tileClassName(className, isPassed, isActive)} style={heightStyle}>
        <span className={classNames.courseTile235}>
          {labelMode === "code" ? course.code : course.abbreviation}
          {showRoom && course.room && (
            <>
              <span className={classNames.courseTile236}>|</span>
              <span className={classNames.courseTile237}>{course.room}</span>
            </>
          )}
        </span>
        {isLab && (
          <Badge variant="secondary" className={classNames.courseTile238}>
            LAB
          </Badge>
        )}
      </div>
    </CourseDetail>
  );
}

/**
 * Memoised because every tile carries a Radix dropdown root (see
 * `CourseDetail`) and the week grid draws 18 of them. Now that a resolved course
 * keeps one identity between renders, a tick that changes nothing about a given
 * tile stops at this boundary instead of rebuilding its subtree.
 */
export const CourseTile = React.memo(CourseTileImpl);
