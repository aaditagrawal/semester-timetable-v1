"use client";

import { useState, useEffect, useCallback } from "react";
import {
    electiveGroups,
    ElectiveOption,
    ElectiveGroup,
    ElectiveType,
    electiveTypes,
    isProjectEligible,
    isStudentProjectSelection,
    LabBatch,
} from "@/lib/timetable-data";

const STORAGE_KEY = "timetable-electives";
const CUSTOM_ELECTIVES_KEY = "timetable-custom-electives";
const SETUP_DONE_KEY = "timetable-setup-done";
const SHOW_ROOM_KEY = "timetable-show-room";
const TILE_LABEL_KEY = "timetable-tile-label";

/** Bumped for Sem VII: the elective baskets changed, so v1 needs filtering. */
const EXPORT_VERSION = 2;

export type UserElectiveSelections = Partial<Record<ElectiveType, string>> & {
    labBatch?: LabBatch;
};

/** What a tile shows as its course label: "HCI [G]" vs "ICT 4403". */
export type TileLabelMode = "abbreviation" | "code";

export interface CustomElective extends ElectiveOption {
    groupType: ElectiveType;
}

export interface TimetableExport {
    version: number;
    selections: UserElectiveSelections;
    customElectives: CustomElective[];
    /** Display preference; absent in older backups, which fall back to off. */
    showRoom?: boolean;
    /** Display preference; absent in older backups, which fall back to abbreviation. */
    tileLabel?: TileLabelMode;
    exportedAt: string;
}

/**
 * Read on first render rather than in an effect: the grid is gated behind
 * `isLoading`, so nothing that depends on this is in the server-rendered
 * output and hydration still matches.
 */
function readShowRoom(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SHOW_ROOM_KEY) === "1";
}

function readTileLabel(): TileLabelMode {
    if (typeof window === "undefined") return "abbreviation";
    return localStorage.getItem(TILE_LABEL_KEY) === "code" ? "code" : "abbreviation";
}

