// Search for the elective pick-lists.
//
// Baskets run to ~50 options each, so people can type the abbreviation they
// actually know the course by ("DL", "HCI", "XAI") rather than its catalogue
// code.
//
// The scoring below is unchanged. What changed is how often the strings it
// compares get built. Each option's abbreviation, code and name were
// lower-cased and stripped of separators on every keystroke — four throwaway
// strings per option — and the query was normalised once per option rather than
// once per query. Across the 275 options the edit view has on screen at once,
// that was ~1,100 regex passes and allocations for one character typed.
//
// Now the per-option strings are derived once and cached, the query is
// normalised once, and the ranking is a counting sort into the seven score
// buckets instead of a comparison sort. Typing "deep" across all six baskets
// went from 302 µs to 52 µs; see `bench/search.ts`.

import type { ElectiveOption } from "@/lib/timetable-data";

/** Strip case and separators so "ict4442", "ICT 4442" and "ICT-4442" all match. */
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** The three fields matching looks at, normalised. */
interface SearchFields {
  abbreviation: string;
  code: string;
  name: string;
}

/**
 * Derived per option, once.
 *
 * A `WeakMap` rather than a plain one because the option objects it keys on are
 * not all long-lived: the catalogue's are module-level and get normalised once
 * ever, but a custom elective's is rebuilt whenever the user's list changes, and
 * those entries should go with it rather than accumulate.
 */
const FIELDS = new WeakMap<ElectiveOption, SearchFields>();

function fieldsOf(option: ElectiveOption): SearchFields {
  const cached = FIELDS.get(option);
  if (cached !== undefined) return cached;

  const fields: SearchFields = {
    // The section suffix ("DL [E]") is noise for matching; compare the bare
    // abbreviation too so "dl" prefix-matches rather than only substring-matches.
    abbreviation: normalize(option.abbreviation.replace(/\s*\[.*\]\s*$/, "")),
    code: normalize(option.code),
    name: normalize(option.name),
  };
  FIELDS.set(option, fields);
  return fields;
}

/** How many distinct ranks `score` can return — the bucket count below. */
const SCORE_COUNT = 7;
/** Returned instead of `null` on the hot path, so the loop stays monomorphic. */
const NO_MATCH = -1;

/**
 * Lower score = better match, `NO_MATCH` for no match at all.
 *
 * Abbreviation hits rank above code hits, which rank above name hits, so typing
 * "dl" surfaces Deep Learning's sections before any course merely containing
 * "dl" in its title (e.g. "Wor(dl)dwide"). Within a rank, prefix beats
 * substring.
 *
 * `query` must already be normalised — separating that from the per-option work
 * is the point of splitting this out of `scoreOption`.
 */
function score(fields: SearchFields, query: string): number {
  if (fields.abbreviation === query) return 0;
  if (fields.abbreviation.startsWith(query)) return 1;
  if (fields.code.startsWith(query)) return 2;
  if (fields.abbreviation.includes(query)) return 3;
  if (fields.code.includes(query)) return 4;
  if (fields.name.startsWith(query)) return 5;
  if (fields.name.includes(query)) return 6;
  return NO_MATCH;
}

/**
 * Lower score = better match. `null` means the option does not match at all.
 *
 * Kept for callers holding one option and a raw query. `searchOptions` is the
 * one on the hot path and does not go through here.
 */
export function scoreOption(option: ElectiveOption, query: string): number | null {
  const q = normalize(query);
  if (!q) return 0;
  const rank = score(fieldsOf(option), q);
  return rank === NO_MATCH ? null : rank;
}

/**
 * Filter to matches and order them best-first, keeping the incoming order
 * (by course code) as the tie-break so results stay stable.
 *
 * The ordering is a counting sort: there are only seven possible scores, so
 * pushing each match into its score's bucket and concatenating gives the same
 * answer as sorting by (score, original index) — `push` preserves incoming
 * order within a bucket, and that *is* the index tie-break. No comparator, and
 * no `{option, index, score}` wrapper allocated per candidate.
 */
export function searchOptions(
  options: ElectiveOption[],
  query: string,
): ElectiveOption[] {
  const q = normalize(query);
  // The same array back for an empty query, so a memoised list can skip re-rendering.
  if (!q) return options;

  const buckets: ElectiveOption[][] = Array.from({ length: SCORE_COUNT }, () => []);

  for (let i = 0; i < options.length; i += 1) {
    const option = options[i];
    const rank = score(fieldsOf(option), q);
    if (rank !== NO_MATCH) buckets[rank].push(option);
  }

  return buckets.flat();
}
