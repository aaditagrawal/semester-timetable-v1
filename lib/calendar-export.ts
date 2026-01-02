// Calendar export utilities for ICS format
// ICS (iCalendar) format is universally compatible with:
// - Apple Calendar (macOS, iOS)
// - Google Calendar
// - Microsoft Outlook
// - Thunderbird
// - And most other calendar applications

import {
    weekSchedule,
    timeSlots,
    days,
    Day,
    Course,
    courses,
    LabBatch,
} from "@/lib/timetable-data";
import { UserElectiveSelections, CustomElective } from "@/lib/hooks/use-timetable";
import { ElectiveOption, electiveGroups } from "@/lib/timetable-data";

// Generate a unique ID for each event
function generateUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@timetable.mit`;
}

// Format date to ICS format (YYYYMMDD)
function formatICSDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
}

// Format time to ICS format (HHMMSS)
function formatICSTime(time: string): string {
    const [hours, minutes] = time.split(":");
    return `${hours.padStart(2, "0")}${minutes.padStart(2, "0")}00`;
}

// Format datetime to ICS format (YYYYMMDDTHHMMSS)
function formatICSDateTime(date: Date, time: string): string {
    return `${formatICSDate(date)}T${formatICSTime(time)}`;
}

// Escape special characters in ICS format
function escapeICS(text: string): string {
    return text
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\n/g, "\\n");
}

// Get day offset from Monday (0 = Monday, 1 = Tuesday, etc.)
function getDayOffset(day: Day): number {
    return days.indexOf(day);
}

// Get the next occurrence of a specific weekday starting from a date
function getNextWeekday(startDate: Date, dayOffset: number): Date {
    const result = new Date(startDate);
    const currentDay = result.getDay();
    // Convert Sunday (0) to 7 for easier calculation, Monday is 1
    const currentDayMondayBased = currentDay === 0 ? 6 : currentDay - 1;
    const daysToAdd = (dayOffset - currentDayMondayBased + 7) % 7;
    result.setDate(result.getDate() + daysToAdd);
    return result;
}

// Get elective options including custom ones
function getElectiveOptions(
    type: "PE-1" | "PE-2" | "OE" | "FC-2",
    customElectives: CustomElective[]
): ElectiveOption[] {
    const group = electiveGroups.find((g) => g.type === type);
    const defaultOptions = group?.options || [];
    const customOptions = customElectives
        .filter((e) => e.groupType === type)
        .map(({ groupType, ...rest }) => rest as ElectiveOption);
    return [...defaultOptions, ...customOptions];
}

// Get selected elective for a type
function getSelectedElective(
    type: "PE-1" | "PE-2" | "OE" | "FC-2",
    selections: UserElectiveSelections,
    customElectives: CustomElective[]
): ElectiveOption | null {
    const selectedId = selections[type];
    if (!selectedId) return null;
    const options = getElectiveOptions(type, customElectives);
    return options.find((opt) => opt.id === selectedId) || null;
}

interface CalendarEvent {
    summary: string;
    description: string;
    location: string;
    startTime: string;
    endTime: string;
    day: Day;
}

// Collect all events from the timetable
function collectEvents(
    selections: UserElectiveSelections,
    customElectives: CustomElective[]
): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const labBatch = selections.labBatch;

    for (const day of days) {
        const daySchedule = weekSchedule[day];

        // Track processed lab slots to avoid duplicates
        const processedLabSlots = new Set<number>();

        for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
            const entry = daySchedule[slotIndex];
            if (!entry) continue;

            // Skip if this slot is part of a lab we already processed
            if (processedLabSlots.has(slotIndex)) continue;

            let course: Course | null = null;
            let startTime = timeSlots[slotIndex].start;
            let endTime = timeSlots[slotIndex].end;
            let location = "";

            if (entry.isLab && entry.labInfo && labBatch) {
                // Lab session
                const labInfo = entry.labInfo[labBatch];
                course = courses[labInfo.course] || null;
                location = labInfo.room;

                // Use time override if available
                if (entry.labInfo.timeOverride) {
                    startTime = entry.labInfo.timeOverride.start;
                    endTime = entry.labInfo.timeOverride.end;
                }

                // Mark following slots as processed (labs span multiple slots)
                for (let i = slotIndex + 1; i < timeSlots.length; i++) {
                    const nextEntry = daySchedule[i];
                    if (nextEntry === null) {
                        processedLabSlots.add(i);
                    } else {
                        break;
                    }
                }
            } else if (entry.isElective && entry.electiveType) {
                // Elective slot
                const elective = getSelectedElective(
                    entry.electiveType,
                    selections,
                    customElectives
                );
                if (!elective) {
                    // Skip unselected electives
                    continue;
                }
                course = elective;
                location = elective.room || "";
            } else {
                // Regular course
                course = courses[entry.courseAbbreviation] || null;
                if (course) {
                    location = course.room || "";
                }
            }

            if (course) {
                events.push({
                    summary: course.name,
                    description: `${course.abbreviation} - ${course.code}\nFaculty: ${course.faculty.map((f) => f.name).join(", ")}`,
                    location,
                    startTime,
                    endTime,
                    day,
                });
            }
        }
    }

    return events;
}

export interface CalendarExportOptions {
    semesterStartDate: Date;
    semesterEndDate: Date;
    includeRecurrence: boolean;
}

// Generate ICS file content
export function generateICS(
    selections: UserElectiveSelections,
    customElectives: CustomElective[],
    options: CalendarExportOptions
): string {
    const events = collectEvents(selections, customElectives);
    const lines: string[] = [];

    // ICS Header
    lines.push("BEGIN:VCALENDAR");
    lines.push("VERSION:2.0");
    lines.push("PRODID:-//MIT Manipal Timetable//EN");
    lines.push("CALSCALE:GREGORIAN");
    lines.push("METHOD:PUBLISH");
    lines.push("X-WR-CALNAME:MIT Manipal Timetable");
    lines.push("X-WR-TIMEZONE:Asia/Kolkata");

    // Add timezone definition for IST
    lines.push("BEGIN:VTIMEZONE");
    lines.push("TZID:Asia/Kolkata");
    lines.push("BEGIN:STANDARD");
    lines.push("DTSTART:19700101T000000");
    lines.push("TZOFFSETFROM:+0530");
    lines.push("TZOFFSETTO:+0530");
    lines.push("END:STANDARD");
    lines.push("END:VTIMEZONE");

    // Generate events
    for (const event of events) {
        const dayOffset = getDayOffset(event.day);
        const eventDate = getNextWeekday(options.semesterStartDate, dayOffset);

        lines.push("BEGIN:VEVENT");
        lines.push(`UID:${generateUID()}`);
        lines.push(`DTSTAMP:${formatICSDateTime(new Date(), "00:00")}`);
        lines.push(`DTSTART;TZID=Asia/Kolkata:${formatICSDateTime(eventDate, event.startTime)}`);
        lines.push(`DTEND;TZID=Asia/Kolkata:${formatICSDateTime(eventDate, event.endTime)}`);
        lines.push(`SUMMARY:${escapeICS(event.summary)}`);

        if (event.description) {
            lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
        }

        if (event.location) {
            lines.push(`LOCATION:${escapeICS(event.location)}`);
        }

        // Add weekly recurrence if enabled
        if (options.includeRecurrence) {
            lines.push(`RRULE:FREQ=WEEKLY;UNTIL=${formatICSDate(options.semesterEndDate)}T235959Z`);
        }

        lines.push("END:VEVENT");
    }

    lines.push("END:VCALENDAR");

    return lines.join("\r\n");
}

// Download ICS file
export function downloadICS(
    selections: UserElectiveSelections,
    customElectives: CustomElective[],
    options: CalendarExportOptions
): void {
    const icsContent = generateICS(selections, customElectives, options);
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mit-timetable-${formatICSDate(new Date())}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Generate Google Calendar URL for adding events
// Note: Google Calendar URL only supports single events, not bulk import
// The ICS file is the recommended way for bulk import
export function generateGoogleCalendarImportInstructions(): string {
    return `To import your timetable to Google Calendar:
1. Download the ICS file
2. Open Google Calendar (calendar.google.com)
3. Click the gear icon → Settings
4. Select "Import & Export" from the sidebar
5. Click "Select file from your computer"
6. Choose the downloaded .ics file
7. Select which calendar to add events to
8. Click "Import"`;
}

// Generate Apple Calendar import instructions
export function generateAppleCalendarImportInstructions(): string {
    return `To import your timetable to Apple Calendar:
• macOS: Double-click the .ics file, or drag it onto the Calendar app
• iOS: Open the .ics file → Tap "Add All Events"
• iCloud: Upload via icloud.com/calendar`;
}

// Generate Outlook import instructions  
export function generateOutlookImportInstructions(): string {
    return `To import your timetable to Microsoft Outlook:
• Outlook desktop: File → Open & Export → Import/Export → Import .ics file
• Outlook.com: Settings → View all Outlook settings → Calendar → Shared calendars → Publish or import`;
}
