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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { PlusIcon, TrashIcon, XIcon } from "@phosphor-icons/react";

interface SetupModalProps {
    open: boolean;
    electiveGroups: ElectiveGroup[];
    customElectives: CustomElective[];
    initialSelections?: UserElectiveSelections;
    onSave: (selections: UserElectiveSelections) => void;
    onAddCustom: (elective: CustomElective) => void;
    onRemoveCustom: (id: string) => void;
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
    onClose,
    isEditing = false,
}: SetupModalProps) {
    const [selections, setSelections] = useState<UserElectiveSelections>(
        initialSelections || {}
    );
    const [showAddCustom, setShowAddCustom] = useState<
        "PE-1" | "PE-2" | "OE" | "FC-2" | null
    >(null);
    const [customForm, setCustomForm] = useState({
        abbreviation: "",
        code: "",
        name: "",
        faculty: "",
        room: "",
    });

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

    const handleSave = () => {
        onSave(selections);
    };

    const getOptionsForType = (type: "PE-1" | "PE-2" | "OE" | "FC-2") => {
        const group = electiveGroups.find((g) => g.type === type);
        const groupOptions = group?.options || [];
        const customOptions = customElectives.filter((e) => e.groupType === type);
        return [...groupOptions, ...customOptions];
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "PE-1":
                return "Professional Elective 1";
            case "PE-2":
                return "Professional Elective 2";
            case "OE":
                return "Open Elective";
            case "FC-2":
                return "Flexi Core 2";
            default:
                return type;
        }
    };

    const isFormComplete = () => {
        // Only require lab batch and Flexi Core 2
        // PE and OE are always optional
        return Boolean(selections.labBatch && selections["FC-2"]);
    };

    return (
        <AlertDialog open={open}>
            <AlertDialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <AlertDialogHeader>
                    <div className="flex items-center justify-between">
                        <AlertDialogTitle className="text-base">
                            {isEditing ? "Edit Your Timetable" : "Configure Your Timetable"}
                        </AlertDialogTitle>
                        {isEditing && onClose && (
                            <Button variant="ghost" size="icon-xs" onClick={onClose}>
                                <XIcon className="size-4" />
                            </Button>
                        )}
                    </div>
                    <AlertDialogDescription>
                        Select your lab batch and elective courses. Add custom courses if not listed.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 py-2">
                    {/* Lab Batch Selection */}
                    <Card size="sm" className="border-primary/20 bg-primary/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between">
                                <span>Lab Batch</span>
                                <Badge variant="default">Required</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select
                                value={selections.labBatch || ""}
                                onValueChange={(value) => handleSelectionChange("labBatch", value)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select your batch" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="B1">
                                        <span className="font-medium">Batch 1 (B1)</span>
                                        <span className="text-muted-foreground ml-2 text-xs">
                                            MON: MADL, THU: NDPL
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="B2">
                                        <span className="font-medium">Batch 2 (B2)</span>
                                        <span className="text-muted-foreground ml-2 text-xs">
                                            MON: NDPL, THU: MADL
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    <Separator />

                    {/* Elective Groups */}
                    {(["FC-2", "PE-1", "PE-2", "OE"] as const).map((type) => {
                        const options = getOptionsForType(type);
                        const hasOptions = options.length > 0;
                        const isRequired = type === "FC-2";

                        return (
                            <Card key={type} size="sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="text-sm">{getTypeLabel(type)}</span>
                                        <div className="flex gap-1">
                                            <Badge variant="outline">{type === "FC-2" ? "Flexi Core" : type}</Badge>
                                            {isRequired && <Badge variant="secondary">Required</Badge>}
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {hasOptions ? (
                                        <Select
                                            value={selections[type] || ""}
                                            onValueChange={(value) => handleSelectionChange(type, value)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={`Select ${getTypeLabel(type)}`} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {options.map((option) => (
                                                    <SelectItem key={option.id} value={option.id}>
                                                        <div className="flex items-center gap-2 max-w-[280px]">
                                                            <span className="font-medium shrink-0">
                                                                {option.abbreviation}
                                                            </span>
                                                            <span className="text-muted-foreground truncate">
                                                                {option.name}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="text-xs text-muted-foreground py-2 text-center bg-muted/30 rounded-none">
                                            No courses added yet. Add your own below.
                                        </div>
                                    )}

                                    {/* Custom electives list */}
                                    {customElectives
                                        .filter((e) => e.groupType === type)
                                        .map((custom) => (
                                            <div
                                                key={custom.id}
                                                className="flex items-center justify-between text-xs bg-muted/50 px-2 py-1.5"
                                            >
                                                <span className="truncate max-w-[200px]">
                                                    {custom.abbreviation} - {custom.name}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-xs"
                                                    onClick={() => onRemoveCustom(custom.id)}
                                                >
                                                    <TrashIcon className="size-3" />
                                                </Button>
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
                                                    onClick={() => setShowAddCustom(null)}
                                                    className="flex-1"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={handleAddCustom}
                                                    disabled={!customForm.name}
                                                    className="flex-1"
                                                >
                                                    Add
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

                <Separator />

                <AlertDialogFooter>
                    {isEditing && onClose && (
                        <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
                    )}
                    <AlertDialogAction onClick={handleSave} disabled={!isFormComplete()}>
                        {isEditing ? "Save Changes" : "Save & Continue"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
