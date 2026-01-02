"use client";

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
import { UserElectiveSelections } from "@/lib/hooks/use-timetable";
import {
    ExportIcon,
    UploadIcon,
    TrashIcon,
    GearIcon,
    CopyIcon,
    CheckIcon,
} from "@phosphor-icons/react";

interface SettingsDialogProps {
    open: boolean;
    onClose: () => void;
    selections: UserElectiveSelections;
    onExport: () => string;
    onImport: (json: string) => boolean;
    onReset: () => void;
    onEditElectives: () => void;
}

export function SettingsDialog({
    open,
    onClose,
    selections,
    onExport,
    onImport,
    onReset,
    onEditElectives,
}: SettingsDialogProps) {
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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setImportText(text);
        };
        reader.readAsText(file);
    };

    const handleReset = () => {
        if (confirm("Are you sure you want to reset all settings? This cannot be undone.")) {
            onReset();
            onClose();
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent className="max-w-sm">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-base">Settings</AlertDialogTitle>
                    <AlertDialogDescription>
                        Manage your timetable configuration
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-3 py-2">
                    {/* Current Config Summary */}
                    <Card size="sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs">Current Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Lab Batch</span>
                                <Badge variant="outline">{selections.labBatch || "Not set"}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">FC-2</span>
                                <Badge variant="outline">
                                    {selections["FC-2"] ? "Selected" : "Not set"}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">PE-1</span>
                                <Badge variant={selections["PE-1"] ? "outline" : "secondary"}>
                                    {selections["PE-1"] ? "Selected" : "Optional"}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">PE-2</span>
                                <Badge variant={selections["PE-2"] ? "outline" : "secondary"}>
                                    {selections["PE-2"] ? "Selected" : "Optional"}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">OE</span>
                                <Badge variant={selections["OE"] ? "outline" : "secondary"}>
                                    {selections["OE"] ? "Selected" : "Optional"}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Separator />

                    {/* Actions */}
                    <div className="space-y-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                            onClick={onEditElectives}
                        >
                            <GearIcon className="size-4 mr-2" />
                            Edit Electives
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                            onClick={handleExport}
                        >
                            {copied ? (
                                <>
                                    <CheckIcon className="size-4 mr-2" />
                                    Copied to Clipboard!
                                </>
                            ) : (
                                <>
                                    <CopyIcon className="size-4 mr-2" />
                                    Copy Settings as JSON
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                            onClick={handleDownload}
                        >
                            <ExportIcon className="size-4 mr-2" />
                            Download Settings
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => setShowImport(!showImport)}
                        >
                            <UploadIcon className="size-4 mr-2" />
                            Import Settings
                        </Button>

                        {showImport && (
                            <div className="space-y-2 p-2 border border-border bg-muted/30">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleFileUpload}
                                        className="text-xs file:mr-2 file:py-1 file:px-2 file:border-0 file:text-xs file:bg-muted file:text-foreground"
                                    />
                                </div>
                                <Textarea
                                    placeholder="Or paste your settings JSON here..."
                                    value={importText}
                                    onChange={(e) => setImportText(e.target.value)}
                                    className="text-xs min-h-[80px] font-mono"
                                />
                                {importError && (
                                    <p className="text-xs text-destructive">{importError}</p>
                                )}
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setShowImport(false);
                                            setImportText("");
                                            setImportError(null);
                                        }}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button size="sm" onClick={handleImport} className="flex-1">
                                        Import
                                    </Button>
                                </div>
                            </div>
                        )}

                        <Separator />

                        <Button
                            variant="destructive"
                            size="sm"
                            className="w-full justify-start"
                            onClick={handleReset}
                        >
                            <TrashIcon className="size-4 mr-2" />
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
