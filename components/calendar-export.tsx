"use client";

import { classNames } from "@/ui.stylex";

import Link from "next/link";

export function CalendarExportLink() {
  return (
    <Link href="/export" className={classNames.calendarExport284}>
      Export to Calendar
    </Link>
  );
}
