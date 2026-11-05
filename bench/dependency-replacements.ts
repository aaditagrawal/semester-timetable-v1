// Run with the packageManager-pinned Bun. Baseline sources come from git, never a checkout.
import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { classNames } from "@/ui.stylex";
import { cn } from "@/lib/utils";
import type { ClassValue } from "clsx";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge, badgeVariants } from "@/components/ui/badge";

const base = "4bedb57856b0a52eb74be1dcc92904a4da22fdef";
const root = resolve(import.meta.dir, "..");
const manifest = await Bun.file(join(root, "package.json")).json();
assert.equal(`bun@${Bun.version}`, manifest.packageManager, "Use the pinned Bun for both versions");
const directory = mkdtempSync(join(root, "node_modules/.dependency-bench-"));
let sink = 0;

function source(path: string): string {
  const result = Bun.spawnSync(["git", "show", `${base}:${path}`], { cwd: root });
  assert.equal(result.exitCode, 0, result.stderr.toString());
  return result.stdout.toString();
}

function timed(run: () => string, iterations: number) {
  const cpu = process.cpuUsage();
  const start = performance.now();
  for (let iteration = 0; iteration < iterations; iteration++) sink += run().length;
  const wall = performance.now() - start;
  const active = process.cpuUsage(cpu);
  return {
    wall_us: (wall * 1_000) / iterations,
    cpu_us: (active.user + active.system) / iterations,
  };
}

function summary(samples: number[]) {
  const sorted = samples.toSorted((a, b) => a - b);
  return {
    median_us: sorted[Math.floor(sorted.length / 2)],
    p95_us: sorted[Math.ceil(sorted.length * 0.95) - 1],
    min_us: sorted[0],
    max_us: sorted.at(-1),
    samples_us: samples,
  };
}

function warm(run: () => string): number {
  let iterations = 0;
  let active = 0;
  while (active < 100_000) {
    active += timed(run, 2_000).cpu_us * 2_000;
    iterations += 2_000;
  }
  return iterations;
}

function compare(name: string, before: () => string, after: () => string) {
  assert.equal(after(), before(), `${name}: behavior parity`);
  const warmup = { baseline: warm(before), candidate: warm(after) };
  const iterations = Math.min(
    1_000_000,
    Math.max(1_000, Math.ceil(50_000 / timed(before, 2_000).cpu_us)),
  );
  const baseline: ReturnType<typeof timed>[] = [];
  const candidate: ReturnType<typeof timed>[] = [];
  for (let sample = 0; sample < 11; sample++) {
    if (sample % 2 === 0) {
      baseline.push(timed(before, iterations));
      candidate.push(timed(after, iterations));
    } else {
      candidate.push(timed(after, iterations));
      baseline.push(timed(before, iterations));
    }
  }
  const old = {
    wall: summary(baseline.map((s) => s.wall_us)),
    cpu: summary(baseline.map((s) => s.cpu_us)),
  };
  const replacement = {
    wall: summary(candidate.map((s) => s.wall_us)),
    cpu: summary(candidate.map((s) => s.cpu_us)),
  };
  console.error(
    `${name}: CPU ${old.cpu.median_us.toFixed(3)} -> ${replacement.cpu.median_us.toFixed(3)} us; wall ${old.wall.median_us.toFixed(3)} -> ${replacement.wall.median_us.toFixed(3)} us`,
  );
  return {
    name,
    iterations,
    warmup_iterations: warmup,
    baseline: old,
    candidate: replacement,
    cpu_ratio: replacement.cpu.median_us / old.cpu.median_us,
    wall_ratio: replacement.wall.median_us / old.wall.median_us,
  };
}

