"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DayView } from "@/components/day-view";
import { WeekView } from "@/components/week-view";
import { SetupModal } from "@/components/setup-modal";
import { SettingsDialog } from "@/components/settings-dialog";
import { CalendarExportLink } from "@/components/calendar-export";
import { useTimetable } from "@/lib/hooks/use-timetable";
import { useCurrentTime } from "@/lib/hooks/use-current-time";
import { days, Day, Course, ElectiveType } from "@/lib/timetable-data";
import {
    CalendarIcon,
    CalendarDotsIcon,
    GearIcon,
    SunIcon,
    MoonIcon,
} from "@phosphor-icons/react";
import { useTheme } from "@/lib/theme-provider";

/** Exam views live in archived/components/ for reuse next exam season. */

type ViewMode = "day" | "week";

export function Timetable() {
    const [viewMode, setViewMode] = useState<ViewMode>("day");
    const [selectedDay, setSelectedDay] = useState<Day | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showEditElectives, setShowEditElectives] = useState(false);

    const {
        selections,
        customElectives,
        isSetupComplete,
        isLoading,
        saveSelections,
        addCustomElective,
        removeCustomElective,
        updateCustomElective,
        getSelectedElective,
        getLabBatch,
        resetSetup,
        getAllElectiveGroups,
        exportSettings,
        importSettings,
    } = useTimetable();

    const { currentTime, getCurrentDay, getFormattedTime, getFormattedDate } =
        useCurrentTime();

    const { theme, toggleTheme } = useTheme();

    // Determine which day to show
    const currentDayName = getCurrentDay();
    const displayDay =
        selectedDay ||
        (days.includes(currentDayName as Day) ? (currentDayName as Day) : "MON");

    const getElective = (type: ElectiveType): Course | null => {
        return getSelectedElective(type) as Course | null;
    };

    const labBatch = getLabBatch();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-muted-foreground text-sm">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <SetupModal
                open={!isSetupComplete && !isLoading}
                electiveGroups={getAllElectiveGroups()}
                customElectives={customElectives}
                onSave={saveSelections}
                onAddCustom={addCustomElective}
                onRemoveCustom={removeCustomElective}
                onUpdateCustom={updateCustomElective}
            />

            <SetupModal
                open={showEditElectives}
                electiveGroups={getAllElectiveGroups()}
                customElectives={customElectives}
                initialSelections={selections}
                onSave={(newSelections) => {
                    saveSelections(newSelections);
                    setShowEditElectives(false);
                }}
                onAddCustom={addCustomElective}
                onRemoveCustom={removeCustomElective}
                onUpdateCustom={updateCustomElective}
                onClose={() => setShowEditElectives(false)}
                isEditing
            />

            <SettingsDialog
                open={showSettings}
                onClose={() => setShowSettings(false)}
                selections={selections}
                customElectives={customElectives}
                onExport={exportSettings}
                onImport={importSettings}
                onReset={() => {
                    resetSetup();
                    setShowSettings(false);
                }}
                onEditElectives={() => {
                    setShowSettings(false);
                    setShowEditElectives(true);
                }}
            />

            <div className="max-w-4xl mx-auto px-4 py-6">
                <header className="space-y-4 mb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-lg font-semibold tracking-tight">Timetable</h1>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                MIT Manipal • IT_CCE • Sem VII
                                {labBatch && (
                                    <Badge variant="outline" className="ml-2 text-[10px]">
                                        {labBatch}
                                    </Badge>
                                )}
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon-sm" onClick={toggleTheme}>
                                {theme === "dark" ? (
                                    <SunIcon className="size-4" />
                                ) : (
                                    <MoonIcon className="size-4" />
                                )}
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => setShowSettings(true)}>
                                <GearIcon className="size-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="font-mono text-xs">
                            {getFormattedTime()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{getFormattedDate()}</span>
                    </div>

                    <Separator />

                    {/* View toggle */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-none">
                            <Button
                                variant={viewMode === "day" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("day")}
                                className="gap-1.5"
                            >
                                <CalendarIcon className="size-3.5" />
                                <span className="hidden sm:inline">Day</span>
                            </Button>
                            <Button
                                variant={viewMode === "week" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("week")}
                                className="gap-1.5"
                            >
                                <CalendarDotsIcon className="size-3.5" />
                                <span className="hidden sm:inline">Week</span>
                            </Button>
                        </div>

                        {/* Day selector (only in day view) */}
                        {viewMode === "day" && (
                            <div className="flex items-center gap-0.5 overflow-x-auto">
                                {days.map((day) => (
                                    <Button
                                        key={day}
                                        variant={displayDay === day ? "default" : "ghost"}
                                        size="xs"
                                        onClick={() => setSelectedDay(day)}
                                        className={cn(
                                            "min-w-8 px-2",
                                            currentDayName === day &&
                                            displayDay !== day &&
                                            "ring-1 ring-primary/50"
                                        )}
                                    >
                                        {day.slice(0, 2)}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </header>

                <main>
                    {viewMode === "day" ? (
                        <DayView
                            day={displayDay}
                            currentTime={currentTime}
                            selections={selections}
                            getSelectedElective={getElective}
                            labBatch={labBatch}
                            onConfigureElective={() => setShowEditElectives(true)}
                        />
                    ) : (
                        <WeekView
                            currentTime={currentTime}
                            selections={selections}
                            getSelectedElective={getElective}
                            labBatch={labBatch}
                            onConfigureElective={() => setShowEditElectives(true)}
                        />
                    )}
                </main>

                <footer className="mt-8 pt-4 border-t border-border/50">
                    <p className="text-center text-[10px] text-muted-foreground">
                        Tap/click course for details • <CalendarExportLink />
                    </p>
                </footer>
            </div>
        </div>
    );
}