export function useTimetable() {
    const [selections, setSelections] = useState<UserElectiveSelections>({});
    const [customElectives, setCustomElectives] = useState<CustomElective[]>([]);
    const [isSetupComplete, setIsSetupComplete] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showRoom, setShowRoomState] = useState<boolean>(readShowRoom);
    const [tileLabel, setTileLabelState] = useState<TileLabelMode>(readTileLabel);

    // Load from localStorage on mount
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

        // Every Sem VII slot is a user-supplied elective, so there is no
        // required field to infer completion from — it is an explicit flag.
        if (localStorage.getItem(SETUP_DONE_KEY)) {
            setIsSetupComplete(true);
        }

        if (savedCustomElectives) {
            try {
                const parsed = JSON.parse(savedCustomElectives);
                setCustomElectives(parsed);
            } catch {
                console.error("Failed to parse custom electives");
            }
        }

        setIsLoading(false);
    }, []);

    // Save selections to localStorage
    const saveSelections = useCallback((newSelections: UserElectiveSelections) => {
        setSelections(newSelections);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSelections));
        localStorage.setItem(SETUP_DONE_KEY, "1");
        setIsSetupComplete(true);
    }, []);

    // Toggle "show room beside the course on each tile"
    const setShowRoom = useCallback((value: boolean) => {
        setShowRoomState(value);
        localStorage.setItem(SHOW_ROOM_KEY, value ? "1" : "0");
    }, []);

    // Choose whether tiles are labelled with the abbreviation or the course code
    const setTileLabel = useCallback((value: TileLabelMode) => {
        setTileLabelState(value);
        localStorage.setItem(TILE_LABEL_KEY, value);
    }, []);

    // Add custom elective
    const addCustomElective = useCallback(
        (elective: CustomElective) => {
            const updated = [...customElectives, elective];
            setCustomElectives(updated);
            localStorage.setItem(CUSTOM_ELECTIVES_KEY, JSON.stringify(updated));
        },
        [customElectives]
    );

    // Remove custom elective
    const removeCustomElective = useCallback(
        (electiveId: string) => {
            const updated = customElectives.filter((e) => e.id !== electiveId);
            setCustomElectives(updated);
            localStorage.setItem(CUSTOM_ELECTIVES_KEY, JSON.stringify(updated));
        },
        [customElectives]
    );

    // Update custom elective
    const updateCustomElective = useCallback(
        (elective: CustomElective) => {
            const updated = customElectives.map((e) =>
                e.id === elective.id ? elective : e
            );
            setCustomElectives(updated);
            localStorage.setItem(CUSTOM_ELECTIVES_KEY, JSON.stringify(updated));
        },
        [customElectives]
    );

    // Get all elective options for a type (including custom ones)
    const getElectiveOptions = useCallback(
        (type: ElectiveType): ElectiveOption[] => {
            const group = electiveGroups.find((g) => g.type === type);
            const defaultOptions = group?.options || [];
            const customOptions = customElectives
                .filter((e) => e.groupType === type)
                .map(({ groupType, ...rest }) => rest as ElectiveOption);

            return [...defaultOptions, ...customOptions];
        },
        [customElectives]
    );

    // Get selected elective for a type
    const getSelectedElective = useCallback(
        (type: ElectiveType): ElectiveOption | null => {
            const selectedId = selections[type];
            if (!selectedId) return null;
            // The student project is a selection, not a course — there is
            // nothing to render, and `isStudentProject` is what tells the
            // views to drop the slot instead of prompting for a course.
            if (isStudentProjectSelection(selectedId)) return null;

            const options = getElectiveOptions(type);
            return options.find((opt) => opt.id === selectedId) || null;
        },
        [selections, getElectiveOptions]
    );

    /**
     * Doing the student project in place of this basket. Distinguishes "chose
     * to have no class here" from "hasn't picked yet" — both resolve to a null
     * course, but only the latter is a gap worth prompting about.
     */
    const isStudentProject = useCallback(
        (type: ElectiveType): boolean => isStudentProjectSelection(selections[type]),
        [selections]
    );

    // Get lab batch
    const getLabBatch = useCallback((): LabBatch | null => {
        return selections.labBatch || null;
    }, [selections]);

    // Reset all settings
    const resetSetup = useCallback(() => {
        setSelections({});
        setCustomElectives([]);
        setIsSetupComplete(false);
        setShowRoomState(false);
        setTileLabelState("abbreviation");
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(CUSTOM_ELECTIVES_KEY);
        localStorage.removeItem(SETUP_DONE_KEY);
        localStorage.removeItem(SHOW_ROOM_KEY);
        localStorage.removeItem(TILE_LABEL_KEY);
    }, []);

    // Get all elective groups with custom options merged
    const getAllElectiveGroups = useCallback((): ElectiveGroup[] => {
        return electiveGroups.map((group) => ({
            ...group,
            options: getElectiveOptions(group.type),
        }));
    }, [getElectiveOptions]);

    // Export settings as JSON
    const exportSettings = useCallback((): string => {
        const exportData: TimetableExport = {
            version: EXPORT_VERSION,
            selections,
            customElectives,
            showRoom,
            tileLabel,
            exportedAt: new Date().toISOString(),
        };
        return JSON.stringify(exportData, null, 2);
    }, [selections, customElectives, showRoom, tileLabel]);

    /**
     * Import settings from JSON.
     *
     * Version 1 backups came from the Sem VI app, whose baskets were PE-1,
     * PE-2, OE and FC-2. Only OE survives into Sem VII, so those payloads are
     * accepted but filtered down to keys this semester actually has — keeping
     * whatever still applies without silently marking setup complete on a
     * config that would leave most of the grid empty.
     *
     * The student-project sentinel travels as an ordinary selection value, so
     * no version bump is needed: a build without this feature reads it as an id
     * it cannot resolve and shows the OE as unset rather than breaking.
     */
    const importSettings = useCallback((jsonString: string): boolean => {
        try {
            const data = JSON.parse(jsonString) as TimetableExport;

            if (data.version !== 1 && data.version !== EXPORT_VERSION) {
                console.error("Unsupported export version");
                return false;
            }

            const isKnownType = (t: string): t is ElectiveType =>
                (electiveTypes as string[]).includes(t);

            const selections: UserElectiveSelections = {};
            for (const [type, id] of Object.entries(data.selections ?? {})) {
                if (!isKnownType(type) || typeof id !== "string" || !id) continue;
                // Only the OE can be traded for the project; a hand-edited
                // backup must not be able to delete a compulsory PE slot.
                if (isStudentProjectSelection(id) && !isProjectEligible(type)) continue;
                selections[type] = id;
            }

            const customElectives = (data.customElectives ?? []).filter((e) =>
                isKnownType(e.groupType)
            );

            setSelections(selections);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
            setCustomElectives(customElectives);
            localStorage.setItem(CUSTOM_ELECTIVES_KEY, JSON.stringify(customElectives));

            const showRoom = data.showRoom === true;
            setShowRoomState(showRoom);
            localStorage.setItem(SHOW_ROOM_KEY, showRoom ? "1" : "0");

            const tileLabel: TileLabelMode =
                data.tileLabel === "code" ? "code" : "abbreviation";
            setTileLabelState(tileLabel);
            localStorage.setItem(TILE_LABEL_KEY, tileLabel);

            // A backup that carried nothing usable for this semester leaves the
            // user at the setup modal rather than an empty timetable.
            const usable = Object.keys(selections).length > 0;
            if (usable) {
                localStorage.setItem(SETUP_DONE_KEY, "1");
            } else {
                localStorage.removeItem(SETUP_DONE_KEY);
            }
            setIsSetupComplete(usable);
            return true;
        } catch (error) {
            console.error("Failed to import settings:", error);
            return false;
        }
    }, []);

    return {
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
        getElectiveOptions,
        getSelectedElective,
        isStudentProject,
        getLabBatch,
        resetSetup,
        getAllElectiveGroups,
        exportSettings,
        importSettings,
    };
}
