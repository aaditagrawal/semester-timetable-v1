/**
 * `cn()` — the cost nobody counts.
 *
 * Every tile calls cn() three times with long literal class strings, and
 * tailwind-merge has to tokenise and conflict-resolve each one. With 18 tiles
 * on the week grid that is 54 merges per render, and under the 1 Hz clock, per
 * second. This benchmark exists to find out whether that is the real render
 * cost — the grid's own arithmetic measures under 2 µs, so if the JS hot spot
 * is anywhere, it is here.
 *
 * tailwind-merge keeps an LRU (500 entries by default) keyed on the joined
 * argument string, so the interesting comparison is cold vs warm, and warm vs
 * hoisting the invariant parts out of the render entirely.
 */

import { bench } from "./harness";
import { cn } from "../lib/utils";

// Verbatim from components/course-tile.tsx.
const BASE =
  "group relative flex items-center justify-center px-2 py-2 min-h-[44px] text-xs font-medium transition-all duration-200 cursor-pointer select-none";
const HOVER = "hover:bg-accent active:scale-[0.98]";
const STATE_DEFAULT = "bg-card ring-1 ring-foreground/10";
const STATE_PASSED = "opacity-40 bg-muted/50 text-muted-foreground";
const STATE_ACTIVE = "ring-2 ring-primary bg-primary/10 opacity-100";

function tileClasses(isPassed: boolean, isActive: boolean, extra: string) {
  const base = cn(BASE, HOVER, extra);
  const state = cn(STATE_DEFAULT, isPassed && STATE_PASSED, isActive && STATE_ACTIVE);
  return cn(base, state, "flex-col gap-0.5");
}

// A render pass over the week grid's 18 course tiles.
function renderTiles(unique: boolean) {
  let sink = 0;
  for (let i = 0; i < 18; i += 1) {
    // `unique` defeats the LRU the way a per-cell dynamic class would.
    const extra = unique ? `h-full mt-[${i}px]` : "h-full";
    sink += tileClasses(i % 3 === 0, i === 4, extra).length;
  }
  return sink;
}

bench("week grid: cn() for 18 course tiles (3 merges each)", [
  { name: "as written (warm LRU)", fn: () => renderTiles(false), unitsPerOp: 54 },
  { name: "LRU defeated (unique strings)", fn: () => renderTiles(true), unitsPerOp: 54 },
]);

bench("single cn() call", [
  { name: "cold-ish: long literal + 2 conditionals", fn: () => cn(BASE, HOVER, "h-full") },
  { name: "already-merged short string", fn: () => cn("flex-col gap-0.5") },
]);

// What the same work costs if the invariant strings are merged once at module
// load and only the variant part goes through cn() per render.
const PRECOMPUTED = {
  base: cn(BASE, HOVER, "h-full", "flex-col gap-0.5"),
  passed: cn(BASE, HOVER, "h-full", STATE_DEFAULT, STATE_PASSED, "flex-col gap-0.5"),
  active: cn(BASE, HOVER, "h-full", STATE_DEFAULT, STATE_ACTIVE, "flex-col gap-0.5"),
  normal: cn(BASE, HOVER, "h-full", STATE_DEFAULT, "flex-col gap-0.5"),
};

function renderTilesPrecomputed() {
  let sink = 0;
  for (let i = 0; i < 18; i += 1) {
    const key = i % 3 === 0 ? "passed" : i === 4 ? "active" : "normal";
    sink += PRECOMPUTED[key].length;
  }
  return sink;
}

bench("week grid: precomputed variants vs per-render cn()", [
  { name: "per-render cn() (warm LRU)", fn: () => renderTiles(false), unitsPerOp: 54 },
  { name: "lookup precomputed variant", fn: renderTilesPrecomputed, unitsPerOp: 54 },
]);
