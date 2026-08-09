/**
 * Elective search, per keystroke.
 *
 * This is the one path in the app with a real N: 275 catalogue options, and the
 * edit view has all six baskets on screen at once.
 *
 * The old `scoreOption` normalised the query once *per option* and rebuilt each
 * option's abbreviation, code and name every time it was asked — four throwaway
 * strings per option per keystroke — then ranked the survivors with a
 * comparison sort over `{option, index, score}` wrappers.
 *
 * Typing is the workload, not a single query, so that is what this measures.
 * The "after" case is the shipped `searchOptions`, not a stand-in.
 */

import { bench } from "./harness";
import { searchOptions, scoreOption } from "../lib/elective-search";
import { electiveOptions } from "../lib/elective-options";
import type { ElectiveOption } from "../lib/timetable-data";

const BASKETS = Object.values(electiveOptions) as ElectiveOption[][];
const ALL = BASKETS.flat();
const TOTAL = ALL.length;

/* -------------------------------------------------------------------------- */
/* The implementation being replaced, copied verbatim                          */
/* -------------------------------------------------------------------------- */

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function beforeScoreOption(option: ElectiveOption, query: string): number | null {
  const q = normalize(query);
  if (!q) return 0;

  const bareAbbreviation = option.abbreviation.replace(/\s*\[.*\]\s*$/, "");
  const abbreviation = normalize(bareAbbreviation);
  const code = normalize(option.code);
  const name = normalize(option.name);

  if (abbreviation === q) return 0;
  if (abbreviation.startsWith(q)) return 1;
  if (code.startsWith(q)) return 2;
  if (abbreviation.includes(q)) return 3;
  if (code.includes(q)) return 4;
  if (name.startsWith(q)) return 5;
  if (name.includes(q)) return 6;
  return null;
}

function beforeSearchOptions(options: ElectiveOption[], query: string): ElectiveOption[] {
  if (!query.trim()) return options;

  return options
    .map((option, index) => ({ option, index, score: beforeScoreOption(option, query) }))
    .filter(
      (entry): entry is { option: ElectiveOption; index: number; score: number } =>
        entry.score !== null,
    )
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map((entry) => entry.option);
}

/* -------------------------------------------------------------------------- */

// Typing a query one character at a time, which is what actually happens.
const TYPED = ["d", "de", "dee", "deep"];
const TYPED_CODE = ["i", "ic", "ict", "ict4", "ict44"];

function typeAcrossAllBaskets(
  search: (options: ElectiveOption[], query: string) => ElectiveOption[],
  chars: string[],
) {
  let sink = 0;
  for (const q of chars) {
    for (const basket of BASKETS) sink += search(basket, q).length;
  }
  return sink;
}

// Parity gate: the fast path must return exactly the results it replaces.
for (const q of [...TYPED, ...TYPED_CODE, "ml", "hci", "zzz", "", "  "]) {
  for (const basket of BASKETS) {
    const a = beforeSearchOptions(basket, q)
      .map((o) => o.id)
      .join(",");
    const b = searchOptions(basket, q)
      .map((o) => o.id)
      .join(",");
    if (a !== b) throw new Error(`mismatch for ${JSON.stringify(q)}:\n  ${a}\n  ${b}`);
  }
}
console.log(`parity check passed over ${TOTAL} options in ${BASKETS.length} baskets`);

bench(`typing "deep" across all 6 baskets (${TOTAL} options x 4 keystrokes)`, [
  {
    name: "before",
    fn: () => typeAcrossAllBaskets(beforeSearchOptions, TYPED),
    unitsPerOp: TOTAL * 4,
  },
  {
    name: "after: cached fields + counting sort",
    fn: () => typeAcrossAllBaskets(searchOptions, TYPED),
    unitsPerOp: TOTAL * 4,
  },
]);

bench(`typing "ict44" across all 6 baskets (${TOTAL} options x 5 keystrokes)`, [
  {
    name: "before",
    fn: () => typeAcrossAllBaskets(beforeSearchOptions, TYPED_CODE),
    unitsPerOp: TOTAL * 5,
  },
  {
    name: "after: cached fields + counting sort",
    fn: () => typeAcrossAllBaskets(searchOptions, TYPED_CODE),
    unitsPerOp: TOTAL * 5,
  },
]);

bench("one keystroke, one basket (PE-3)", [
  {
    name: "before",
    fn: () => beforeSearchOptions(BASKETS[0], "deep"),
    unitsPerOp: BASKETS[0].length,
  },
  { name: "after", fn: () => searchOptions(BASKETS[0], "deep"), unitsPerOp: BASKETS[0].length },
]);

bench("scoreOption, single option", [
  { name: "before (4 string allocations)", fn: () => beforeScoreOption(ALL[0], "deep") },
  { name: "after (cached fields)", fn: () => scoreOption(ALL[0], "deep") },
]);

/**
 * What the modal used to re-render per keystroke. The query lived in one object
 * on `SetupModal`, so typing in any basket re-reconciled every basket's rows;
 * the picker now owns its own query and the other five are memoised out.
 */
console.log(
  `\noption rows re-rendered per keystroke in the edit view: ${TOTAL} -> ${BASKETS[0].length}` +
    ` (only the basket being typed into)`,
);
