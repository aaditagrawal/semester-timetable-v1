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
import {
    ElectiveGroup,
    ElectiveType,
    electiveTypes,
    electiveTypeLabels,
} from "@/lib/timetable-data";
import { searchOptions } from "@/lib/elective-search";
import {
    PlusIcon,
    TrashIcon,
    XIcon,
    CheckIcon,
    MagnifyingGlassIcon,
    PencilSimpleIcon,
} from "@phosphor-icons/react";

type SetupStep = "start" | "electives" | "oe";

/** PE-3..PE-7 — everything the registration lookup can fill. */
const PROGRAM_ELECTIVES = electiveTypes.filter((type) => type !== "OE");

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
    const [showAddCustom, setShowAddCustom] = useState<ElectiveType | null>(null);
    const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
    const [customForm, setCustomForm] = useState({
        abbreviation: "",
        code: "",
        name: "",
        faculty: "",
        room: "",
    });
    const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
    // Component state only. The registration number is never persisted and
    // never leaves the device — the lookup runs against a local index.
    const [regInput, setRegInput] = useState("");
    // Mirrors regInput so the async lookup can check the field hasn't moved on.
    const regInputRef = React.useRef("");
    regInputRef.current = regInput;
    const [lookupState, setLookupState] = useState<
        "idle" | "loading" | "done" | "empty" | "error"
    >("idle");
    const [lookupMessage, setLookupMessage] = useState<string | null>(null);
    /**
     * Setup runs as three short steps rather than one long scroll: ask for the
     * registration number, confirm the program electives it filled, then pick
     * the open elective. The OE is always its own step because the published
     * allocation export covers PE-3..PE-7 only — there is no OE data to fill
     * from, so it is the one genuinely manual choice.
     *
     * Editing an existing setup skips straight to the electives.
     */
    const [step, setStep] = useState<SetupStep>(isEditing ? "electives" : "start");

    // Update selections when initialSelections change
    React.useEffect(() => {
        if (initialSelections) {
            setSelections(initialSelections);
        }
    }, [initialSelections]);

    const handleSelectionChange = (type: ElectiveType, value: string) => {
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

    /**
     * Prefill PE-3..PE-7 from the published allocations. Runs locally; the
     * registration number never leaves the device and is not persisted — only
     * the resulting option ids reach state, and the user still presses Save.
     */
    const handleLookup = async () => {
        const reg = regInput.trim();
        if (!reg || lookupState === "loading") return;

        setLookupState("loading");
        setLookupMessage(null);
        try {
            // Lazily imported so the ~41 KiB index is only fetched by people who
            // actually use the lookup, not on every page load.
            const { lookupAllocation, normalizeRegistration } = await import(
                "@/lib/allocation-lookup"
            );

            // The chunk fetch above is the one slow step, and the field stays
            // editable across it. If the number changed meanwhile, this result
            // belongs to someone else — drop it rather than fill the form with
            // a registration the user is no longer looking at.
            if (regInputRef.current.trim() !== reg) {
                setLookupState("idle");
                return;
            }

            const normalized = normalizeRegistration(reg);
            const allocations = normalized === null ? null : lookupAllocation(normalized);
            const found = Object.entries(allocations ?? {});

            if (found.length === 0) {
                setLookupState("empty");
                setLookupMessage(
                    "No allocation found for that number. Check it, or pick your courses manually."
                );
                return;
            }

            // Only fill empty slots. Anything already chosen — including a
            // custom elective — was a deliberate act and outranks the sheet.
            let filled = 0;
            let kept = 0;
            setSelections((prev) => {
                const next = { ...prev };
                for (const [type, id] of found) {
                    if (next[type as ElectiveType]) kept += 1;
                    else {
                        next[type as ElectiveType] = id;
                        filled += 1;
                    }
                }
                return next;
            });

            setLookupState("done");
            setStep("electives");
            setLookupMessage(
                filled === 0
                    ? "Your electives were already set — nothing changed."
                    : `Filled ${filled} elective${filled > 1 ? "s" : ""}` +
                      (kept > 0 ? `, kept ${kept} you had already chosen` : "") +
                      ". Check them below."
            );
        } catch {
            setLookupState("error");
            setLookupMessage("Lookup failed. Pick your courses below instead.");
        }
    };

    // `electiveGroups` arrives from getAllElectiveGroups(), which has already
    // merged the user's custom electives into each group. Appending them again
    // here would render every custom course twice, with a duplicate React key.
    const getOptionsForType = (type: ElectiveType) =>
        electiveGroups.find((g) => g.type === type)?.options ?? [];

    const getTypeLabel = (type: ElectiveType) => electiveTypeLabels[type];

    const getSelectedOption = (type: ElectiveType) => {
        const selectedId = selections[type];
        if (!selectedId) return null;
        return getOptionsForType(type).find((opt) => opt.id === selectedId);
    };

    // Editing skips the start step, so the lookup would otherwise be reachable
    // only on a fresh setup. Offer it here too while something is still unset —
    // it fills the gaps and leaves every deliberate choice alone.
    const unsetProgramElectives = PROGRAM_ELECTIVES.filter((type) => !selections[type]);
    const showLookup =
        step === "start" ||
        (isEditing && step === "electives" && unsetProgramElectives.length > 0);

    return (
        <AlertDialog open={open}>
            <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md md:max-w-lg p-3 sm:p-4 max-h-[90dvh] overflow-hidden flex flex-col">
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
                        {step === "start"
                            ? "Start with your registration number, or pick everything yourself."
                            : step === "electives"
                              ? isEditing
                                  ? "Change any of your electives, then save."
                                  : "Your program electives. Change any of them before continuing."
                              : "Last one — pick your open elective, or the student project instead."}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex-1 overflow-y-auto space-y-3 py-2 -mx-3 sm:-mx-4 px-3 sm:px-4">
                    {showLookup && (
                        <Card size="sm" className="border-primary/20 bg-primary/5">
                            <CardHeader className="pb-1">
                                <CardTitle className="text-xs sm:text-sm">
                                    Registration number
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <p className="text-[11px] text-muted-foreground">
                                    {step === "start" ? (
                                        <>
                                            Auto-fills your five program electives, with the
                                            right section and room. You&apos;ll get to check
                                            them next.
                                        </>
                                    ) : (
                                        <>
                                            {unsetProgramElectives.length} program elective
                                            {unsetProgramElectives.length > 1 ? "s are" : " is"}{" "}
                                            still unset. Fill{" "}
                                            {unsetProgramElectives.length > 1 ? "them" : "it"} from
                                            your registration number — anything you have already
                                            chosen is kept.
                                        </>
                                    )}
                                </p>
                                <div className="flex gap-2">
                                    <Input
                                        value={regInput}
                                        onChange={(e) => setRegInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                void handleLookup();
                                            }
                                        }}
                                        placeholder="e.g. 230953001"
                                        inputMode="numeric"
                                        autoComplete="off"
                                        autoFocus={step === "start"}
                                        disabled={lookupState === "loading"}
                                        className="text-xs"
                                        aria-label="Registration number"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() => void handleLookup()}
                                        disabled={lookupState === "loading" || !regInput.trim()}
                                        className="flex-shrink-0"
                                    >
                                        {lookupState === "loading"
                                            ? "Looking..."
                                            : step === "start"
                                              ? "Continue"
                                              : "Fill"}
                                    </Button>
                                </div>
                                {/* On later steps the message renders above the baskets
                                    instead, so it survives this card disappearing once
                                    everything is filled. */}
                                {step === "start" && lookupMessage && (
                                    <p className="text-[10px] text-muted-foreground">
                                        {lookupMessage}
                                    </p>
                                )}
                                {step === "start" && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-center text-[11px]"
                                        onClick={() => {
                                            setLookupMessage(null);
                                            setStep("electives");
                                        }}
                                    >
                                        Pick everything manually instead
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {step !== "start" && lookupMessage && (
                        <p className="text-[11px] text-muted-foreground px-1">{lookupMessage}</p>
                    )}

                    {/* Elective Groups, scoped to the current step. Editing has
                        no wizard to walk and saves straight from this step, so
                        it lists every basket at once — otherwise the OE would
                        be unreachable once setup is done. */}
                    {(step === "electives"
                        ? isEditing
                            ? electiveTypes
                            : PROGRAM_ELECTIVES
                        : step === "oe"
                          ? (["OE"] as ElectiveType[])
                          : []
                    ).map((type) => {
                        const options = getOptionsForType(type);
                        const hasOptions = options.length > 0;
                        const selectedOption = getSelectedOption(type);
                        const searchQuery = searchQueries[type] || "";

                        const filteredOptions = searchOptions(options, searchQuery);

                        return (
                            <Card key={type} size="sm">
                                <CardHeader className="pb-1">
                                    <CardTitle className="flex items-center justify-between gap-2">
                                        <span className="text-xs sm:text-sm">{getTypeLabel(type)}</span>
                                        <Badge variant="outline" className="text-[10px] sm:text-xs">
                                            {type}
                                        </Badge>
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
                                                        placeholder="Search by abbreviation, code or name..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQueries((prev) => ({ ...prev, [type]: e.target.value }))}
                                                        className="pl-8 text-xs"
                                                    />
                                                </div>
                                                {/* Always shown, so the basket reads as a pick-list rather than
                                                    something you have to fill in yourself. */}
                                                <div className="mt-2 border border-border rounded-none max-h-48 overflow-y-auto">
                                                    {filteredOptions.length > 0 ? (
                                                        filteredOptions.map((option) => (
                                                            <button
                                                                key={option.id}
                                                                onClick={() => handleSelectionChange(type, option.id)}
                                                                className="w-full flex items-start gap-2 p-2 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                                                            >
                                                                <div className="flex-1">
                                                                    <div className="font-medium text-xs">
                                                                        {option.abbreviation}
                                                                        {option.room && (
                                                                            <span className="ml-1.5 font-normal text-muted-foreground/70">
                                                                                {option.room}
                                                                            </span>
                                                                        )}
                                                                    </div>
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
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-[10px] sm:text-xs text-muted-foreground py-2 text-center bg-muted/30 rounded-none">
                                            No courses added yet. Add your own below.
                                        </div>
                                    )}

                                    {/* Custom electives list - clickable to select */}
                                    {customElectives
                                        .filter((e) => e.groupType === type)
                                        .map((custom) => {
                                            const isSelected = selections[type] === custom.id;
                                            return (
                                                <div
                                                    key={custom.id}
                                                    onClick={() => handleSelectionChange(type, custom.id)}
                                                    className={`flex items-center justify-between gap-2 text-xs px-2 py-1.5 cursor-pointer transition-colors ${
                                                        isSelected
                                                            ? "bg-primary/10 border border-primary/20"
                                                            : "bg-muted/50 hover:bg-muted/80"
                                                    }`}
                                                >
                                                    <span className="truncate flex-1">
                                                        {custom.abbreviation} - {custom.name}
                                                    </span>
                                                    <div className="flex gap-1 flex-shrink-0">
                                                        {isSelected && (
                                                            <CheckIcon className="size-3 text-primary" />
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditCustom(custom);
                                                            }}
                                                        >
                                                            <PencilSimpleIcon className="size-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onRemoveCustom(custom.id);
                                                            }}
                                                        >
                                                            <TrashIcon className="size-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}

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
                                            {type} not listed? Add it manually
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
                        {step === "electives" && !isEditing && (
                            <Button variant="outline" size="sm" onClick={() => setStep("start")}>
                                Back
                            </Button>
                        )}
                        {step === "oe" && (
                            <Button variant="outline" size="sm" onClick={() => setStep("electives")}>
                                Back
                            </Button>
                        )}
                        {step === "electives" && !isEditing ? (
                            <Button size="sm" onClick={() => setStep("oe")}>
                                Continue
                            </Button>
                        ) : step === "start" ? null : (
                            <AlertDialogAction onClick={handleSave} size="sm">
                                {isEditing ? "Save Changes" : "Done"}
                            </AlertDialogAction>
                        )}
                    </AlertDialogFooter>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
