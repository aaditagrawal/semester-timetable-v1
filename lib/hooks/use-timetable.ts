"use client";

import { useState, useEffect, useCallback } from "react";
import {
    electiveGroups,
    ElectiveOption,
    ElectiveGroup,
    LabBatch,
} from "@/lib/timetable-data";

const STORAGE_KEY = "timetable-electives";
const CUSTOM_ELECTIVES_KEY = "timetable-custom-electives";

export interface UserElectiveSelections {
    "PE-1"?: string;
    "PE-2"?: string;
    OE?: string;
    "FC-2"?: string;
    labBatch?: LabBatch;
}

export interface CustomElective extends ElectiveOption {
    groupType: "PE-1" | "PE-2" | "OE" | "FC-2";
}

export interface TimetableExport {
    version: 1;
    selections: UserElectiveSelections;
    customElectives: CustomElective[];
    exportedAt: string;
}

export function useTimetable() {
    const [selections, setSelections] = useState<UserElectiveSelections>({});
    const [customElectives, setCustomElectives] = useState<CustomElective[]>([]);
    const [isSetupComplete, setIsSetupComplete] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);

    // Load from localStorage on mount
    useEffect(() => {
        const savedSelections = localStorage.getItem(STORAGE_KEY);
        const savedCustomElectives = localStorage.getItem(CUSTOM_ELECTIVES_KEY);

        if (savedSelections) {
            try {
                const parsed = JSON.parse(savedSelections);
                setSelections(parsed);
                // Check if setup is complete (has labBatch and FC-2 at minimum)
                if (parsed.labBatch && parsed["FC-2"]) {
                    setIsSetupComplete(true);
                }
            } catch {
                console.error("Failed to parse saved selections");
            }
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
        setIsSetupComplete(true);
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

    // Get all elective options for a type (including custom ones)
    const getElectiveOptions = useCallback(
        (type: "PE-1" | "PE-2" | "OE" | "FC-2"): ElectiveOption[] => {
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
        (type: "PE-1" | "PE-2" | "OE" | "FC-2"): ElectiveOption | null => {
            const selectedId = selections[type];
            if (!selectedId) return null;

            const options = getElectiveOptions(type);
            return options.find((opt) => opt.id === selectedId) || null;
        },
        [selections, getElectiveOptions]
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
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(CUSTOM_ELECTIVES_KEY);
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
            version: 1,
            selections,
            customElectives,
            exportedAt: new Date().toISOString(),
        };
        return JSON.stringify(exportData, null, 2);
    }, [selections, customElectives]);

    // Import settings from JSON
    const importSettings = useCallback((jsonString: string): boolean => {
        try {
            const data = JSON.parse(jsonString) as TimetableExport;

            if (data.version !== 1) {
                console.error("Unsupported export version");
                return false;
            }

            if (data.selections) {
                setSelections(data.selections);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data.selections));
            }

            if (data.customElectives) {
                setCustomElectives(data.customElectives);
                localStorage.setItem(CUSTOM_ELECTIVES_KEY, JSON.stringify(data.customElectives));
            }

            setIsSetupComplete(true);
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
        saveSelections,
        addCustomElective,
        removeCustomElective,
        getElectiveOptions,
        getSelectedElective,
        getLabBatch,
        resetSetup,
        getAllElectiveGroups,
        exportSettings,
        importSettings,
    };
}
