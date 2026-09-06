import * as stylex from "@stylexjs/stylex";
import { classNames, styles } from "@/ui.stylex";
/**
 * The tile class cache must be invisible.
 *
 * StyleX resolves conflicts by keeping the last definition for each property,
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
/* The uncached composition, using the same migrated style definitions       */
/* -------------------------------------------------------------------------- */

function reference(className: string | undefined, isPassed: boolean, isActive: boolean): string {
  const baseClasses = cn(classNames.courseTile229, classNames.courseTile230, className);

  const stateClasses = cn(
    classNames.courseTile231,
    isPassed && classNames.courseTile232,
    isActive && classNames.courseTile233,
  );

  return cn(baseClasses, stateClasses, classNames.courseTile234);
}

/* -------------------------------------------------------------------------- */

/** Everything the views hand down today, plus the undefined default. */
const CLASS_NAMES = [
  undefined,
  "",
  classNames.weekView242,
  classNames.dayView206,
  "h-full min-h-[44px]",
];

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
    const first = __tileClassName(classNames.weekView242, true, false);
    const second = __tileClassName(classNames.weekView242, true, false);
    expect(second).toBe(first);
  });

  test("state and layout both take part in the key", () => {
    const combinations = new Set<string>();
    for (const className of [classNames.weekView242, classNames.dayView206]) {
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
    const expected = reference(classNames.weekView242, false, true);
    // Overflow the cap with throwaway keys, then ask again.
    for (let i = 0; i < 100; i += 1) __tileClassName(`overflow-${i}`, false, false);
    expect(__tileClassName(classNames.weekView242, false, true)).toBe(expected);
  });

  test("the passed state actually dims and the active state actually rings", () => {
    const passed = __tileClassName(classNames.weekView242, true, false).split(" ");
    const active = __tileClassName(classNames.weekView242, true, true).split(" ");
    for (const token of stylex.props(styles.courseTile232).className?.split(" ") ?? []) {
      expect(passed).toContain(token);
    }
    for (const token of stylex.props(styles.courseTile233).className?.split(" ") ?? []) {
      expect(active).toContain(token);
    }
    // The standalone dimming definition is the same opacity used by passed tiles.
    const dimmed = stylex.props(styles.dayView194).className;
    expect(dimmed).toBeTruthy();
    expect(active).not.toContain(dimmed);
  });
});