try {
  const lock = source("bun.lock");
  const lockedVersion = (name: string) => {
    const match = lock.match(new RegExp(`"${name}": \\["${name}@([^"\\s]+)"`));
    assert.ok(match, `${name} must be locked at baseline`);
    return match[1];
  };
  await Bun.write(
    join(directory, "package.json"),
    JSON.stringify({
      private: true,
      dependencies: {
        clsx: lockedVersion("clsx"),
        "class-variance-authority": lockedVersion("class-variance-authority"),
      },
    }),
  );
  const install = Bun.spawnSync(
    [process.execPath, "install", "--ignore-scripts", "--no-progress"],
    {
      cwd: directory,
      stdout: "pipe",
      stderr: "pipe",
    },
  );
  assert.equal(install.exitCode, 0, install.stderr.toString());
  for (const [path, target] of [
    ["lib/utils.ts", "utils.ts"],
    ["components/ui/button.tsx", "button.tsx"],
    ["components/ui/badge.tsx", "badge.tsx"],
  ]) {
    await Bun.write(
      join(directory, target),
      source(path)
        .replaceAll('"@/ui.stylex"', JSON.stringify(join(root, "ui.stylex.js")))
        .replaceAll('"@/lib/utils"', '"./utils"'),
    );
  }
  const { cn: oldCn } = await import(pathToFileURL(join(directory, "utils.ts")).href);
  const { Button: OldButton, buttonVariants: oldButtonVariants } = await import(
    pathToFileURL(join(directory, "button.tsx")).href
  );
  const { Badge: OldBadge, badgeVariants: oldBadgeVariants } = await import(
    pathToFileURL(join(directory, "badge.tsx")).href
  );
  const fixtures: { name: string; values: ClassValue[] }[] = [
    { name: "cn/small", values: ["plain", false, "caller"] },
    { name: "cn/whitespace", values: [" plain ", ["  last  "], { "": true }] },
    {
      name: "cn/typical-tile",
      values: [classNames.courseTile229, classNames.courseTile230, classNames.weekView242],
    },
    {
      name: "cn/state-override",
      values: [classNames.courseTile231, classNames.courseTile232, classNames.courseTile233],
    },
    {
      name: "cn/nested-conditions",
      values: [
        [classNames.button162, [null, false, classNames.button169]],
        { [classNames.button170]: true, absent: false },
        "caller",
      ],
    },
    {
      name: "cn/large",
      values: Array.from({ length: 60 }, (_, i) => [
        classNames.courseTile229,
        i % 2 === 0 && classNames.courseTile232,
        `caller-${i}`,
      ]),
    },
    {
      name: "cn/adversarial-empty-nesting",
      values: Array.from({ length: 60 }, () => [[false, null, 0], { absent: false }]),
    },
  ];
  const results = fixtures.map(({ name, values }) =>
    compare(
      name,
      () => oldCn(...values),
      () => cn(...values),
    ),
  );
  const variants = [
    undefined,
    null,
    "default",
    "outline",
    "secondary",
    "ghost",
    "destructive",
    "link",
  ] as const;
  const sizes = [
    undefined,
    null,
    "default",
    "xs",
    "sm",
    "lg",
    "icon",
    "icon-xs",
    "icon-sm",
    "icon-lg",
  ] as const;
  for (const variant of variants) {
    for (const size of sizes) {
      const options = { variant, size, class: ["extra", { active: true }], className: "caller" };
      assert.equal(buttonVariants(options), oldButtonVariants(options));
    }
    assert.equal(
      badgeVariants({ variant, className: "caller" }),
      oldBadgeVariants({ variant, className: "caller" }),
    );
  }
  const buttonOptions = {
    variant: "outline",
    size: "sm",
    className: classNames.button170,
  } as const;
  const badgeOptions = { variant: "secondary", className: "caller" } as const;
  const buttonLarge = { ...buttonOptions, className: fixtures[5].values };
  const badgeNested = { ...badgeOptions, className: ["a", { "": true }, "b", 1n, 0n] };
  results.push(
    compare(
      "variants/button-default",
      () => oldButtonVariants(),
      () => buttonVariants(),
    ),
    compare(
      "variants/button-override",
      () => oldButtonVariants(buttonOptions),
      () => buttonVariants(buttonOptions),
    ),
    compare(
      "variants/badge-default",
      () => oldBadgeVariants(),
      () => badgeVariants(),
    ),
    compare(
      "variants/badge-override",
      () => oldBadgeVariants(badgeOptions),
      () => badgeVariants(badgeOptions),
    ),
    compare(
      "variants/button-large",
      () => oldButtonVariants(buttonLarge),
      () => buttonVariants(buttonLarge),
    ),
    compare(
      "variants/badge-nested",
      () => oldBadgeVariants(badgeNested),
      () => badgeVariants(badgeNested),
    ),
    compare(
      "render/button",
      () => renderToStaticMarkup(createElement(OldButton, buttonOptions, "Export")),
      () => renderToStaticMarkup(createElement(Button, buttonOptions, "Export")),
    ),
    compare(
      "render/badge",
      () => renderToStaticMarkup(createElement(OldBadge, badgeOptions, "Selected")),
      () => renderToStaticMarkup(createElement(Badge, badgeOptions, "Selected")),
    ),
  );
  console.log(
    JSON.stringify(
      {
        base,
        runtime: `Bun ${Bun.version}`,
        node_compat_version: process.version,
        samples: 11,
        units: "microseconds per operation",
        method:
          "single process, alternating pairs; 100ms target active-CPU warmup per implementation, 50ms CPU-sized batches, install/import/warmup excluded; wall and process user+system CPU reported separately",
        platform: process.platform,
        arch: process.arch,
        host_io_pressure:
          process.platform === "linux" ? await Bun.file("/proc/pressure/io").text() : undefined,
        results,
        sink,
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
