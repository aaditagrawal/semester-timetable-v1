/**
 * Behaviour parity for elective resolution.
 *
 * The indices exist to answer "which course is in this basket" without walking
 * the catalogue. They are only worth having if they answer it identically, so
 * this pins them against verbatim copies of the on-demand functions they
 * replaced, over every basket, every option in it, and the edge cases that had
 * their own handling: the student-project sentinel, ids that no longer resolve,
 * and custom electives shadowing or extending a basket.
 *
 * Run with `bun test`.
 */

import { describe, expect, test } from "bun:test";
import {
  buildOptionIndex,
  buildOptionsByType,
  resolveSelections,
  type TaggedElective,
} from "./elective-index";
import {
  STUDENT_PROJECT_ID,
  electiveGroups,
  electiveTypes,
  isStudentProject,
  studentProjectOption,
  type ElectiveOption,
  type ElectiveType,
} from "./timetable-data";

/* -------------------------------------------------------------------------- */
/* The implementations being replaced, copied verbatim from before the change  */
/* -------------------------------------------------------------------------- */

function referenceGetElectiveOptions(
  type: ElectiveType,
  customElectives: TaggedElective[],
): ElectiveOption[] {
  const group = electiveGroups.find((g) => g.type === type);
  const defaultOptions = group?.options || [];
  const customOptions = customElectives
    .filter((e) => e.groupType === type)
    .map(({ groupType, ...rest }) => rest as ElectiveOption);

  const projectOption = type === "OE" ? [studentProjectOption] : [];

  return [...defaultOptions, ...customOptions, ...projectOption];
}

function referenceGetSelectedElective(
  type: ElectiveType,
  selections: Partial<Record<ElectiveType, string>>,
  customElectives: TaggedElective[],
): ElectiveOption | null {
  const selectedId = selections[type];
  if (!selectedId) return null;
  if (isStudentProject(type, selectedId)) return null;

  const options = referenceGetElectiveOptions(type, customElectives);
  return options.find((opt) => opt.id === selectedId) || null;
}

/* -------------------------------------------------------------------------- */

function custom(type: ElectiveType, id: string, name: string): TaggedElective {
  return {
    id,
    abbreviation: name.slice(0, 4).toUpperCase(),
    code: "CUSTOM",
    name,
    faculty: [{ name: "TBD" }],
    groupType: type,
  };
}

const CUSTOM_SETS: { label: string; electives: TaggedElective[] }[] = [
  { label: "none", electives: [] },
  {
    label: "one per basket",
    electives: electiveTypes.map((t, i) => custom(t, `custom-${t}-${i}`, `Custom ${t}`)),
  },
  {
    label: "several in one basket",
    electives: [
      custom("PE-3", "custom-a", "Alpha"),
      custom("PE-3", "custom-b", "Beta"),
      custom("OE", "custom-c", "Gamma"),
    ],
  },
  {
    // A hand-edited backup could carry an id that collides with a real one.
    label: "id colliding with a catalogue option",
    electives: [custom("PE-3", electiveGroups[0].options[0].id, "Impostor")],
  },
];

describe("buildOptionsByType matches getElectiveOptions", () => {
  for (const { label, electives } of CUSTOM_SETS) {
    test(`custom electives: ${label}`, () => {
      const byType = buildOptionsByType(electives);
      for (const type of electiveTypes) {
        const expected = referenceGetElectiveOptions(type, electives);
        expect(byType[type].map((o) => o.id)).toEqual(expected.map((o) => o.id));
        expect(byType[type]).toEqual(expected);
      }
    });
  }

  test("the student project is offered in OE only, and last", () => {
    const byType = buildOptionsByType([]);
    for (const type of electiveTypes) {
      const ids = byType[type].map((o) => o.id);
      if (type === "OE") {
        expect(ids.at(-1)).toBe(STUDENT_PROJECT_ID);
        expect(ids.filter((id) => id === STUDENT_PROJECT_ID)).toHaveLength(1);
      } else {
        expect(ids).not.toContain(STUDENT_PROJECT_ID);
      }
    }
  });

  test("a custom elective still sits behind the catalogue and ahead of the project", () => {
    const byType = buildOptionsByType([custom("OE", "custom-x", "Mine")]);
    const ids = byType.OE.map((o) => o.id);
    const catalogueEnd = electiveGroups.find((g) => g.type === "OE")!.options.length;
    expect(ids[catalogueEnd]).toBe("custom-x");
    expect(ids.at(-1)).toBe(STUDENT_PROJECT_ID);
  });
});

