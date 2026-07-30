"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
    electiveGroups,
    ElectiveOption,
    ElectiveGroup,
    ElectiveType,
    electiveTypes,
    LabBatch,
} from "@/lib/timetable-data";
import {
    buildOptionIndex,
    buildOptionsByType,
    resolveSelections,
} from "@/lib/elective-index";

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

    /**
     * Mirror of `customElectives`, so the add/remove/update callbacks can derive
     * the next list without taking the current one as a dependency. Keeping them
     * out of the dependency array is what lets them keep one identity for the
     * lifetime of the hook: they are passed down to the setup modal, and a
     * callback that changes on every edit invalidates everything holding it.
     * (Same shape as the refs in `theme-provider.tsx`, for the same reason.)
     */
    const customElectivesRef = useRef(customElectives);

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
                customElectivesRef.current = parsed;
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

    const commitCustomElectives = useCallback((updated: CustomElective[]) => {
        customElectivesRef.current = updated;
        setCustomElectives(updated);
        localStorage.setItem(CUSTOM_ELECTIVES_KEY, JSON.stringify(updated));
    }, []);

    // Add custom elective
    const addCustomElective = useCallback(
        (elective: CustomElective) =>
            commitCustomElectives([...customElectivesRef.current, elective]),
        [commitCustomElectives]
    );

    // Remove custom elective
    const removeCustomElective = useCallback(
        (electiveId: string) =>
            commitCustomElectives(
                customElectivesRef.current.filter((e) => e.id !== electiveId)
            ),
        [commitCustomElectives]
    );

    // Update custom elective
    const updateCustomElective = useCallback(
        (elective: CustomElective) =>
            commitCustomElectives(
                customElectivesRef.current.map((e) =>
                    e.id === elective.id ? elective : e
                )
            ),
        [commitCustomElectives]
    );

    // Each of these rebuilds only when the data underneath it actually changes,
    // rather than once per cell per render. See lib/elective-index.ts.
    const optionsByType = useMemo(
        () => buildOptionsByType(customElectives),
        [customElectives]
    );

    const optionIndex = useMemo(() => buildOptionIndex(optionsByType), [optionsByType]);

    /** Every basket's chosen course, resolved once per change of selection. */
    const selectedElectives = useMemo(
        () => resolveSelections(selections, optionIndex),
        [selections, optionIndex]
    );

    // Get all elective options for a type (including custom ones)
    const getElectiveOptions = useCallback(
        (type: ElectiveType): ElectiveOption[] => optionsByType[type],
        [optionsByType]
    );

    // Get selected elective for a type
    const getSelectedElective = useCallback(
        (type: ElectiveType): ElectiveOption | null => selectedElectives[type],
        [selectedElectives]
    );

    const labBatch = selections.labBatch ?? null;

    // Get lab batch
    const getLabBatch = useCallback((): LabBatch | null => labBatch, [labBatch]);

    // Reset all settings
    const resetSetup = useCallback(() => {
        setSelections({});
        customElectivesRef.current = [];
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

    /**
     * Elective groups with the user's own courses merged in.
     *
     * `components/timetable.tsx` renders two `SetupModal`s and passes this to
     * both, so as a function it rebuilt all six groups twice per render — for
     * modals that are usually closed. As a memo it is built once per change to
     * the custom electives, and both modals get the same object.
     */
    const allElectiveGroups = useMemo<ElectiveGroup[]>(
        () =>
            electiveGroups.map((group) => ({
                ...group,
                options: optionsByType[group.type],
            })),
        [optionsByType]
    );

    const getAllElectiveGroups = useCallback(
        (): ElectiveGroup[] => allElectiveGroups,
        [allElectiveGroups]
    );

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
                if (isKnownType(type) && typeof id === "string" && id) {
                    selections[type] = id;
                }
            }

            const customElectives = (data.customElectives ?? []).filter((e) =>
                isKnownType(e.groupType)
            );

            setSelections(selections);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
            customElectivesRef.current = customElectives;
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
        getLabBatch,
        resetSetup,
        getAllElectiveGroups,
        exportSettings,
        importSettings,
        /**
         * The memoised forms of the three getters above. Prefer these in
         * anything that renders: they hold one identity until their inputs
         * actually change, so a component can be memoised on them, which the
         * getters — recreated on each render of this hook — cannot support.
         */
        selectedElectives,
        allElectiveGroups,
        labBatch,
    };
}
