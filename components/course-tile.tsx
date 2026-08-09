"use client";

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

const BASE =
  "group relative flex items-center justify-center px-2 py-2 min-h-[44px] text-xs font-medium transition-all duration-200 cursor-pointer select-none";
const INTERACTIVE = "hover:bg-accent active:scale-[0.98]";
// Default state
const STATE_DEFAULT = "bg-card ring-1 ring-foreground/10";
// Passed state - grayed out
const STATE_PASSED = "opacity-40 bg-muted/50 text-muted-foreground";
// Active state - highlighted border
const STATE_ACTIVE = "ring-2 ring-primary bg-primary/10 opacity-100";

/**
 * A tile's class string depends on three things: whether it has passed, whether
 * it is live, and the layout class its view hands down. Across the whole app
 * that is a handful of distinct strings — but it was recomputed for every tile
 * on every render, and `cn` is `tailwind-merge`, which has to tokenise each
 * argument and resolve the conflicts between them.
 *
 * Measured in `bench/classnames.ts`: 10.6 µs for the week grid's 18 tiles, more
 * than the entire grid's data lookup put together. Memoised it is 45 ns.
 *
 * The staged `cn(cn(...), cn(...), ...)` shape is deliberate: it reproduces
 * exactly what the inline version computed, so this is a cache in front of the
 * old expression rather than a re-derivation of it.
 */
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
    "flex-col gap-0.5",
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
  const heightStyle = React.useMemo(
    () =>
      durationSlots > 1
        ? { minHeight: `${44 * durationSlots + (durationSlots - 1) * 4}px` }
        : undefined,
    [durationSlots],
  );

  return (
    <CourseDetail course={course} timeSlot={timeSlot} isActive={isActive} isPassed={isPassed}>
      <div className={tileClassName(className, isPassed, isActive)} style={heightStyle}>
        <span className="font-semibold text-center leading-tight text-balance">
          {labelMode === "code" ? course.code : course.abbreviation}
          {showRoom && course.room && (
            <>
              <span className="mx-1 text-muted-foreground font-normal">|</span>
              <span className="font-normal">{course.room}</span>
            </>
          )}
        </span>
        {isLab && (
          <Badge variant="secondary" className="text-[9px] h-3.5 px-1">
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
