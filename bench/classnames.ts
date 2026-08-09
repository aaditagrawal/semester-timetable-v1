/**
 * `cn()` — the cost nobody counts.
 *
 * Every tile built its class string with three `cn()` calls, and `cn` is
 * `tailwind-merge`: it has to tokenise each argument and resolve the conflicts
 * between them. With 18 tiles on the week grid that was 54 merges per render,
 * and under the old one-second clock, per second.
 *
 * It turned out to cost more than the grid's entire data lookup — which is why
 * `course-tile.tsx` now memoises it on (layout class, passed, active). This
 * measures the real shipped function, not a stand-in, so the number cannot
 * drift away from what the app actually does.
 *
 * tailwind-merge keeps its own LRU (500 entries) keyed on the joined argument
 * string, so the "before" case here is already the warm, best-case version of
 * the old code.
 */

import { bench } from "./harness";
import { cn } from "../lib/utils";
import { __tileClassName } from "../components/course-tile";

// Verbatim from components/course-tile.tsx, before the change.
const BASE =
  "group relative flex items-center justify-center px-2 py-2 min-h-[44px] text-xs font-medium transition-all duration-200 cursor-pointer select-none";
const INTERACTIVE = "hover:bg-accent active:scale-[0.98]";
const STATE_DEFAULT = "bg-card ring-1 ring-foreground/10";
const STATE_PASSED = "opacity-40 bg-muted/50 text-muted-foreground";
const STATE_ACTIVE = "ring-2 ring-primary bg-primary/10 opacity-100";

function before(className: string | undefined, isPassed: boolean, isActive: boolean): string {
  const baseClasses = cn(BASE, INTERACTIVE, className);
  const stateClasses = cn(STATE_DEFAULT, isPassed && STATE_PASSED, isActive && STATE_ACTIVE);
  return cn(baseClasses, stateClasses, "flex-col gap-0.5");
}

// Parity, so the comparison below is between two things that agree.
for (const className of [undefined, "h-full", "min-h-10"]) {
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
    sink += build("h-full", i % 3 === 0, i === 4).length;
  }
  return sink;
}

bench("week grid: class strings for 18 course tiles", [
  {
    name: "before: 3 cn() per tile (warm tailwind-merge LRU)",
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
  { name: "before", fn: () => before("h-full", false, true) },
  { name: "after (cache hit)", fn: () => __tileClassName("h-full", false, true) },
]);
