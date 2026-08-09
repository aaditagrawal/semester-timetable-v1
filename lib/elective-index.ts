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
  electiveTypes,
  isStudentProject,
  studentProjectOption,
  type ElectiveOption,
  type ElectiveType,
} from "@/lib/timetable-data";

/** An `ElectiveOption` the user added themselves, tagged with its basket. */
export interface TaggedElective extends ElectiveOption {
  groupType: ElectiveType;
}

export type OptionsByType = Record<ElectiveType, ElectiveOption[]>;
export type OptionIndex = Record<ElectiveType, Map<string, ElectiveOption>>;
export type ResolvedElectives = Record<ElectiveType, ElectiveOption | null>;

/**
 * Every basket's pick-list: the published catalogue, then the user's own
 * courses, then — for the open elective only — the student-project sentinel.
 *
 * The project goes last so it never pushes a real course down the list.
 */
export function buildOptionsByType(customElectives: TaggedElective[]): OptionsByType {
  const byType = {} as OptionsByType;

  // One pass over the custom electives for all six baskets, rather than one
  // filter per basket. It matters less than the shape of the old code implies
  // — nobody has hundreds of custom courses — but it also reads better.
  const customByType = {} as Record<ElectiveType, ElectiveOption[]>;
  for (const type of electiveTypes) customByType[type] = [];
  for (const { groupType, ...option } of customElectives) {
    customByType[groupType]?.push(option as ElectiveOption);
  }

  for (const group of electiveGroups) {
    const project = group.type === "OE" ? [studentProjectOption] : [];
    byType[group.type] = [...group.options, ...customByType[group.type], ...project];
  }

  return byType;
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
  const index = {} as OptionIndex;
  for (const type of electiveTypes) {
    const map = new Map<string, ElectiveOption>();
    for (const option of optionsByType[type]) {
      if (!map.has(option.id)) map.set(option.id, option);
    }
    index[type] = map;
  }
  return index;
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
  const resolved = {} as ResolvedElectives;
  for (const type of electiveTypes) {
    const selectedId = selections[type];
    resolved[type] =
      !selectedId || isStudentProject(type, selectedId)
        ? null
        : (optionIndex[type].get(selectedId) ?? null);
  }
  return resolved;
}
