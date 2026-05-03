"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExamView } from "@/components/exam-view";
import { SetupModal } from "@/components/setup-modal";
import { SettingsDialog } from "@/components/settings-dialog";
import { CalendarExportLink } from "@/components/calendar-export";
import { useTimetable } from "@/lib/hooks/use-timetable";
import { useCurrentTime } from "@/lib/hooks/use-current-time";
import { Course } from "@/lib/timetable-data";
import { GearIcon, SunIcon, MoonIcon } from "@phosphor-icons/react";
import { useTheme } from "@/lib/theme-provider";

/** Day & week views live in archived/components/ for reuse after exam season. */

export function Timetable() {
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

    const { getFormattedTime, getFormattedDate } = useCurrentTime();

    const { theme, toggleTheme } = useTheme();

    const getElective = (type: "PE-1" | "PE-2" | "OE" | "FC-2"): Course | null => {
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
                            <h1 className="text-lg font-semibold tracking-tight">Exams</h1>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                MIT Manipal • CCE-B • Sem VI • End-semester schedule
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
                </header>

                <main>
                    <ExamView selections={selections} getSelectedElective={getElective} />
                </main>

                <footer className="mt-8 pt-4 border-t border-border/50">
                    <p className="text-center text-[10px] text-muted-foreground">
                        Room: AB5-306 • Configure electives in settings if needed •{" "}
                        <CalendarExportLink />
                    </p>
                </footer>
            </div>
        </div>
    );
}
