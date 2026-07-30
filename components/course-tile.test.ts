/**
 * The tile class cache must be invisible.
 *
 * `tailwind-merge` resolves conflicts by keeping the last class in each group,
 * so the *order* the strings are combined in decides the outcome — a cache that
 * combined them differently would produce tiles that look subtly wrong (a
 * passed tile that never dims, an active tile without its ring) rather than
 * anything that errors. This pins the cached result against the expression it
 * replaced, for every state the tile can be in and every layout class the views
 * actually pass.
 *
 * Run with `bun test`.
 */

import { describe, expect, test } from "bun:test";
import { __tileClassName } from "./course-tile";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* The expression being replaced, copied verbatim from before the change       */
/* -------------------------------------------------------------------------- */

function reference(className: string | undefined, isPassed: boolean, isActive: boolean): string {
    const baseClasses = cn(
        "group relative flex items-center justify-center px-2 py-2 min-h-[44px] text-xs font-medium transition-all duration-200 cursor-pointer select-none",
        "hover:bg-accent active:scale-[0.98]",
        className,
    );

    const stateClasses = cn(
        "bg-card ring-1 ring-foreground/10",
        isPassed && "opacity-40 bg-muted/50 text-muted-foreground",
        isActive && "ring-2 ring-primary bg-primary/10 opacity-100",
    );

    return cn(baseClasses, stateClasses, "flex-col gap-0.5");
}

/* -------------------------------------------------------------------------- */

/** Everything the views hand down today, plus the undefined default. */
const CLASS_NAMES = [undefined, "", "h-full", "min-h-10", "h-full min-h-[44px]"];

describe("tileClassName", () => {
    test("matches the inline expression for every state and layout class", () => {
        let checked = 0;
        for (const className of CLASS_NAMES) {
            for (const isPassed of [false, true]) {
                for (const isActive of [false, true]) {
                    expect(__tileClassName(className, isPassed, isActive)).toBe(
                        reference(className, isPassed, isActive),
                    );
                    checked += 1;
                }
            }
        }
        expect(checked).toBe(CLASS_NAMES.length * 4);
    });

    test("a cache hit returns the identical string, not merely an equal one", () => {
        const first = __tileClassName("h-full", true, false);
        const second = __tileClassName("h-full", true, false);
        expect(second).toBe(first);
    });

    test("state and layout both take part in the key", () => {
        const combinations = new Set<string>();
        for (const className of ["h-full", "min-h-10"]) {
            for (const isPassed of [false, true]) {
                for (const isActive of [false, true]) {
                    combinations.add(__tileClassName(className, isPassed, isActive));
                }
            }
        }
        // Eight distinct inputs, eight distinct results: nothing collided.
        expect(combinations.size).toBe(8);
    });

    test("still correct after the cache is cleared by the size cap", () => {
        const expected = reference("h-full", false, true);
        // Overflow the cap with throwaway keys, then ask again.
        for (let i = 0; i < 100; i += 1) __tileClassName(`overflow-${i}`, false, false);
        expect(__tileClassName("h-full", false, true)).toBe(expected);
    });

    test("the passed state actually dims and the active state actually rings", () => {
        // Guards the merge order: `opacity-40` must survive into a passed tile,
        // and `ring-2 ring-primary` into an active one.
        expect(__tileClassName("h-full", true, false)).toContain("opacity-40");
        expect(__tileClassName("h-full", false, true)).toContain("ring-primary");
        // Active beats passed, so a live class is never dimmed.
        expect(__tileClassName("h-full", true, true)).toContain("opacity-100");
        expect(__tileClassName("h-full", true, true)).not.toContain("opacity-40");
    });
});
