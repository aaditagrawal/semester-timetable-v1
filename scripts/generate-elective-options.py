#!/usr/bin/env python3
"""Regenerate lib/elective-options.ts from the published allocation data.

Usage:
    curl -sL https://raw.githubusercontent.com/aaditagrawal/elective-cutoffs/HEAD/data/seventh-semester.json -o /tmp/sem.json
    python3 scripts/generate-elective-options.py /tmp/sem.json

Course codes and names come from that dataset. Section rooms are not in it, so
the ICT/CCE ones are transcribed by hand into SECTIONS below from the School of
Computer Engineering room allocation sheet — update that table each semester.
"""

import sys

import json, re

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
    'ICT 4447': ('HCI',  {'E': 'AB5-310A', 'F': 'AB5-310B', 'G': 'AB5-311',
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

def esc(s):
    return s.replace('\\', '\\\\').replace('"', '\\"')

def slug(code, extra=''):
    return re.sub(r'[^a-z0-9]+', '-', (code + extra).lower()).strip('-')

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
            'id': slug(code), 'abbreviation': code, 'code': code, 'name': name,
            'room': None,
        })

out = ['// Sem VII elective baskets.',
       '// Course codes and names generated from the official allocation sheets',
       '// published at https://github.com/aaditagrawal/elective-cutoffs',
       '// (data/seventh-semester.json). Section rooms for the ICT/CCE offerings come',
       '// from the School of Computer Engineering room allocation sheet.',
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
