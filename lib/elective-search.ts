// Search and filtering for the elective pick-lists.
//
// Baskets run to ~50 options each, most of them from other departments, so the
// two things that make picking fast are (a) narrowing to your own department
// and (b) being able to type the abbreviation you actually know the course by
// ("DL", "HCI", "XAI") rather than its catalogue code.

import type { ElectiveOption } from "@/lib/timetable-data";

/** The department whose offerings this section actually takes. */
export const HOME_DEPARTMENT = "ICT";

/** Strip case and separators so "ict4442", "ICT 4442" and "ICT-4442" all match. */
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function isHomeDepartment(option: ElectiveOption): boolean {
  return normalize(option.code).startsWith(normalize(HOME_DEPARTMENT));
}

export function countHomeDepartment(options: ElectiveOption[]): number {
  return options.filter(isHomeDepartment).length;
}

/**
 * Lower score = better match. `null` means the option does not match at all.
 *
 * Abbreviation hits rank above code hits, which rank above name hits, so typing
 * "dl" surfaces Deep Learning's sections before any course merely containing
 * "dl" in its title (e.g. "Wor(dl)dwide"). Within a rank, prefix beats
 * substring.
 */
export function scoreOption(option: ElectiveOption, query: string): number | null {
  const q = normalize(query);
  if (!q) return 0;

  // The section suffix ("DL [E]") is noise for matching; compare the bare
  // abbreviation too so "dl" prefix-matches rather than only substring-matches.
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

/**
 * Filter to matches and order them best-first, keeping the incoming order
 * (ICT-first, then by code) as the tie-break so results stay stable.
 */
export function searchOptions(
  options: ElectiveOption[],
  query: string,
): ElectiveOption[] {
  if (!query.trim()) return options;

  return options
    .map((option, index) => ({ option, index, score: scoreOption(option, query) }))
    .filter((entry): entry is { option: ElectiveOption; index: number; score: number } =>
      entry.score !== null,
    )
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map((entry) => entry.option);
}
