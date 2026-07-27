#!/usr/bin/env python3
"""Regenerate lib/elective-options.ts from the published allocation data.

Usage:
    curl -sL https://raw.githubusercontent.com/aaditagrawal/elective-cutoffs/HEAD/data/seventh-semester.json -o /tmp/sem.json
    python3 scripts/generate-elective-options.py /tmp/sem.json

Course codes and names come from that dataset. Section rooms are not in it, so
the ICT/CCE ones are transcribed by hand into SECTIONS below from the School of
Computer Engineering room allocation sheet — update that table each semester.

Only those ICT/CCE offerings have an official short name. Everything else gets
an initialism derived from its course name (see `abbreviate`), falling back to
the course code where no unambiguous one exists.
"""

import sys

import collections, json, re

SOURCE = sys.argv[1] if len(sys.argv) > 1 else 'sem7.json'
d = json.load(open(SOURCE))
els = d['electives']

TYPE_MAP = {
    'PE III': 'PE-3', 'PE IV': 'PE-4', 'PE V': 'PE-5',
    'PE VI': 'PE-6', 'PE VII': 'PE-7', 'OE III': 'OE',
}

# Section -> room, from the official CCE/ICT allocation sheet.
SECTIONS = {
    'ICT 4403': ('FGAI', {'E': 'AB5-314', 'F': 'AB5-315'}),
    'ICT 4413': ('CFCL', {'E': 'AB5-316'}),
    'ICT 4404': ('NCA',  {'E': 'AB5-313', 'F': 'AB5-314'}),
    'ICT 4415': ('BT',   {'E': 'AB5-315', 'F': 'AB5-316'}),
    'ICT 4442': ('DL',   {'E': 'AB5-310A', 'F': 'AB5-310B', 'G': 'AB5-311',
                          'H': 'AB5-312', 'I': 'AB5-313', 'J': 'AB5-314'}),
    'ICT 4451': ('CVA',  {'E': 'AB5-315'}),
    'ICT 4447': ('HCI',  {'E': 'AB5-310B', 'F': 'AB5-310A', 'G': 'AB5-311',
                          'H': 'AB5-312', 'I': 'AB5-313'}),
    'ICT 4450': ('SR',   {'E': 'AB5-314', 'F': 'AB5-315'}),
    'ICT 4441': ('CC',   {'E': 'AB5-310A', 'F': 'AB5-310B', 'G': 'AB5-311'}),
    'ICT 4444': ('XAI',  {'E': 'AB5-312', 'F': 'AB5-313', 'G': 'AB5-314'}),
    'ICT 4445': ('GTA',  {'E': 'AB5-315'}),
}

# Source sheets are ALL CAPS, so titlecasing is needed — but it mangles the
# acronyms and roman numerals these course names are full of ("AI" -> "Ai").
ACRONYMS = {
    'AI', 'IC', 'ICS', 'EV', 'EVS', 'IOT', 'IIOT', 'VLSI', 'GIS', 'ML', 'NLP',
    'CAD', 'CAM', 'CFD', 'RF', 'UAV', 'HVAC', 'LED', 'GPS', 'SQL', 'API', 'UI',
    'UX', 'PCB', 'EMI', 'EMC', 'DSP', 'FPGA', 'ASIC', 'MEMS', 'RFID', 'BIM',
    'ERP', 'CRM', 'CMOS', 'FEA', 'HR', 'IT', 'OS', 'DBMS', 'AR', 'VR', 'XR',
    '3D', '2D', 'L&T',
}
NUMERALS = {'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'}
MINOR = {'and', 'for', 'of', 'in', 'to', 'the', 'with', 'a', 'an', 'on', 'its'}


def title(s):
    words = ' '.join(s.split()).split(' ')
    out = []
    for i, w in enumerate(words):
        # Keep punctuation attached while testing the bare token.
        core = w.strip('(),:-&').upper()
        if core in ACRONYMS or core in NUMERALS:
            out.append(w.upper())
            continue
        lowered = w.lower()
        if i > 0 and lowered in MINOR:
            out.append(lowered)
            continue
        out.append(w.capitalize() if w.isupper() or w.islower() else w.title())
    return ' '.join(out)

# Hand-written short names win over the derived ones, for when an initialism
# reads badly. Keyed by course code. The ICT/CCE offerings get theirs from
# SECTIONS instead, since those are the official ones off the allocation sheet.
ABBREVIATIONS = {}

# An initialism is only useful if it is shorter than the code it replaces and
# still says something; past six letters it is neither, so those keep the code.
MAX_LETTERS = 6