describe("resolveSelections matches getSelectedElective", () => {
  for (const { label, electives } of CUSTOM_SETS) {
    test(`every option in every basket resolves the same — custom: ${label}`, () => {
      const index = buildOptionIndex(buildOptionsByType(electives));
      let checked = 0;

      for (const type of electiveTypes) {
        for (const option of referenceGetElectiveOptions(type, electives)) {
          const selections = { [type]: option.id } as Partial<Record<ElectiveType, string>>;
          expect(resolveSelections(selections, index)[type]).toEqual(
            referenceGetSelectedElective(type, selections, electives),
          );
          checked += 1;
        }
      }

      expect(checked).toBeGreaterThan(270);
    });
  }

  test("unset, unknown and student-project selections all resolve to null", () => {
    const index = buildOptionIndex(buildOptionsByType([]));
    const cases: Partial<Record<ElectiveType, string>>[] = [
      {},
      { "PE-3": "" },
      { "PE-3": "no-such-course" },
      { OE: STUDENT_PROJECT_ID },
    ];
    for (const selections of cases) {
      const resolved = resolveSelections(selections, index);
      for (const type of electiveTypes) {
        expect(resolved[type]).toBe(referenceGetSelectedElective(type, selections, []));
      }
    }
  });

  test("the project sentinel on a program elective does not delete a class", () => {
    // `isStudentProject` is scoped to OE precisely so a hand-edited backup
    // cannot blank out a compulsory elective. It should simply not resolve.
    const index = buildOptionIndex(buildOptionsByType([]));
    const resolved = resolveSelections({ "PE-3": STUDENT_PROJECT_ID }, index);
    expect(resolved["PE-3"]).toBeNull();
    expect(referenceGetSelectedElective("PE-3", { "PE-3": STUDENT_PROJECT_ID }, [])).toBeNull();
  });

  test("a selection resolves only within its own basket", () => {
    const index = buildOptionIndex(buildOptionsByType([]));
    const pe4Id = electiveGroups.find((g) => g.type === "PE-4")!.options[0].id;
    // The same id asked for under PE-3 must not resolve to PE-4's course.
    expect(resolveSelections({ "PE-3": pe4Id }, index)["PE-3"]).toBeNull();
    expect(resolveSelections({ "PE-4": pe4Id }, index)["PE-4"]).not.toBeNull();
  });
});

describe("identity is stable, which is the point of the indices", () => {
  test("resolving twice from one index yields the very same objects", () => {
    const index = buildOptionIndex(buildOptionsByType([custom("PE-3", "custom-a", "Alpha")]));
    const selections: Partial<Record<ElectiveType, string>> = {
      "PE-3": "custom-a",
      "PE-4": electiveGroups[1].options[0].id,
    };
    const first = resolveSelections(selections, index);
    const second = resolveSelections(selections, index);
    for (const type of electiveTypes) expect(first[type]).toBe(second[type]);
  });

  test("the old code could not do that for custom electives", () => {
    // Documents why this mattered: the reference implementation rebuilt the
    // option object each call, so `===` was never true and no downstream
    // memo could hold.
    const electives = [custom("PE-3", "custom-a", "Alpha")];
    const a = referenceGetSelectedElective("PE-3", { "PE-3": "custom-a" }, electives);
    const b = referenceGetSelectedElective("PE-3", { "PE-3": "custom-a" }, electives);
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });
});
