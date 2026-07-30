/**
 * The clock's scheduling arithmetic.
 *
 * The hook itself needs a DOM to test, but the two decisions that make it
 * correct are pure: how long to sleep, and whether a new reading is worth a
 * render. Both fail quietly — an off-by-one in the delay costs a wasted render
 * a minute rather than an error, and a wrong equality either repaints
 * constantly or freezes the clock — so they are pinned here.
 *
 * Run with `bun test`.
 */

import { describe, expect, test } from "bun:test";
import { formatTime, isSameMinute, msUntilNextMinute } from "./use-current-time";

const MS_PER_MINUTE = 60_000;

describe("formatTime", () => {
    /** The options the badge used before it stopped going through Intl. */
    const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    };

    test("is byte-identical to toLocaleTimeString for all 1,440 minutes of the day", () => {
        for (let minuteOfDay = 0; minuteOfDay < 1440; minuteOfDay += 1) {
            const date = new Date(2026, 7, 25, Math.floor(minuteOfDay / 60), minuteOfDay % 60);
            expect(formatTime(date)).toBe(date.toLocaleTimeString("en-US", TIME_OPTIONS));
        }
    });

    test("pads midnight and single-digit hours", () => {
        expect(formatTime(new Date(2026, 7, 25, 0, 0))).toBe("00:00");
        expect(formatTime(new Date(2026, 7, 25, 9, 5))).toBe("09:05");
        expect(formatTime(new Date(2026, 7, 25, 23, 59))).toBe("23:59");
    });

    test("reads the same zone the grid predicates read", () => {
        // The whole reason this does not use a hoisted Intl formatter: one
        // resolves the host zone once at construction, the other on every call.
        // Deriving both from getHours/getMinutes makes them agree by definition.
        const date = new Date(2026, 7, 25, 14, 30);
        const fromAccessors = `${String(date.getHours()).padStart(2, "0")}:${String(
            date.getMinutes(),
        ).padStart(2, "0")}`;
        expect(formatTime(date)).toBe(fromAccessors);
    });
});

describe("msUntilNextMinute", () => {
    test("lands exactly on the boundary from every millisecond of a minute", () => {
        const base = new Date(2026, 7, 25, 11, 45, 0, 0);
        // Every second, plus a scatter of sub-second offsets within each.
        for (let second = 0; second < 60; second += 1) {
            for (const ms of [0, 1, 137, 500, 999]) {
                const from = new Date(base);
                from.setSeconds(second, ms);
                const landing = new Date(from.getTime() + msUntilNextMinute(from));
                expect(landing.getSeconds()).toBe(0);
                expect(landing.getMilliseconds()).toBe(0);
                expect(landing.getMinutes()).toBe((base.getMinutes() + 1) % 60);
            }
        }
    });

    test("stays within (0, 60000] so a tick can never busy-loop", () => {
        const base = new Date(2026, 7, 25, 11, 45, 0, 0);
        for (let second = 0; second < 60; second += 1) {
            for (const ms of [0, 1, 999]) {
                const from = new Date(base);
                from.setSeconds(second, ms);
                const delay = msUntilNextMinute(from);
                expect(delay).toBeGreaterThan(0);
                expect(delay).toBeLessThanOrEqual(MS_PER_MINUTE);
            }
        }
    });

    test("a full minute is left at the top of the minute", () => {
        const from = new Date(2026, 7, 25, 11, 45, 0, 0);
        expect(msUntilNextMinute(from)).toBe(MS_PER_MINUTE);
    });

    test("crossing midnight is just the next minute", () => {
        const from = new Date(2026, 7, 25, 23, 59, 30, 0);
        const landing = new Date(from.getTime() + msUntilNextMinute(from));
        expect(landing.getDate()).toBe(26);
        expect(landing.getHours()).toBe(0);
        expect(landing.getMinutes()).toBe(0);
    });
});

describe("isSameMinute", () => {
    test("true across any two moments inside one minute", () => {
        const a = new Date(2026, 7, 25, 11, 45, 0, 0);
        const b = new Date(2026, 7, 25, 11, 45, 59, 999);
        expect(isSameMinute(a, b)).toBe(true);
    });

    test("false the instant the minute turns", () => {
        const a = new Date(2026, 7, 25, 11, 45, 59, 999);
        const b = new Date(2026, 7, 25, 11, 46, 0, 0);
        expect(isSameMinute(a, b)).toBe(false);
    });

    test("distinguishes the same clock face on a different hour, day, month or year", () => {
        const base = new Date(2026, 7, 25, 11, 45, 30, 0);
        const shifted = [
            new Date(2026, 7, 25, 12, 45, 30, 0),
            new Date(2026, 7, 26, 11, 45, 30, 0),
            new Date(2026, 8, 25, 11, 45, 30, 0),
            new Date(2027, 7, 25, 11, 45, 30, 0),
        ];
        for (const other of shifted) expect(isSameMinute(base, other)).toBe(false);
    });

    test("a device asleep for exactly one day is not mistaken for the same minute", () => {
        const before = new Date(2026, 7, 25, 11, 45, 0, 0);
        const after = new Date(before.getTime() + 24 * 60 * MS_PER_MINUTE);
        expect(isSameMinute(before, after)).toBe(false);
    });
});
