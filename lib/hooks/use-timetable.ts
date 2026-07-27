"use client";

import { useState, useEffect, useCallback } from "react";
import {
    electiveGroups,
    ElectiveOption,
    ElectiveGroup,
    ElectiveType,
    LabBatch,
} from "@/lib/timetable-data";

const STORAGE_KEY = "timetable-electives";
const CUSTOM_ELECTIVES_KEY = "timetable-custom-electives";
const SETUP_DONE_KEY = "timetable-setup-done";

export type UserElectiveSelections = Partial<Record<ElectiveType, string>> & {
    labBatch?: LabBatch;
};

export interface CustomElective extends ElectiveOption {
    groupType: ElectiveType;
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
        localStorage.removeItem(SETUP_DONE_KEY);
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

            localStorage.setItem(SETUP_DONE_KEY, "1");
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
        updateCustomElective,
        getElectiveOptions,
        getSelectedElective,
        getLabBatch,
        resetSetup,
        getAllElectiveGroups,
        exportSettings,
        importSettings,
    };
}
