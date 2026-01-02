"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeftIcon,
    DownloadIcon,
    CheckIcon,
    CalendarIcon,
} from "@phosphor-icons/react";
import { downloadICS } from "@/lib/calendar-export";
import { UserElectiveSelections, CustomElective } from "@/lib/hooks/use-timetable";

const STORAGE_KEY = "timetable-electives";
const CUSTOM_ELECTIVES_KEY = "timetable-custom-electives";

export default function ExportPage() {
    const [selections, setSelections] = useState<UserElectiveSelections>({});
    const [customElectives, setCustomElectives] = useState<CustomElective[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [downloaded, setDownloaded] = useState(false);

    // Default semester dates: Jan 3 - Apr 27, 2026
    const [semesterStartDate, setSemesterStartDate] = useState("2026-01-03");
    const [semesterEndDate, setSemesterEndDate] = useState("2026-04-27");
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
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-muted-foreground text-sm">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-md mx-auto px-4 py-8">
                {/* Header */}
                <header className="space-y-4 mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeftIcon className="size-3.5" />
                        Back to Timetable
                    </Link>

                    <div>
                        <h1 className="text-lg font-semibold tracking-tight">Export Calendar</h1>
                        <p className="text-xs text-muted-foreground mt-1">
                            Download your timetable as an ICS file
                        </p>
                    </div>
                </header>

                <Separator className="mb-6" />

                {/* Content */}
                <div className="space-y-6">
                    {/* Info */}
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            ICS files work with most calendar apps including:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            <Badge variant="secondary" className="text-xs">Apple Calendar</Badge>
                            <Badge variant="secondary" className="text-xs">Google Calendar</Badge>
                            <Badge variant="secondary" className="text-xs">Microsoft Outlook</Badge>
                        </div>
                    </div>

                    <Separator />

                    {/* Date Range */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="size-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Semester Dates</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start-date" className="text-xs text-muted-foreground">
                                    Start Date
                                </Label>
                                <Input
                                    id="start-date"
                                    type="date"
                                    value={semesterStartDate}
                                    onChange={(e) => setSemesterStartDate(e.target.value)}
                                    className="text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end-date" className="text-xs text-muted-foreground">
                                    End Date
                                </Label>
                                <Input
                                    id="end-date"
                                    type="date"
                                    value={semesterEndDate}
                                    onChange={(e) => setSemesterEndDate(e.target.value)}
                                    className="text-sm"
                                />
                            </div>
                        </div>

                        {/* Recurrence */}
                        <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeRecurrence}
                                onChange={(e) => setIncludeRecurrence(e.target.checked)}
                                className="size-4 rounded border-input accent-primary"
                            />
                            <span className="text-sm text-muted-foreground">
                                Repeat weekly until end date
                            </span>
                        </label>
                    </div>

                    <Separator />

                    {/* Download Button */}
                    <Button
                        onClick={handleExport}
                        size="lg"
                        className="w-full"
                        disabled={downloaded}
                    >
                        {downloaded ? (
                            <>
                                <CheckIcon className="size-4 mr-2" />
                                Downloaded!
                            </>
                        ) : (
                            <>
                                <DownloadIcon className="size-4 mr-2" />
                                Download ICS File
                            </>
                        )}
                    </Button>

                    {/* Instructions */}
                    <div className="space-y-3 pt-2">
                        <p className="text-xs text-muted-foreground font-medium">After downloading:</p>
                        <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                            <li><span className="text-foreground/80">Apple Calendar:</span> Double-click the file or drag it onto Calendar</li>
                            <li><span className="text-foreground/80">Google Calendar:</span> Settings → Import & Export → Import</li>
                            <li><span className="text-foreground/80">Outlook:</span> File → Open & Export → Import .ics file</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-12 pt-4 border-t border-border/50">
                    <p className="text-center text-[10px] text-muted-foreground">
                        MIT Manipal • CCE-B • Sem VI
                    </p>
                </footer>
            </div>
        </div>
    );
}
