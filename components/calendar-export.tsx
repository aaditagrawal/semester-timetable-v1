"use client";

import Link from "next/link";

export function CalendarExportLink() {
    return (
        <Link
            href="/export"
            className="text-primary hover:text-primary/80 hover:underline transition-colors"
        >
            Export to Calendar
        </Link>
    );
}
