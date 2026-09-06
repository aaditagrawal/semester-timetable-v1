import { classNames } from "@/ui.stylex";
/** Compare uncached StyleX composition with the existing tile cache. */

import { bench } from "./harness";
import { cn } from "../lib/utils";
import { __tileClassName } from "../components/course-tile";

// The same definitions as course-tile, composed without the cache.
const BASE = classNames.courseTile229;
const INTERACTIVE = classNames.courseTile230;
const STATE_DEFAULT = classNames.courseTile231;
const STATE_PASSED = classNames.courseTile232;
const STATE_ACTIVE = classNames.courseTile233;

function before(className: string | undefined, isPassed: boolean, isActive: boolean): string {
  const baseClasses = cn(BASE, INTERACTIVE, className);
  const stateClasses = cn(STATE_DEFAULT, isPassed && STATE_PASSED, isActive && STATE_ACTIVE);
  return cn(baseClasses, stateClasses, classNames.courseTile234);
}

// Parity, so the comparison below is between two things that agree.
for (const className of [undefined, classNames.weekView242, classNames.dayView206]) {
  for (const isPassed of [false, true]) {
    for (const isActive of [false, true]) {
      const a = before(className, isPassed, isActive);
      const b = __tileClassName(className, isPassed, isActive);
      if (a !== b) throw new Error(`mismatch for ${className}/${isPassed}/${isActive}`);
    }
  }
}
console.log("parity check passed across every tile state");

/** One render of the week grid: 18 tiles, a realistic mix of states. */
function renderTiles(build: (c: string, p: boolean, a: boolean) => string): number {
  let sink = 0;
  for (let i = 0; i < 18; i += 1) {
    sink += build(classNames.weekView242, i % 3 === 0, i === 4).length;
  }
  return sink;
}

bench("week grid: class strings for 18 course tiles", [
  {
    name: "uncached: 3 StyleX compositions per tile",
    fn: () => renderTiles(before),
    unitsPerOp: 18,
  },
  {
    name: "after: memoised on (layout, passed, active)",
    fn: () => renderTiles(__tileClassName),
    unitsPerOp: 18,
  },
]);

bench("a single tile's class string", [
  { name: "before", fn: () => before(classNames.weekView242, false, true) },
  { name: "after (cache hit)", fn: () => __tileClassName(classNames.weekView242, false, true) },
]);
