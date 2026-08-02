/**
 * Behaviour parity for elective search.
 *
 * Two things changed that could silently reorder a pick-list: the per-option
 * strings are now cached rather than rebuilt per keystroke, and the ranking is a
 * counting sort rather than `Array#sort` with a (score, index) comparator. Both
 * are supposed to be invisible.
 *
 * So this runs the new implementation against a verbatim copy of the old one
 * over every option in the catalogue and a wide spread of queries — including
 * every prefix of every abbreviation, which is what someone typing actually
 * produces — and asserts the results are identical *in order*, not merely as
 * sets.
 *
 * Run with `bun test`.
 */

import { describe, expect, test } from "bun:test";
import { scoreOption, searchOptions } from "./elective-search";
import { electiveOptions } from "./elective-options";
import type { ElectiveOption, ElectiveType } from "./timetable-data";

/* -------------------------------------------------------------------------- */
/* The implementation being replaced, copied verbatim from before the change   */
/* -------------------------------------------------------------------------- */

function normalize(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function referenceScoreOption(option: ElectiveOption, query: string): number | null {
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

function referenceSearchOptions(
    options: ElectiveOption[],
    query: string,
): ElectiveOption[] {
    if (!query.trim()) return options;

    return options
        .map((option, index) => ({ option, index, score: referenceScoreOption(option, query) }))
        .filter(
            (entry): entry is { option: ElectiveOption; index: number; score: number } =>
                entry.score !== null,
        )
        .sort((a, b) => a.score - b.score || a.index - b.index)
        .map((entry) => entry.option);
}

/* -------------------------------------------------------------------------- */

const BASKETS = Object.entries(electiveOptions) as [ElectiveType, ElectiveOption[]][];
const ALL = BASKETS.flatMap(([, options]) => options);

/** Everything someone can type on the way to a real course name. */
const QUERIES = (() => {
    const queries = new Set<string>([
        "",
        " ",
        "   ",
        "!!!",
        "-",
        "zzzz",
        "deep learning",
        "ICT 4403",
        "ict-4403",
        "ict4403",
        "IcT 44",
    ]);
    for (const option of ALL) {
        const abbreviation = option.abbreviation.replace(/\s*\[.*\]\s*$/, "");
        for (let i = 1; i <= abbreviation.length; i += 1) queries.add(abbreviation.slice(0, i));
        for (let i = 1; i <= Math.min(option.code.length, 8); i += 1) queries.add(option.code.slice(0, i));
    }
    return [...queries];
})();

describe("searchOptions matches the implementation it replaces", () => {
    for (const [type, options] of BASKETS) {
        test(`${type}: ${options.length} options x ${QUERIES.length} queries, order included`, () => {
            for (const query of QUERIES) {
                const actual = searchOptions(options, query);
                const expected = referenceSearchOptions(options, query);
                // Compare ids so a failure prints something readable.
                expect(actual.map((o) => o.id)).toEqual(expected.map((o) => o.id));
            }
        });
    }

    test("an empty query hands back the same array, not a copy", () => {
        // The pick-list memoises on this identity to skip re-rendering.
        for (const [, options] of BASKETS) {
            expect(searchOptions(options, "")).toBe(options);
            expect(searchOptions(options, "   ")).toBe(options);
            // Punctuation that normalises away counts as empty too.
            expect(searchOptions(options, "!!!")).toBe(options);
        }
    });

    test("ranking survives: an exact abbreviation beats a name that merely contains it", () => {
        const options = electiveOptions["PE-3"];
        const results = searchOptions(options, "cfcl");
        expect(results[0].abbreviation).toStartWith("CFCL");
    });

    test("a section suffix does not block a prefix match", () => {
        // "FGAI [E]" must be reachable by typing "fga", not just "fgai [".
        const results = searchOptions(electiveOptions["PE-3"], "fga");
        expect(results.map((o) => o.abbreviation)).toContain("FGAI [E]");
    });

    test("results are always a subset of the basket, in one copy each", () => {
        for (const [, options] of BASKETS) {
            for (const query of ["a", "e", "in", "ict"]) {
                const results = searchOptions(options, query);
                expect(new Set(results).size).toBe(results.length);
                for (const result of results) expect(options).toContain(result);
            }
        }
    });
});

describe("scoreOption matches the implementation it replaces", () => {
    test(`${ALL.length} options x a sample of queries`, () => {
        const sample = QUERIES.filter((_, i) => i % 7 === 0);
        let checked = 0;
        for (const option of ALL) {
            for (const query of sample) {
                expect(scoreOption(option, query)).toBe(referenceScoreOption(option, query));
                checked += 1;
            }
        }
        expect(checked).toBeGreaterThan(10_000);
    });

    test("the field cache does not leak between options", () => {
        // Two options sharing a code but not an abbreviation must not score alike.
        const [a, b] = electiveOptions["PE-3"].filter((o) => o.code === "ICT 4403");
        expect(a).toBeDefined();
        expect(b).toBeDefined();
        expect(scoreOption(a, a.abbreviation)).toBe(referenceScoreOption(a, a.abbreviation));
        expect(scoreOption(b, a.abbreviation)).toBe(referenceScoreOption(b, a.abbreviation));
    });

    test("repeated calls for one option stay correct after caching", () => {
        const option = ALL[0];
        const first = scoreOption(option, "ict");
        expect(scoreOption(option, "ict")).toBe(first);
        expect(scoreOption(option, "zzz")).toBe(referenceScoreOption(option, "zzz"));
        expect(scoreOption(option, "ict")).toBe(first);
    });
});
