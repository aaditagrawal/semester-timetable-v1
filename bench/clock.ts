/**
 * The clock's per-render cost.
 *
 * The header calls `getFormattedTime()` and `getFormattedDate()` during render,
 * and each one went through `Date#toLocaleTimeString(locale, options)`. Passing
 * an options object means the engine has to resolve it to a format every call;
 * a hoisted `Intl.DateTimeFormat` resolves once and reuses the result.
 *
 * This is small next to the real win in this PR — ticking 60x less often — but
 * it is the part that runs on *every* render, including the ones caused by
 * something else entirely.
 */

import { bench } from "./harness";
import { formatTime } from "../lib/hooks/use-current-time";

const NOW = new Date(2026, 7, 25, 11, 45, 30);

const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", DATE_OPTIONS);

// Parity: the replacements must produce byte-identical output.
const before = `${NOW.toLocaleTimeString("en-US", TIME_OPTIONS)}|${NOW.toLocaleDateString("en-US", DATE_OPTIONS)}`;
const after = `${formatTime(NOW)}|${dateFormatter.format(NOW)}`;
if (before !== after) throw new Error(`formatter mismatch:\n  ${before}\n  ${after}`);
console.log(`parity check passed: ${after}`);

bench("header strings, once per render", [
  {
    name: "before: toLocaleTimeString + toLocaleDateString with options",
    fn: () =>
      NOW.toLocaleTimeString("en-US", TIME_OPTIONS) + NOW.toLocaleDateString("en-US", DATE_OPTIONS),
  },
  {
    name: "after: getHours/getMinutes + zone-checked date formatter",
    fn: () => formatTime(NOW) + dateFormatter.format(NOW),
  },
]);

/* -------------------------------------------------------------------------- */

/**
 * Renders per hour, which is the number that actually matters. Nothing the app
 * displays has second granularity: the badge shows HH:MM, and every slot edge
 * in `timeSlots` falls on a minute boundary.
 */
const ticksPerHour = { before: 3600, after: 60 };
console.log(
  `\nre-renders per hour: ${ticksPerHour.before} -> ${ticksPerHour.after}` +
    ` (${(ticksPerHour.before / ticksPerHour.after).toFixed(0)}x fewer)`,
);
