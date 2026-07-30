/**
 * Elective search, per keystroke.
 *
 * This is the one path in the app with a real N: 275 catalogue options, and the
 * edit view renders all six baskets at once, so a single keystroke re-scores
 * every option in every basket. scoreOption normalises the query once *per
 * option* and re-normalises each option's abbreviation, code and name every
 * time, each with a regex and a toLowerCase — so the work is ~4 string
 * allocations per option per keystroke, thrown away immediately.
 *
 * Typing is the workload, not a single query: measure the whole word.
 */

import { bench } from "./harness";
import { searchOptions, scoreOption } from "../lib/elective-search";
import { electiveOptions } from "../lib/elective-options";
import type { ElectiveOption } from "../lib/timetable-data";

const BASKETS = Object.values(electiveOptions) as ElectiveOption[][];
const ALL = BASKETS.flat();
const TOTAL = ALL.length;

// Typing a query one character at a time, which is what actually happens.
const TYPED = ["d", "de", "dee", "deep"];
const TYPED_CODE = ["i", "ic", "ict", "ict4", "ict44"];

function typeAcrossAllBaskets(chars: string[]) {
  let sink = 0;
  for (const q of chars) {
    for (const basket of BASKETS) sink += searchOptions(basket, q).length;
  }
  return sink;
}

/* -------------------------------------------------------------------------- */
/* What a precomputed index would cost                                        */
/* -------------------------------------------------------------------------- */

interface Indexed {
  option: ElectiveOption;
  abbreviation: string;
  code: string;
  name: string;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const INDEX = new Map<ElectiveOption[], Indexed[]>();
for (const basket of BASKETS) {
  INDEX.set(
    basket,
    basket.map((option) => ({
      option,
      abbreviation: normalize(option.abbreviation.replace(/\s*\[.*\]\s*$/, "")),
      code: normalize(option.code),
      name: normalize(option.name),
    })),
  );
}

function scoreIndexed(e: Indexed, q: string): number {
  if (e.abbreviation === q) return 0;
  if (e.abbreviation.startsWith(q)) return 1;
  if (e.code.startsWith(q)) return 2;
  if (e.abbreviation.includes(q)) return 3;
  if (e.code.includes(q)) return 4;
  if (e.name.startsWith(q)) return 5;
  if (e.name.includes(q)) return 6;
  return -1;
}

/** Counting sort into the 7 score buckets — no comparison sort needed. */
function searchIndexed(basket: ElectiveOption[], query: string): ElectiveOption[] {
  const q = normalize(query);
  if (!q) return basket;
  const entries = INDEX.get(basket)!;
  const buckets: ElectiveOption[][] = [[], [], [], [], [], [], []];
  for (let i = 0; i < entries.length; i += 1) {
    const score = scoreIndexed(entries[i], q);
    if (score >= 0) buckets[score].push(entries[i].option);
  }
  return buckets.flat();
}

function typeIndexed(chars: string[]) {
  let sink = 0;
  for (const q of chars) {
    for (const basket of BASKETS) sink += searchIndexed(basket, q).length;
  }
  return sink;
}

/* -------------------------------------------------------------------------- */

// Correctness gate: the fast path must return exactly the current results.
for (const q of [...TYPED, ...TYPED_CODE, "ml", "hci", "zzz", ""]) {
  for (const basket of BASKETS) {
    const a = searchOptions(basket, q).map((o) => o.id).join(",");
    const b = searchIndexed(basket, q).map((o) => o.id).join(",");
    if (a !== b) throw new Error(`mismatch for ${JSON.stringify(q)}:\n  ${a}\n  ${b}`);
  }
}
console.log(`parity check passed over ${TOTAL} options in ${BASKETS.length} baskets`);

bench(`typing "deep" across all 6 baskets (${TOTAL} options x 4 keystrokes)`, [
  { name: "current", fn: () => typeAcrossAllBaskets(TYPED), unitsPerOp: TOTAL * 4 },
  { name: "precomputed index + counting sort", fn: () => typeIndexed(TYPED), unitsPerOp: TOTAL * 4 },
]);

bench(`typing "ict44" across all 6 baskets (${TOTAL} options x 5 keystrokes)`, [
  { name: "current", fn: () => typeAcrossAllBaskets(TYPED_CODE), unitsPerOp: TOTAL * 5 },
  { name: "precomputed index + counting sort", fn: () => typeIndexed(TYPED_CODE), unitsPerOp: TOTAL * 5 },
]);

bench("one keystroke, one basket (PE-3)", [
  { name: "current", fn: () => searchOptions(BASKETS[0], "deep"), unitsPerOp: BASKETS[0].length },
  { name: "precomputed index", fn: () => searchIndexed(BASKETS[0], "deep"), unitsPerOp: BASKETS[0].length },
]);

bench("scoreOption, single option", [
  { name: "current (4 allocations)", fn: () => scoreOption(ALL[0], "deep") },
  { name: "indexed (0 allocations)", fn: () => scoreIndexed(INDEX.get(BASKETS[0])![0], "deep") },
]);
