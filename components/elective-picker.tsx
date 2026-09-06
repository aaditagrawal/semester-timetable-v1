"use client";

import { classNames } from "@/ui.stylex";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { searchOptions } from "@/lib/elective-search";
import type { ElectiveOption, ElectiveType } from "@/lib/timetable-data";
import { CheckIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";

interface ElectivePickerProps {
  type: ElectiveType;
  options: ElectiveOption[];
  query: string;
  onQueryChange: (type: ElectiveType, query: string) => void;
  onSelect: (type: ElectiveType, optionId: string) => void;
}

interface OptionRowProps {
  option: ElectiveOption;
  type: ElectiveType;
  onSelect: (type: ElectiveType, optionId: string) => void;
}

/**
 * Memoised, and taking `onSelect` plus the id rather than a closure over them,
 * so a row's props are unchanged by anything happening in another row — or in
 * another basket. Without this the `onClick={() => ...}` arrow made every row's
 * props new on every keystroke and the memo could never hold.
 */
const OptionRow = React.memo(function OptionRow({ option, type, onSelect }: OptionRowProps) {
  return (
    <button onClick={() => onSelect(type, option.id)} className={classNames.electivePicker311}>
      <div className={classNames.setupModal78}>
        <div className={classNames.electivePicker312}>
          {option.abbreviation}
          {option.room && <span className={classNames.electivePicker313}>{option.room}</span>}
        </div>
        <div className={classNames.home22}>{option.name}</div>
        <div className={classNames.dayView228}>{option.code}</div>
      </div>
      <CheckIcon className={classNames.electivePicker314} />
    </button>
  );
});

/**
 * One basket's search box and pick-list.
 *
 * Split out of `SetupModal` for one reason: a keystroke used to re-render every
 * basket. In the edit view that is all six on screen at once — 275 option rows —
 * re-reconciled per character typed. Memoised, only the basket whose `query`
 * actually changed re-renders; the other five compare equal and stop here.
 *
 * The query itself deliberately stays owned by `SetupModal` rather than living
 * in local state. `SetupModal` never unmounts — both instances are rendered
 * unconditionally, `open` only toggles whether Radix draws the content — so a
 * query held here would be discarded when the dialog closes, where before it
 * survived a close and reopen. That is a small thing, but it is a behaviour
 * change, and this commit is not supposed to have any.
 */
export const ElectivePicker = React.memo(function ElectivePicker({
  type,
  options,
  query,
  onQueryChange,
  onSelect,
}: ElectivePickerProps) {
  // `searchOptions` returns the same array for an empty query, so the rows
  // below keep their identity until something is actually typed.
  const filteredOptions = React.useMemo(() => searchOptions(options, query), [options, query]);

  return (
    <div className={classNames.electivePicker315}>
      <div className={classNames.electivePicker315}>
        <MagnifyingGlassIcon className={classNames.electivePicker316} />
        <Input
          placeholder="Search by abbreviation, code or name..."
          value={query}
          onChange={(e) => onQueryChange(type, e.target.value)}
          className={classNames.electivePicker317}
          aria-label={`Search ${type} courses`}
        />
      </div>
      {/* Always shown, so the basket reads as a pick-list rather than
                something you have to fill in yourself. */}
      <div className={classNames.electivePicker318}>
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <OptionRow key={option.id} option={option} type={type} onSelect={onSelect} />
          ))
        ) : (
          <div className={classNames.electivePicker319}>No results found</div>
        )}
      </div>
    </div>
  );
});
