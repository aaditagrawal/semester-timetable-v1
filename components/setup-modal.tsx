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
    AlertDialogAction,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    UserElectiveSelections,
    CustomElective,
} from "@/lib/hooks/use-timetable";
import { ElectiveGroup, LabBatch } from "@/lib/timetable-data";
import { PlusIcon, TrashIcon, XIcon, CheckIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";

interface SetupModalProps {
    open: boolean;
    electiveGroups: ElectiveGroup[];
    customElectives: CustomElective[];
    initialSelections?: UserElectiveSelections;
    onSave: (selections: UserElectiveSelections) => void;
    onAddCustom: (elective: CustomElective) => void;
    onRemoveCustom: (id: string) => void;
    onUpdateCustom: (elective: CustomElective) => void;
    onClose?: () => void;
    isEditing?: boolean;
}

export function SetupModal({
    open,
    electiveGroups,
    customElectives,
    initialSelections,
    onSave,
    onAddCustom,
    onRemoveCustom,
    onUpdateCustom,
    onClose,
    isEditing = false,
}: SetupModalProps) {
    const [selections, setSelections] = useState<UserElectiveSelections>(
        initialSelections || {}
    );
    const [showAddCustom, setShowAddCustom] = useState<
        "PE-1" | "PE-2" | "OE" | "FC-2" | null
    >(null);
    const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
    const [customForm, setCustomForm] = useState({
        abbreviation: "",
        code: "",
        name: "",
        faculty: "",
        room: "",
    });
    const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

    // Update selections when initialSelections change
    React.useEffect(() => {
        if (initialSelections) {
            setSelections(initialSelections);
        }
    }, [initialSelections]);

    const handleSelectionChange = (
        type: "PE-1" | "PE-2" | "OE" | "FC-2" | "labBatch",
        value: string
    ) => {
        setSelections((prev) => ({
            ...prev,
            [type]: value,
        }));
        setSearchQueries((prev) => ({ ...prev, [type]: "" }));
    };

    const handleAddCustom = () => {
        if (showAddCustom && customForm.name) {
            const newElective: CustomElective = {
                id: `custom-${showAddCustom}-${Date.now()}`,
                abbreviation: customForm.abbreviation || customForm.name.substring(0, 4).toUpperCase(),
                code: customForm.code || "CUSTOM",
                name: customForm.name,
                faculty: customForm.faculty
                    ? customForm.faculty.split(",").map((f) => ({ name: f.trim() }))
                    : [{ name: "TBD" }],
                room: customForm.room || undefined,
                groupType: showAddCustom,
            };
            onAddCustom(newElective);
            setCustomForm({
                abbreviation: "",
                code: "",
                name: "",
                faculty: "",
                room: "",
            });
            setShowAddCustom(null);
        }
    };

    const handleEditCustom = (elective: CustomElective) => {
        setEditingCustomId(elective.id);
        setShowAddCustom(elective.groupType);
        setCustomForm({
            abbreviation: elective.abbreviation,
            code: elective.code,
            name: elective.name,
            faculty: elective.faculty.map((f) => f.name).join(", "),
            room: elective.room || "",
        });
    };

    const handleUpdateCustom = () => {
        if (editingCustomId && showAddCustom && customForm.name) {
            const updatedElective: CustomElective = {
                id: editingCustomId,
                abbreviation: customForm.abbreviation || customForm.name.substring(0, 4).toUpperCase(),
                code: customForm.code || "CUSTOM",
                name: customForm.name,
                faculty: customForm.faculty
                    ? customForm.faculty.split(",").map((f) => ({ name: f.trim() }))
                    : [{ name: "TBD" }],
                room: customForm.room || undefined,
                groupType: showAddCustom,
            };
            onUpdateCustom(updatedElective);
            setCustomForm({
                abbreviation: "",
                code: "",
                name: "",
                faculty: "",
                room: "",
            });
            setShowAddCustom(null);
            setEditingCustomId(null);
        }
    };

    const handleCancelCustom = () => {
        setCustomForm({
            abbreviation: "",
            code: "",
            name: "",
            faculty: "",
            room: "",
        });
        setShowAddCustom(null);
        setEditingCustomId(null);
    };

    const handleSave = () => {
        onSave(selections);
    };

    const getOptionsForType = (type: "PE-1" | "PE-2" | "OE" | "FC-2") => {
        const group = electiveGroups.find((g) => g.type === type);
        const groupOptions = group?.options || [];
        const customOptions = customElectives
            .filter((e) => e.groupType === type)
            .map(({ groupType, ...rest }) => rest);
        return [...groupOptions, ...customOptions];
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "PE-1":
                return "Program Elective 1";
            case "PE-2":
                return "Program Elective 2";
            case "OE":
                return "Open Elective";
            case "FC-2":
                return "Flexi Core 2";
            default:
                return type;
        }
    };

    const isFormComplete = () => {
        return Boolean(selections.labBatch && selections["FC-2"]);
    };

    const getSelectedOption = (type: "PE-1" | "PE-2" | "OE" | "FC-2") => {
        const selectedId = selections[type];
        if (!selectedId) return null;
        return getOptionsForType(type).find((opt) => opt.id === selectedId);
    };

    return (
        <AlertDialog open={open}>
            <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md md:max-w-lg p-3 sm:p-4 max-h-[90vh] overflow-hidden flex flex-col">
                <AlertDialogHeader className="flex-shrink-0">
                    <div className="flex items-center justify-between gap-2">
                        <AlertDialogTitle className="text-sm sm:text-base">
                            {isEditing ? "Edit Your Timetable" : "Configure Your Timetable"}
                        </AlertDialogTitle>
                        {isEditing && onClose && (
                            <Button variant="ghost" size="icon-xs" onClick={onClose} className="flex-shrink-0">
                                <XIcon className="size-4" />
                            </Button>
                        )}
                    </div>
                    <AlertDialogDescription className="text-xs">
                        Select your lab batch and elective courses.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex-1 overflow-y-auto space-y-3 py-2 -mx-3 sm:-mx-4 px-3 sm:px-4">
                    {/* Lab Batch Selection */}
                    <Card size="sm" className="border-primary/20 bg-primary/5">
                        <CardHeader className="pb-1">
                            <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-xs sm:text-sm">Lab Batch</span>
                                <Badge variant="default" className="text-[10px] sm:text-xs">Required</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                    variant={selections.labBatch === "B1" ? "default" : "outline"}
                                    className="flex-1 min-w-0 h-auto py-2 px-3"
                                    size="sm"
                                    onClick={() => handleSelectionChange("labBatch", "B1")}
                                >
                                    <div className="text-left w-full overflow-hidden">
                                        <div className="font-medium text-xs sm:text-sm">Batch 1 (B1)</div>
                                        <div className="text-[10px] sm:text-xs opacity-70 truncate">MON: MADL, THU: NDPL</div>
                                    </div>
                                </Button>
                                <Button
                                    variant={selections.labBatch === "B2" ? "default" : "outline"}
                                    className="flex-1 min-w-0 h-auto py-2 px-3"
                                    size="sm"
                                    onClick={() => handleSelectionChange("labBatch", "B2")}
                                >
                                    <div className="text-left w-full overflow-hidden">
                                        <div className="font-medium text-xs sm:text-sm">Batch 2 (B2)</div>
                                        <div className="text-[10px] sm:text-xs opacity-70 truncate">MON: NDPL, THU: MADL</div>
                                    </div>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Separator />

                    {/* Elective Groups */}
                    {(["FC-2", "PE-1", "PE-2", "OE"] as const).map((type) => {
                        const options = getOptionsForType(type);
                        const hasOptions = options.length > 0;
                        const isRequired = type === "FC-2";
                        const selectedOption = getSelectedOption(type);
                        const searchQuery = searchQueries[type] || "";
                        const filteredOptions = searchQuery
                            ? options.filter(
                                (opt) =>
                                    opt.abbreviation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    opt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    opt.code.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            : options.slice(0, 10);

                        return (
                            <Card key={type} size="sm">
                                <CardHeader className="pb-1">
                                    <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
                                        <span className="text-xs sm:text-sm">{getTypeLabel(type)}</span>
                                        <div className="flex gap-1 flex-shrink-0">
                                            <Badge variant="outline" className="text-[10px] sm:text-xs">{type === "FC-2" ? "Flexi Core" : type}</Badge>
                                            {isRequired && <Badge variant="secondary" className="text-[10px] sm:text-xs">Required</Badge>}
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {selectedOption ? (
                                        <div className="flex items-center justify-between gap-2 p-2 bg-primary/10 border border-primary/20 rounded-none">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-xs sm:text-sm">{selectedOption.abbreviation}</div>
                                                <div className="text-[10px] sm:text-xs text-muted-foreground truncate">{selectedOption.name}</div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon-xs"
                                                className="flex-shrink-0"
                                                onClick={() => handleSelectionChange(type, "")}
                                            >
                                                <XIcon className="size-4" />
                                            </Button>
                                        </div>
                                    ) : hasOptions ? (
                                        <>
                                            <div className="relative">
                                                <div className="relative">
                                                    <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder={`Search ${getTypeLabel(type)}...`}
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQueries((prev) => ({ ...prev, [type]: e.target.value }))}
                                                        className="pl-8 text-xs"
                                                    />
                                                </div>
                                                {searchQuery && (
                                                    <div className="mt-2 border border-border rounded-none">
                                                        {filteredOptions.length > 0 ? (
                                                            filteredOptions.map((option) => (
                                                                <button
                                                                    key={option.id}
                                                                    onClick={() => handleSelectionChange(type, option.id)}
                                                                    className="w-full flex items-start gap-2 p-2 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                                                                >
                                                                    <div className="flex-1">
                                                                        <div className="font-medium text-xs">{option.abbreviation}</div>
                                                                        <div className="text-xs text-muted-foreground">{option.name}</div>
                                                                        <div className="text-xs text-muted-foreground/70">{option.code}</div>
                                                                    </div>
                                                                    <CheckIcon className="size-3.5 text-muted-foreground shrink-0 mt-1" />
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="p-3 text-xs text-muted-foreground text-center">
                                                                No results found
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-[10px] sm:text-xs text-muted-foreground py-2 text-center bg-muted/30 rounded-none">
                                            No courses added yet. Add your own below.
                                        </div>
                                    )}

                                    {/* Custom electives list */}
                                    {customElectives
                                        .filter((e) => e.groupType === type)
                                        .map((custom) => (
                                            <div
                                                key={custom.id}
                                                className="flex items-center justify-between gap-2 text-xs bg-muted/50 px-2 py-1.5"
                                            >
                                                <span className="truncate flex-1">
                                                    {custom.abbreviation} - {custom.name}
                                                </span>
                                                <div className="flex gap-1 flex-shrink-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-xs"
                                                        onClick={() => handleEditCustom(custom)}
                                                    >
                                                        <CheckIcon className="size-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-xs"
                                                        onClick={() => onRemoveCustom(custom.id)}
                                                    >
                                                        <TrashIcon className="size-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}

                                    {showAddCustom === type ? (
                                        <div className="space-y-2 p-2 border border-border bg-muted/30">
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input
                                                    placeholder="Abbrev (e.g. ML)"
                                                    value={customForm.abbreviation}
                                                    onChange={(e) =>
                                                        setCustomForm((prev) => ({
                                                            ...prev,
                                                            abbreviation: e.target.value,
                                                        }))
                                                    }
                                                    className="text-xs"
                                                />
                                                <Input
                                                    placeholder="Code (e.g. ICT 3250)"
                                                    value={customForm.code}
                                                    onChange={(e) =>
                                                        setCustomForm((prev) => ({
                                                            ...prev,
                                                            code: e.target.value,
                                                        }))
                                                    }
                                                    className="text-xs"
                                                />
                                            </div>
                                            <Input
                                                placeholder="Course Name *"
                                                value={customForm.name}
                                                onChange={(e) =>
                                                    setCustomForm((prev) => ({
                                                        ...prev,
                                                        name: e.target.value,
                                                    }))
                                                }
                                                className="text-xs"
                                            />
                                            <Input
                                                placeholder="Faculty (comma separated)"
                                                value={customForm.faculty}
                                                onChange={(e) =>
                                                    setCustomForm((prev) => ({
                                                        ...prev,
                                                        faculty: e.target.value,
                                                    }))
                                                }
                                                className="text-xs"
                                            />
                                            <Input
                                                placeholder="Room (optional)"
                                                value={customForm.room}
                                                onChange={(e) =>
                                                    setCustomForm((prev) => ({
                                                        ...prev,
                                                        room: e.target.value,
                                                    }))
                                                }
                                                className="text-xs"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleCancelCustom}
                                                    className="flex-1"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={editingCustomId ? handleUpdateCustom : handleAddCustom}
                                                    disabled={!customForm.name}
                                                    className="flex-1"
                                                >
                                                    {editingCustomId ? "Update" : "Add"}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowAddCustom(type)}
                                            className="w-full justify-start"
                                        >
                                            <PlusIcon className="size-3 mr-1" />
                                            Add custom {type}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="flex-shrink-0 pt-2">
                    <Separator className="mb-3" />

                    <AlertDialogFooter>
                        {isEditing && onClose && (
                            <AlertDialogCancel onClick={onClose} size="sm">Cancel</AlertDialogCancel>
                        )}
                        <AlertDialogAction onClick={handleSave} disabled={!isFormComplete()} size="sm">
                            {isEditing ? "Save Changes" : "Save & Continue"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
