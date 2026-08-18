/**
 * Turning a set of selections into the six courses the grid draws.
 *
 * This used to happen inside `use-timetable.ts` on demand, and "on demand"
 * meant once per cell: `electiveGroups.find` for the basket, a `filter` over
 * every custom elective, a spread of the basket's ~46 options into a fresh
 * array, and a linear scan of that array for the selected id — for each of the
 * 18 scheduled cells the week grid draws, on every render. It also handed back
 * a newly allocated object for each custom elective every time, so nothing
 * downstream could memoise on the result even in principle.
 *
 * None of it depends on the clock or on which cell is asking. The functions
 * here build the indices once per change to the user's data; the hook wraps
 * them in `useMemo` and the views index into the result.
 *
 * Kept out of the hook so it can be tested without rendering anything — see
 * `elective-index.test.ts`, which pins it against the implementation it
 * replaced.
 */

import {
  electiveGroups,
  isStudentProject,
  studentProjectOption,
  type ElectiveOption,
  type ElectiveType,
} from "@/lib/timetable-data";

/** An `ElectiveOption` the user added themselves, tagged with its basket. */
export interface TaggedElective extends ElectiveOption {
  groupType: ElectiveType;
}

/**
 * One value per elective basket.
 *
 * Written out key by key rather than as `Record<ElectiveType, T>` so the
 * compiler checks totality where these are *built* instead of only promising it
 * where they are read. The three builders below used to start from
 * `{} as Record<…>` — a claim that every basket was present made before a
 * single key had been written — and a basket missed by the loop would have
 * surfaced as `undefined` at a call site typed to exclude it.
 *
 * Adding a basket to `ElectiveType` without adding it here is a compile error
 * at every `[type]` read, which is the whole point.
 */
export interface ByElectiveType<T> {
  "PE-3": T;
  "PE-4": T;
  "PE-5": T;
  "PE-6": T;
  "PE-7": T;
  OE: T;
}

export type OptionsByType = ByElectiveType<ElectiveOption[]>;
export type OptionIndex = ByElectiveType<Map<string, ElectiveOption>>;
export type ResolvedElectives = ByElectiveType<ElectiveOption | null>;

/** Build the value for every basket, in one place, with no partial state. */
function perBasket<T>(build: (type: ElectiveType) => T): ByElectiveType<T> {
  return {
    "PE-3": build("PE-3"),
    "PE-4": build("PE-4"),
    "PE-5": build("PE-5"),
    "PE-6": build("PE-6"),
    "PE-7": build("PE-7"),
    OE: build("OE"),
  };
}

/**
 * Every basket's pick-list: the published catalogue, then the user's own
 * courses, then — for the open elective only — the student-project sentinel.
 *
 * The project goes last so it never pushes a real course down the list.
 */
export function buildOptionsByType(customElectives: TaggedElective[]): OptionsByType {
  // One pass over the custom electives for all six baskets, rather than one
  // filter per basket. It matters less than the shape of the old code implies
  // — nobody has hundreds of custom courses — but it also reads better.
  const customByType = new Map<ElectiveType, ElectiveOption[]>();
  for (const { groupType, ...option } of customElectives) {
    const bucket = customByType.get(groupType);
    if (bucket === undefined) customByType.set(groupType, [option]);
    else bucket.push(option);
  }

  const catalogue = new Map<ElectiveType, ElectiveOption[]>();
  for (const group of electiveGroups) catalogue.set(group.type, group.options);

  return perBasket((type) => [
    ...(catalogue.get(type) ?? []),
    ...(customByType.get(type) ?? []),
    ...(type === "OE" ? [studentProjectOption] : []),
  ]);
}

/**
 * `id -> option`, per basket.
 *
 * Per basket rather than one global map because a selection for PE-3 must only
 * resolve against PE-3's options. The generated catalogue happens to have no id
 * collisions across baskets today, but custom electives arrive from
 * user-supplied backup files, and a global index would let one basket's id
 * answer for another's.
 *
 * First entry wins, which is not what `Map` does by default. The code this
 * replaces resolved with `options.find(...)`, and a custom elective carrying an
 * id that already exists in the catalogue — possible via a hand-edited backup —
 * sits *after* it in the list, so `find` returned the catalogue course. Letting
 * the later `set` overwrite would silently hand back a different course for the
 * same saved selection.
 */
export function buildOptionIndex(optionsByType: OptionsByType): OptionIndex {
  return perBasket((type) => {
    const map = new Map<string, ElectiveOption>();
    for (const option of optionsByType[type]) {
      if (!map.has(option.id)) map.set(option.id, option);
    }
    return map;
  });
}

/**
 * Resolve each basket's selection to a course, or to null.
 *
 * Null covers three different situations on purpose — nothing picked, the
 * student project picked instead, and an id that no longer matches anything
 * (a stale backup, or a course dropped from the catalogue). The views tell them
 * apart by reading the raw selection, which is why this does not try to.
 */
export function resolveSelections(
  selections: Partial<Record<ElectiveType, string>>,
  optionIndex: OptionIndex,
): ResolvedElectives {
  return perBasket((type) => {
    const selectedId = selections[type];
    return !selectedId || isStudentProject(type, selectedId)
      ? null
      : (optionIndex[type].get(selectedId) ?? null);
  });
}
