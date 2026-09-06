"use client";

import { classNames } from "@/ui.stylex";

import * as React from "react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { TileDisplaySettings } from "@/components/tile-display-settings";
import { UserElectiveSelections, CustomElective, TileLabelMode } from "@/lib/hooks/use-timetable";
import { electiveTypes, electiveTypeLabels } from "@/lib/timetable-data";
import {
  ExportIcon,
  UploadIcon,
  TrashIcon,
  GearIcon,
  CopyIcon,
  CheckIcon,
  PaletteIcon,
} from "@phosphor-icons/react";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  selections: UserElectiveSelections;
  customElectives: CustomElective[];
  showRoom: boolean;
  onShowRoomChange: (value: boolean) => void;
  tileLabel: TileLabelMode;
  onTileLabelChange: (value: TileLabelMode) => void;
  onExport: () => string;
  onImport: (json: string) => boolean;
  onReset: () => void;
  onEditElectives: () => void;
  onEditAppearance: () => void;
}

function SettingsDialogImpl({
  open,
  onClose,
  selections,
  showRoom,
  onShowRoomChange,
  tileLabel,
  onTileLabelChange,
  onExport,
  onImport,
  onReset,
  onEditElectives,
  onEditAppearance,
}: SettingsDialogProps) {
  const missingTypes = electiveTypes.filter((type) => !selections[type]);

  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExport = () => {
    const json = onExport();
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const json = onExport();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timetable-settings-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    setImportError(null);
    if (!importText.trim()) {
      setImportError("Please paste your settings JSON");
      return;
    }
    const success = onImport(importText);
    if (success) {
      setShowImport(false);
      setImportText("");
      onClose();
    } else {
      setImportError("Invalid settings format. Please check your JSON.");
    }
  };

  // `Blob#text` rather than a `FileReader`: it hands back a `string` instead of
  // the `string | ArrayBuffer | null` a reader's `result` is typed as, which is
  // only ever a string here because `readAsText` was the method called.
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportText(await file.text());
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all settings? This cannot be undone.")) {
      onReset();
      onClose();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onClose()}>
      {/* Cap the whole dialog (not just the body) so header and footer stay
                on-screen on mobile; the body is the only scroll container. */}
      <AlertDialogContent className={classNames.appearanceDialog278}>
        <AlertDialogHeader>
          <AlertDialogTitle className={classNames.appearanceDialog279}>Settings</AlertDialogTitle>
          <AlertDialogDescription>Manage your timetable configuration</AlertDialogDescription>
        </AlertDialogHeader>

        <div className={classNames.settingsDialog320}>
          {/* Only surface electives that still need configuring */}
          {missingTypes.length > 0 && (
            <>
              <Card size="sm">
                <CardHeader className={classNames.settingsDialog321}>
                  <CardTitle className={classNames.home16}>
                    {missingTypes.length} elective{missingTypes.length > 1 ? "s" : ""} not set
                  </CardTitle>
                </CardHeader>
                <CardContent className={classNames.home15}>
                  {missingTypes.map((type) => (
                    <Badge key={type} variant="secondary" className={classNames.dayView200}>
                      {electiveTypeLabels[type]}
                    </Badge>
                  ))}
                </CardContent>
              </Card>

              <Separator />
            </>
          )}

          {/* Display preferences */}
          <TileDisplaySettings
            tileLabel={tileLabel}
            onTileLabelChange={onTileLabelChange}
            showRoom={showRoom}
            onShowRoomChange={onShowRoomChange}
          />

          <Separator />

          {/* Actions */}
          <div className={classNames.home13}>
            <Button
              variant="outline"
              size="sm"
              className={classNames.setupModal79}
              onClick={onEditElectives}
            >
              <GearIcon className={classNames.home27} />
              Edit Electives
            </Button>

            <Button
              variant="outline"
              size="sm"
              className={classNames.setupModal79}
              onClick={onEditAppearance}
            >
              <PaletteIcon className={classNames.home27} />
              Appearance
            </Button>

            <Button
              variant="outline"
              size="sm"
              className={classNames.setupModal79}
              onClick={handleExport}
            >
              {copied ? (
                <>
                  <CheckIcon className={classNames.home27} />
                  Copied to Clipboard!
                </>
              ) : (
                <>
                  <CopyIcon className={classNames.home27} />
                  Copy Settings as JSON
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className={classNames.setupModal79}
              onClick={handleDownload}
            >
              <ExportIcon className={classNames.home27} />
              Download Settings
            </Button>

            <Button
              variant="outline"
              size="sm"
              className={classNames.setupModal79}
              onClick={() => setShowImport(!showImport)}
            >
              <UploadIcon className={classNames.home27} />
              Import Settings
            </Button>

            {showImport && (
              <div className={classNames.setupModal76}>
                <div className={classNames.home18}>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className={classNames.settingsDialog322}
                  />
                </div>
                <Textarea
                  placeholder="Or paste your settings JSON here..."
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className={classNames.settingsDialog323}
                />
                {importError && <p className={classNames.settingsDialog324}>{importError}</p>}
                <div className={classNames.setupModal59}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowImport(false);
                      setImportText("");
                      setImportError(null);
                    }}
                    className={classNames.setupModal78}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleImport} className={classNames.setupModal78}>
                    Import
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            <Button
              variant="destructive"
              size="sm"
              className={classNames.setupModal79}
              onClick={handleReset}
            >
              <TrashIcon className={classNames.home27} />
              Reset All Settings
            </Button>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Mounted permanently behind `open`, so it re-ran on every tick for a dialog
 * that is almost always closed.
 *
 * Every callback this takes is wrapped in `useCallback` at the call site in
 * `components/timetable.tsx` — one inline arrow left unwrapped would make this
 * memo pure overhead.
 */
export const SettingsDialog = React.memo(SettingsDialogImpl);
