"use client";

import { useEffect, useMemo, useState } from "react";
import { snapshotNow, type NowSnapshot } from "@/lib/timetable-data";

/**
 * The app's clock.
 *
 * It used to tick once a second, which re-rendered the whole tree — both views,
 * every tile, and the Radix dropdown root each tile carries — 3,600 times an
 * hour on a phone that is mostly in someone's pocket. Nothing it displays has
 * second granularity: the badge renders HH:MM, and every edge in `timeSlots`
 * falls on a minute boundary, so a minute is the finest resolution any rendered
 * value can actually change at.
 *
 * So it now sleeps to the next minute boundary instead. That is 60x fewer
 * renders, and because the delay is recomputed from the current time on every
 * tick rather than accumulated, the flip lands on the boundary instead of
 * drifting a few milliseconds later each time the way a `setInterval` does.
 */

const MS_PER_MINUTE = 60_000;

/**
 * `toLocaleTimeString(locale, options)` has to resolve the options object into a
 * format on every single call — 32 µs for the header's two strings, measured in
 * `bench/clock.ts`, which made it the most expensive thing in a render by some
 * margin. So neither string goes through it any more.
 *
 * Hoisting an `Intl.DateTimeFormat` to module scope is the obvious fix and it is
 * subtly wrong on its own. Per ECMA-402 a formatter resolves the host time zone
 * once, at construction, and keeps it; `Date#getHours` and `Date#getDay` re-read
 * it on every call. Every engine updates `Date` when the OS zone changes without
 * a reload — a phone crossing a boundary, or just picking up DST — and none of
 * them rebuild an existing formatter. The badge would then be reading one zone
 * while the grid underneath it read another, hours apart, with no way to tell
 * which was right.
 *
 * The time is now derived from the same accessors `snapshotNow` uses, so the two
 * cannot disagree by construction. It is also faster than the formatter it
 * replaces, and `use-current-time.test.ts` checks it is byte-identical to the
 * old output for all 1,440 minutes of the day.
 */
export function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours < 10 ? "0" : ""}${hours}:${minutes < 10 ? "0" : ""}${minutes}`;
}

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
};

/**
 * The long date still wants `Intl`, so the formatter is cached against the zone
 * it was built for and rebuilt when that changes. The check costs one
 * `resolvedOptions()` per tick — once a minute, not once a render — so the
 * saving survives.
 */
let dateFormat = new Intl.DateTimeFormat("en-US", DATE_OPTIONS);
let dateFormatZone = dateFormat.resolvedOptions().timeZone;

function formatDate(date: Date): string {
  const zone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (zone !== dateFormatZone) {
    dateFormat = new Intl.DateTimeFormat("en-US", DATE_OPTIONS);
    dateFormatZone = zone;
  }
  return dateFormat.format(date);
}

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

export type DayName = (typeof DAY_NAMES)[number];

/**
 * Milliseconds left in the current minute — always in (0, 60000].
 *
 * Exported for `use-current-time.test.ts`: getting this wrong by one either
 * fires a millisecond early and lands on the same minute again (a tick that
 * repaints nothing, twice a minute), or busy-loops at zero.
 */
export function msUntilNextMinute(from: Date): number {
  return MS_PER_MINUTE - (from.getSeconds() * 1000 + from.getMilliseconds());
}

export function isSameMinute(a: Date, b: Date): boolean {
  return (
    a.getMinutes() === b.getMinutes() &&
    a.getHours() === b.getHours() &&
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

export function useCurrentTime() {
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    // Returning `prev` when the minute has not turned makes React bail out
    // of the render entirely, which is what keeps a resync free.
    const update = () =>
      setCurrentTime((prev) => {
        const next = new Date();
        return isSameMinute(prev, next) ? prev : next;
      });

    const schedule = () => {
      timeout = setTimeout(() => {
        update();
        schedule();
      }, msUntilNextMinute(new Date()));
    };

    /**
     * Background tabs get their timers throttled and a sleeping device runs
     * none at all, so an installed PWA reopened an hour later would show the
     * time it was closed at until the pending timeout finally fired. Catch
     * the moment it comes back instead — `pageshow` covers the bfcache and
     * app-switcher restores that `visibilitychange` alone misses.
     */
    const resync = () => {
      if (document.visibilityState !== "visible") return;
      if (timeout !== undefined) clearTimeout(timeout);
      update();
      schedule();
    };

    schedule();
    document.addEventListener("visibilitychange", resync);
    window.addEventListener("pageshow", resync);

    return () => {
      if (timeout !== undefined) clearTimeout(timeout);
      document.removeEventListener("visibilitychange", resync);
      window.removeEventListener("pageshow", resync);
    };
  }, []);

  /**
   * Derived once per tick rather than per call. These were `useCallback`s the
   * header invoked during render, so every render that had nothing to do with
   * the clock still paid to re-format both strings.
   */
  return useMemo(
    () => ({
      currentTime,
      /** The clock reduced to the two integers the grid predicates want. */
      now: snapshotNow(currentTime),
      currentDay: DAY_NAMES[currentTime.getDay()],
      formattedTime: formatTime(currentTime),
      formattedDate: formatDate(currentTime),
    }),
    [currentTime],
  );
}

export type CurrentTime = ReturnType<typeof useCurrentTime>;
export type { NowSnapshot };