def abbreviate(name):
    """Derive a tile-sized short name from a course name, or None if there
    isn't a good one. "Music & Neuroengineering" -> "MN"."""
    # Trailing qualifiers like "(theory & Lab)" or "(L&T)" say nothing about
    # which course this is.
    words = [w for w in re.split(r'[\s\-/,:.+]+', re.sub(r'\([^)]*\)', ' ', name)) if w]

    letters, numerals = [], []
    for w in words:
        core = w.strip('&').upper()
        if not core:
            continue
        # "Part III" / "French I" — the numeral is the whole distinction
        # between two courses, so it survives as a suffix.
        if core in NUMERALS:
            numerals.append(core)
        elif w.lower() in MINOR:
            continue
        elif core in ACRONYMS:
            letters.append(core)
        else:
            initial = next((ch for ch in w if ch.isalnum()), '')
            if initial:
                letters.append(initial.upper())

    abbr = ''.join(letters)
    if not abbr or len(abbr) > MAX_LETTERS:
        return None
    # A one-word name initialises to a single letter, which labels nothing —
    # the word itself is already the short name ("Yoga", "Nanomedicine").
    if len(abbr) == 1:
        return None if len(words) > 1 else words[0]
    return f'{abbr} {numerals[-1]}' if numerals else abbr


def esc(s):
    return s.replace('\\', '\\\\').replace('"', '\\"')

def slug(code, extra=''):
    return re.sub(r'[^a-z0-9]+', '-', (code + extra).lower()).strip('-')

# Derive every short name up front so collisions can be resolved before any of
# them is used. Two tiles reading the same thing is worse than a course code:
# "Computer Vision" is offered by three departments, and Blockchain Technology
# by three more, one of which owns the official "BT". So an official short name
# always wins, and any derived one that is not unique across the whole semester
# gives way to the course code, which is unique by construction.
official = {abbr for abbr, _ in SECTIONS.values()}
derived = {}
for e in els:
    code = e['code']
    if code not in SECTIONS and code not in derived:
        derived[code] = ABBREVIATIONS.get(code) or abbreviate(title(e['name']))

counts = collections.Counter(a for a in derived.values() if a)
for code, abbr in derived.items():
    if abbr and (abbr in official or counts[abbr] > 1) and code not in ABBREVIATIONS:
        derived[code] = None

groups = {v: [] for v in TYPE_MAP.values()}
for e in els:
    t = TYPE_MAP[e['type']]
    code, name = e['code'], title(e['name'])
    if code in SECTIONS:
        abbr, rooms = SECTIONS[code]
        for sec, room in rooms.items():
            groups[t].append({
                'id': slug(code, '-' + sec), 'abbreviation': f'{abbr} [{sec}]',
                'code': code, 'name': name, 'room': room,
            })
    else:
        groups[t].append({
            'id': slug(code), 'abbreviation': derived[code] or code, 'code': code,
            'name': name, 'room': None,
        })

out = ['// Sem VII elective baskets.',
       '// Course codes and names generated from the official allocation sheets',
       '// published at https://github.com/aaditagrawal/elective-cutoffs',
       '// (data/seventh-semester.json). Section rooms for the ICT/CCE offerings come',
       '// from the School of Computer Engineering room allocation sheet, as do their',
       '// short names; every other abbreviation is an initialism derived from the',
       '// course name, or the course code where no unambiguous one exists.',
       '//',
       '// Ordered ICT-first within each basket, then by course code.',
       '//',
       '// Generated file - do not edit by hand.',
       '// Regenerate: python3 scripts/generate-elective-options.py <dataset.json>',
       '',
       '// Type-only import: erased at compile time, so no runtime cycle with timetable-data.',
       'import type { ElectiveOption, ElectiveType } from "@/lib/timetable-data";',
       '',
       'export const electiveOptions: Record<ElectiveType, ElectiveOption[]> = {']

for t in ['PE-3', 'PE-4', 'PE-5', 'PE-6', 'PE-7', 'OE']:
    out.append(f'  "{t}": [')
    # ICT offerings first: this is the IT_CCE section, so its own department's
    # courses are the ones students actually pick from.
    for o in sorted(groups[t], key=lambda x: (not x['code'].startswith('ICT'),
                                              x['code'], x['id'])):
        out.append('    {')
        out.append(f'      id: "{o["id"]}",')
        out.append(f'      abbreviation: "{esc(o["abbreviation"])}",')
        out.append(f'      code: "{o["code"]}",')
        out.append(f'      name: "{esc(o["name"])}",')
        out.append('      faculty: [{ name: "TBD" }],')
        if o['room']:
            out.append(f'      room: "{o["room"]}",')
        out.append('    },')
    out.append('  ],')
out.append('};')
out.append('')

import os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
open(os.path.join(root, 'lib', 'elective-options.ts'), 'w').write('\n'.join(out))
for t in ['PE-3','PE-4','PE-5','PE-6','PE-7','OE']:
    print(t, len(groups[t]))
