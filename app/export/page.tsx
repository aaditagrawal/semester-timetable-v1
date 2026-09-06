"use client";

import { classNames } from "@/ui.stylex";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, DownloadIcon, CheckIcon, CalendarIcon } from "@phosphor-icons/react";
import { downloadICS } from "@/lib/calendar-export";
import { UserElectiveSelections, CustomElective } from "@/lib/hooks/use-timetable";

const STORAGE_KEY = "timetable-electives";
const CUSTOM_ELECTIVES_KEY = "timetable-custom-electives";

/** Rough length of a teaching term, used only for the default export range. */
const SEMESTER_WEEKS = 16;

/** Format a Date as the YYYY-MM-DD an <input type="date"> expects, in local time. */
function toDateInput(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

export default function ExportPage() {
  const [selections, setSelections] = useState<UserElectiveSelections>({});
  const [customElectives, setCustomElectives] = useState<CustomElective[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloaded, setDownloaded] = useState(false);

  // Default to "today through ~16 weeks out" rather than a hard-coded term.
  // A stale literal silently exports the whole timetable into a term that has
  // already ended, and weekly recurrence is on by default, so a wrong default
  // is worse than an approximate one. Both fields stay user-editable.
  const [semesterStartDate, setSemesterStartDate] = useState(() => toDateInput(new Date()));
  const [semesterEndDate, setSemesterEndDate] = useState(() =>
    toDateInput(addWeeks(new Date(), SEMESTER_WEEKS)),
  );
  const [includeRecurrence, setIncludeRecurrence] = useState(true);

  // Load settings from localStorage
  useEffect(() => {
    const savedSelections = localStorage.getItem(STORAGE_KEY);
    const savedCustomElectives = localStorage.getItem(CUSTOM_ELECTIVES_KEY);

    if (savedSelections) {
      try {
        setSelections(JSON.parse(savedSelections));
      } catch {
        console.error("Failed to parse saved selections");
      }
    }

    if (savedCustomElectives) {
      try {
        setCustomElectives(JSON.parse(savedCustomElectives));
      } catch {
        console.error("Failed to parse custom electives");
      }
    }

    setIsLoading(false);
  }, []);

  const handleExport = () => {
    downloadICS(selections, customElectives, {
      semesterStartDate: new Date(semesterStartDate),
      semesterEndDate: new Date(semesterEndDate),
      includeRecurrence,
    });
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  if (isLoading) {
    return (
      <div className={classNames.home2}>
        <div className={classNames.home3}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={classNames.home4}>
      <div className={classNames.home5}>
        {/* Header */}
        <header className={classNames.home6}>
          <Link href="/" className={classNames.home7}>
            <ArrowLeftIcon className={classNames.home8} />
            Back to Timetable
          </Link>

          <div>
            <h1 className={classNames.home9}>Export Calendar</h1>
            <p className={classNames.home10}>Download your timetable as an ICS file</p>
          </div>
        </header>

        <Separator className={classNames.home11} />

        {/* Content */}
        <div className={classNames.home12}>
          {/* Info */}
          <div className={classNames.home13}>
            <p className={classNames.home14}>ICS files work with most calendar apps including:</p>
            <div className={classNames.home15}>
              <Badge variant="secondary" className={classNames.home16}>
                Apple Calendar
              </Badge>
              <Badge variant="secondary" className={classNames.home16}>
                Google Calendar
              </Badge>
              <Badge variant="secondary" className={classNames.home16}>
                Microsoft Outlook
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Date Range */}
          <div className={classNames.home17}>
            <div className={classNames.home18}>
              <CalendarIcon className={classNames.home19} />
              <span className={classNames.home20}>Semester Dates</span>
            </div>

            <div className={classNames.home21}>
              <div className={classNames.home13}>
                <Label htmlFor="start-date" className={classNames.home22}>
                  Start Date
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={semesterStartDate}
                  onChange={(e) => setSemesterStartDate(e.target.value)}
                  className={classNames.home23}
                />
              </div>
              <div className={classNames.home13}>
                <Label htmlFor="end-date" className={classNames.home22}>
                  End Date
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={semesterEndDate}
                  onChange={(e) => setSemesterEndDate(e.target.value)}
                  className={classNames.home23}
                />
              </div>
            </div>

            {/* Recurrence */}
            <label className={classNames.home24}>
              <input
                type="checkbox"
                checked={includeRecurrence}
                onChange={(e) => setIncludeRecurrence(e.target.checked)}
                className={classNames.home25}
              />
              <span className={classNames.home14}>Repeat weekly until end date</span>
            </label>
          </div>

          <Separator />

          {/* Download Button */}
          <Button
            onClick={handleExport}
            size="lg"
            className={classNames.home26}
            disabled={downloaded}
          >
            {downloaded ? (
              <>
                <CheckIcon className={classNames.home27} />
                Downloaded!
              </>
            ) : (
              <>
                <DownloadIcon className={classNames.home27} />
                Download ICS File
              </>
            )}
          </Button>

          {/* Instructions */}
          <div className={classNames.home28}>
            <p className={classNames.home29}>After downloading:</p>
            <ul className={classNames.home30}>
              <li>
                <span className={classNames.home31}>Apple Calendar:</span> Double-click the file or
                drag it onto Calendar
              </li>
              <li>
                <span className={classNames.home31}>Google Calendar:</span> Settings → Import &
                Export → Import
              </li>
              <li>
                <span className={classNames.home31}>Outlook:</span> File → Open & Export → Import
                .ics file
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <footer className={classNames.home32}>
          <p className={classNames.home33}>MIT Manipal • IT_CCE • Sem VII</p>
        </footer>
      </div>
    </div>
  );
}
