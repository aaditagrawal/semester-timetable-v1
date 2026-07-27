"use client";

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

interface AppearanceDialogProps {
    open: boolean;
    onClose: () => void;
}

/**
 * Theming lives in its own window rather than inline in Settings: the template
 * grid and two swatch rows are taller than everything else in that dialog put
 * together, and they are a once-in-a-while decision.
 */
export function AppearanceDialog({ open, onClose }: AppearanceDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={(next) => !next && onClose()}>
            <AlertDialogContent className="max-w-sm">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-base">Appearance</AlertDialogTitle>
                    <AlertDialogDescription>
                        Pick a template, or set the accent and background yourself
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-2 max-h-[70vh] overflow-y-auto">
                    <AppearanceSettings />
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose}>Close</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
