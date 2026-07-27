#!/usr/bin/env python3
"""Build lib/allocation-index.ts from the published PE allocation export.

    python3 scripts/build-allocation-index.py ~/Downloads/pe-finder.html

The source export inlines every student's NAME, registration number and
elective allocations as JSON in a single HTML page. Names are dropped here and
never written to disk — the app fills course slots, not identities, so it has
no use for them. Registration numbers are kept in the clear: the export is
already circulated publicly, and keying on the raw number is what lets the
runtime lookup stay synchronous (see below).

Layout is struct-of-arrays, chosen so the search touches as little memory as
possible:

    REGS     Uint32Array, sorted ascending          4 bytes x N
    PAYLOAD  five (courseIndex, sectionIndex) pairs 10 bytes x N

Binary search reads only REGS. At N=2250 that is a ~9 KiB array which sits
entirely in L1, so the whole search is a handful of cache-resident loads. The
payload is touched exactly once, after the index is known. Interleaving the two
(array-of-structs) would make every probe pull a 14-byte stride through 31 KiB
instead, for no benefit.

courseIndex 0xFF means the slot is unallocated; sectionIndex 0xFF means none.
"""

import base64
import json
import os
import re
import sys

SLOTS = ["PE3", "PE4", "PE5", "PE6", "PE7"]
PAYLOAD_BYTES = 2 * len(SLOTS)
NONE = 0xFF

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "lib", "allocation-index.ts")


def parse(path):
    src = open(path, encoding="utf-8", errors="replace").read()
    match = re.search(r"const students=(\{.*?\});", src, re.S)
    if not match:
        sys.exit(f"No `const students={{...}}` blob found in {path}")
    return json.loads(match.group(1))


def course_code(raw):
    """'AAE 4402 : ELECTIVE -TURBOMACHINERY AERODYNAMICS' -> 'AAE 4402'."""
    m = re.match(r"([A-Z]{3})\s*(\d{4})", raw)
    return f"{m.group(1)} {m.group(2)}" if m else None


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    students = parse(sys.argv[1])

    codes = sorted(
        {
            code
            for s in students.values()
            for pe in s["pes"].values()
            if (code := course_code(pe["course"]))
        }
    )
    if len(codes) >= NONE:
        sys.exit(f"{len(codes)} codes exceeds the single-byte index")
    code_index = {c: i for i, c in enumerate(codes)}

    rows = []
    skipped = 0
    for reg, student in students.items():
        reg = str(reg).strip()
        if not reg.isdigit() or not (0 < int(reg) < 2**32):
            skipped += 1
            continue

        payload = bytearray()
        for slot in SLOTS:
            pe = student.get("pes", {}).get(slot)
            code = course_code(pe["course"]) if pe else None
            if code is None:
                payload += bytes([NONE, NONE])
                continue
            section = (pe.get("section") or "").strip().upper()
            section_index = (
                ord(section) - ord("A") if len(section) == 1 and section.isalpha() else NONE
            )
            payload += bytes([code_index[code], section_index])
        rows.append((int(reg), bytes(payload)))

    # Sorting is what makes the runtime binary search possible.
    rows.sort(key=lambda r: r[0])
    if len({r[0] for r in rows}) != len(rows):
        sys.exit("duplicate registration numbers in source")

    regs = b"".join(r[0].to_bytes(4, "little") for r in rows)
    payload = b"".join(r[1] for r in rows)

    code_lines = ",\n  ".join(f'"{c}"' for c in codes)
    out = f'''// Packed PE allocation index. GENERATED — do not edit by hand.
// Rebuild: python3 scripts/build-allocation-index.py <pe-finder.html>
//
// Contains NO student names. Struct-of-arrays so binary search touches only
// the {len(rows) * 4 / 1024:.1f} KiB registration array; see the build script for why.
//
// {len(rows)} records: Uint32 reg + {PAYLOAD_BYTES} payload bytes each.

export const RECORD_COUNT = {len(rows)};
export const PAYLOAD_BYTES = {PAYLOAD_BYTES};
export const NONE = 0x{NONE:02X};

/** PE-3..PE-7, matching the pair order within each payload. */
export const SLOT_ORDER = ["PE-3", "PE-4", "PE-5", "PE-6", "PE-7"] as const;

/** Course codes, indexed by the courseIndex byte. */
export const COURSE_CODES: string[] = [
  {code_lines},
];

/** Registration numbers, ascending, little-endian Uint32. */
export const PACKED_REGS =
  "{base64.b64encode(regs).decode()}";

/** Allocation payloads, parallel to PACKED_REGS. */
export const PACKED_PAYLOAD =
  "{base64.b64encode(payload).decode()}";
'''
    open(OUT, "w").write(out)

    total = len(regs) + len(payload)
    print(f"records:  {len(rows)}" + (f" ({skipped} skipped)" if skipped else ""))
    print(f"codes:    {len(codes)}")
    print(f"regs:     {len(regs) / 1024:.1f} KiB  (searched)")
    print(f"payload:  {len(payload) / 1024:.1f} KiB  (touched once)")
    print(f"total:    {total / 1024:.1f} KiB binary, "
          f"{(len(regs) + len(payload)) * 4 / 3 / 1024:.1f} KiB base64")
    print(f"wrote:    {os.path.relpath(OUT, ROOT)}")


if __name__ == "__main__":
    main()
