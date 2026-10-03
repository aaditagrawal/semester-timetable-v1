import { expect, test } from "bun:test";
import { isValidCustomElective } from "./use-timetable";

test("custom course records require the fields rendered by setup and details", () => {
  const valid = {
    id: "custom-1",
    abbreviation: "Course",
    code: "ABC 1234",
    name: "Course",
    groupType: "OE" as const,
    faculty: [{ name: "Teacher" }],
  };
  expect(isValidCustomElective(valid)).toBe(true);
  for (const field of ["id", "abbreviation", "code", "name", "faculty"]) {
    // A parsed JSON payload has no TypeScript guarantees.
    const invalid = JSON.parse(JSON.stringify(valid));
    delete invalid[field];
    expect(isValidCustomElective(invalid)).toBe(false);
  }
  expect(isValidCustomElective({ ...valid, faculty: JSON.parse("[null]") })).toBe(false);
});
