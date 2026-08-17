/**
 * Tiny benchmark harness. No dependencies — `bun run bench/<name>.ts`.
 *
 * The absolute numbers are only meaningful against each other on the same
 * machine; what these benchmarks are for is proving a change moved the number
 * in the right direction, and by how much, rather than publishing a figure.
 *
 * Reports the *minimum* of three timed rounds. Every source of error here — GC,
 * scheduling, thermal throttling — only ever adds time, so the minimum is the
 * least noisy estimator of the underlying cost.
 */

export interface Case {
  name: string;
  /**
   * The thing being timed. Whatever it returns is discarded — the return value
   * exists only to keep the engine from eliding the work — so it is typed
   * `void`, which accepts a function returning anything.
   */
  fn: () => void;
  /** Logical units per call, when one call does N of them (e.g. 54 grid cells). */
  unitsPerOp?: number;
  /**
   * Name of the case this one should be compared against. Defaults to the first
   * case in the group.
   *
   * Without this a group of more than two cases silently ratios everything
   * against case 0 — which is how an untouched baseline ended up printed as
   * "1.9x SLOWER" against a different function entirely. If you are measuring
   * two independent before/after pairs, either set this or use two groups.
   */
  baselineOf?: string;
}

const ROUND_MS = 400;
const WARMUP_MS = 100;
/** Batch size between clock reads, so `performance.now` is not what is measured. */
const BATCH = 64;

/** One timed round: how many calls were made, and how long they took. */
interface Round {
  iters: number;
  elapsed: number;
}

function runFor(fn: () => void, ms: number): Round {
  const start = performance.now();
  let iters = 0;
  let elapsed = 0;
  do {
    for (let i = 0; i < BATCH; i += 1) fn();
    iters += BATCH;
    elapsed = performance.now() - start;
  } while (elapsed < ms);
  return { iters, elapsed };
}

export function bench(title: string, cases: Case[]): void {
  console.log(`\n${title}`);
  console.log("-".repeat(title.length));

  const results = cases.map((c) => {
    runFor(c.fn, WARMUP_MS);
    let best = Infinity;
    for (let round = 0; round < 3; round += 1) {
      const { iters, elapsed } = runFor(c.fn, ROUND_MS);
      best = Math.min(best, (elapsed * 1e6) / iters);
    }
    const units = c.unitsPerOp ?? 1;
    return { name: c.name, nsPerOp: best, nsPerUnit: best / units, baselineOf: c.baselineOf };
  });

  const byName = new Map(results.map((r) => [r.name, r]));
  const width = Math.max(...results.map((r) => r.name.length));

  for (const r of results) {
    const baseline = r.baselineOf ? byName.get(r.baselineOf) : results[0];
    if (!baseline) {
      throw new Error(
        `bench "${title}": case "${r.name}" names an unknown baseline "${r.baselineOf}"`,
      );
    }
    const ratio = baseline.nsPerOp / r.nsPerOp;
    const delta =
      r === baseline
        ? ""
        : `  ${ratio >= 1 ? `${ratio.toFixed(1)}x faster` : `${(1 / ratio).toFixed(1)}x SLOWER`}` +
          (r.baselineOf ? ` than ${r.baselineOf}` : "");
    const perUnit = r.nsPerUnit !== r.nsPerOp ? `  (${fmt(r.nsPerUnit)}/unit)` : "";
    console.log(`  ${r.name.padEnd(width)}  ${fmt(r.nsPerOp).padStart(10)}${perUnit}${delta}`);
  }
}

function fmt(ns: number): string {
  if (ns >= 1e6) return `${(ns / 1e6).toFixed(2)} ms`;
  if (ns >= 1e3) return `${(ns / 1e3).toFixed(2)} µs`;
  return `${ns.toFixed(1)} ns`;
}
