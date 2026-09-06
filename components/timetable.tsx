"use client";

import { classNames } from "@/ui.stylex";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DayView } from "@/components/day-view";
import { WeekView } from "@/components/week-view";
import { SetupModal } from "@/components/setup-modal";
import { SettingsDialog } from "@/components/settings-dialog";
import { AppearanceDialog } from "@/components/appearance-dialog";
import { CalendarExportLink } from "@/components/calendar-export";
import { useTimetable, type UserElectiveSelections } from "@/lib/hooks/use-timetable";
import { useCurrentTime } from "@/lib/hooks/use-current-time";
import { days, Day } from "@/lib/timetable-data";
import {
  CalendarIcon,
  CalendarDotsIcon,
  GearIcon,
  PaletteIcon,
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
  const [showAppearance, setShowAppearance] = useState(false);

  const {
    selections,
    customElectives,
    isSetupComplete,
    isLoading,
    showRoom,
    setShowRoom,
    tileLabel,
    setTileLabel,
    saveSelections,
    addCustomElective,
    removeCustomElective,
    updateCustomElective,
    resetSetup,
    exportSettings,
    importSettings,
    allElectiveGroups,
    selectedElectives,
    labBatch,
  } = useTimetable();

  const { now, currentDay, formattedTime, formattedDate } = useCurrentTime();

  const { theme, toggleTheme } = useTheme();

  /**
   * Every callback handed to a memoised child is wrapped, and all of them are
   * — the views take `onConfigureElective` into the dependency list of the
   * memo that builds their grid, and the three dialogs below are `React.memo`
   * components. A single inline arrow anywhere in this set is a new value on
   * every render, which would silently turn every one of those memos from a
   * saving into pure overhead.
   */
  const openElectiveEditor = useCallback(() => setShowEditElectives(true), []);
  const closeElectiveEditor = useCallback(() => setShowEditElectives(false), []);
  const closeSettings = useCallback(() => setShowSettings(false), []);
  const closeAppearance = useCallback(() => setShowAppearance(false), []);
  const openAppearance = useCallback(() => setShowAppearance(true), []);
  const openSettings = useCallback(() => setShowSettings(true), []);

  const saveAndCloseEditor = useCallback(
    (newSelections: UserElectiveSelections) => {
      saveSelections(newSelections);
      setShowEditElectives(false);
    },
    [saveSelections],
  );

  const resetAndCloseSettings = useCallback(() => {
    resetSetup();
    setShowSettings(false);
  }, [resetSetup]);

  const editElectivesFromSettings = useCallback(() => {
    setShowSettings(false);
    setShowEditElectives(true);
  }, []);

  const editAppearanceFromSettings = useCallback(() => {
    setShowSettings(false);
    setShowAppearance(true);
  }, []);

  // Determine which day to show. `DayName` is `Day` plus "SUN", the one day the
  // grid has no column for, so excluding it narrows to `Day` without a cast —
  // and Sunday opens on the coming Monday, as it did before.
  const currentDayName = currentDay;
  const displayDay: Day = selectedDay || (currentDayName === "SUN" ? "MON" : currentDayName);

  if (isLoading) {
    return (
      <div className={classNames.home2}>
        <div className={classNames.home3}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={classNames.home4}>
      <SetupModal
        open={!isSetupComplete && !isLoading}
        electiveGroups={allElectiveGroups}
        customElectives={customElectives}
        onSave={saveSelections}
        onAddCustom={addCustomElective}
        onRemoveCustom={removeCustomElective}
        onUpdateCustom={updateCustomElective}
      />

      <SetupModal
        open={showEditElectives}
        electiveGroups={allElectiveGroups}
        customElectives={customElectives}
        initialSelections={selections}
        onSave={saveAndCloseEditor}
        onAddCustom={addCustomElective}
        onRemoveCustom={removeCustomElective}
        onUpdateCustom={updateCustomElective}
        onClose={closeElectiveEditor}
        isEditing
      />

      <SettingsDialog
        open={showSettings}
        onClose={closeSettings}
        selections={selections}
        customElectives={customElectives}
        showRoom={showRoom}
        onShowRoomChange={setShowRoom}
        tileLabel={tileLabel}
        onTileLabelChange={setTileLabel}
        onExport={exportSettings}
        onImport={importSettings}
        onReset={resetAndCloseSettings}
        onEditElectives={editElectivesFromSettings}
        onEditAppearance={editAppearanceFromSettings}
      />

      <AppearanceDialog
        open={showAppearance}
        onClose={closeAppearance}
        tileLabel={tileLabel}
        onTileLabelChange={setTileLabel}
        showRoom={showRoom}
        onShowRoomChange={setShowRoom}
      />

      <div className={classNames.timetable285}>
        <header className={classNames.timetable286}>
          <div className={classNames.dayView216}>
            <div>
              <h1 className={classNames.home9}>Timetable</h1>
              <p className={classNames.timetable287}>
                MIT Manipal • IT_CCE • Sem VII
                {labBatch && (
                  <Badge variant="outline" className={classNames.timetable288}>
                    {labBatch}
                  </Badge>
                )}
              </p>
            </div>
            <div className={classNames.dayView220}>
              <Button variant="ghost" size="icon-sm" onClick={toggleTheme}>
                {theme === "dark" ? (
                  <SunIcon className={classNames.setupModal53} />
                ) : (
                  <MoonIcon className={classNames.setupModal53} />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={openAppearance}
                aria-label="Appearance"
              >
                <PaletteIcon className={classNames.setupModal53} />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={openSettings}>
                <GearIcon className={classNames.setupModal53} />
              </Button>
            </div>
          </div>

          <div className={classNames.dayView197}>
            <Badge variant="secondary" className={classNames.timetable289}>
              {formattedTime}
            </Badge>
            <span className={classNames.home22}>{formattedDate}</span>
          </div>

          <Separator />

          {/* View toggle */}
          <div className={classNames.setupModal51}>
            <div className={classNames.timetable290}>
              <Button
                variant={viewMode === "day" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("day")}
                className={classNames.timetable291}
              >
                <CalendarIcon className={classNames.home8} />
                <span className={classNames.timetable292}>Day</span>
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("week")}
                className={classNames.timetable291}
              >
                <CalendarDotsIcon className={classNames.home8} />
                <span className={classNames.timetable292}>Week</span>
              </Button>
            </div>

            {/* Day selector (only in day view) */}
            {viewMode === "day" && (
              <div className={classNames.timetable293}>
                {days.map((day) => (
                  <Button
                    key={day}
                    variant={displayDay === day ? "default" : "ghost"}
                    size="xs"
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      classNames.timetable294,
                      currentDayName === day && displayDay !== day && classNames.timetable295,
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
              now={now}
              selections={selections}
              selectedElectives={selectedElectives}
              labBatch={labBatch}
              onConfigureElective={openElectiveEditor}
              showRoom={showRoom}
              labelMode={tileLabel}
            />
          ) : (
            <WeekView
              now={now}
              selections={selections}
              selectedElectives={selectedElectives}
              labBatch={labBatch}
              onConfigureElective={openElectiveEditor}
              showRoom={showRoom}
              labelMode={tileLabel}
            />
          )}
        </main>

        <footer className={classNames.timetable296}>
          <p className={classNames.home33}>
            Tap/click course for details • <CalendarExportLink />
          </p>
        </footer>
      </div>
    </div>
  );
}
