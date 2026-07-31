"use client";

import * as React from "react";

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { AppearanceSettings } from "@/components/appearance-settings";
import { TileLabelMode } from "@/lib/hooks/use-timetable";

interface AppearanceDialogProps {
    open: boolean;
    onClose: () => void;
    tileLabel: TileLabelMode;
    onTileLabelChange: (value: TileLabelMode) => void;
    showRoom: boolean;
    onShowRoomChange: (value: boolean) => void;
}

/**
 * Theming lives in its own window rather than inline in Settings: the template
 * grid and two swatch rows are taller than everything else in that dialog put
 * together, and they are a once-in-a-while decision.
 */
function AppearanceDialogImpl({
    open,
    onClose,
    tileLabel,
    onTileLabelChange,
    showRoom,
    onShowRoomChange,
}: AppearanceDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={(next) => !next && onClose()}>
            {/* Cap the whole dialog (not just the body) so header and footer stay
                on-screen on mobile; the body is the only scroll container. */}
            <AlertDialogContent className="max-w-sm max-h-[90dvh] overflow-hidden flex flex-col">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-base">Appearance</AlertDialogTitle>
                    <AlertDialogDescription>
                        Pick a template, or set the accent and background yourself
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-2 flex-1 overflow-y-auto">
                    <AppearanceSettings
                        tileLabel={tileLabel}
                        onTileLabelChange={onTileLabelChange}
                        showRoom={showRoom}
                        onShowRoomChange={onShowRoomChange}
                    />
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
export const AppearanceDialog = React.memo(AppearanceDialogImpl);
