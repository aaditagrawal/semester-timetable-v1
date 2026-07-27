"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TileLabelMode } from "@/lib/hooks/use-timetable";

interface TileDisplaySettingsProps {
    tileLabel: TileLabelMode;
    onTileLabelChange: (value: TileLabelMode) => void;
    showRoom: boolean;
    onShowRoomChange: (value: boolean) => void;
}

/**
 * How course tiles are labelled. Shared between Settings and Appearance so the
 * same controls live in both windows.
 */
export function TileDisplaySettings({
    tileLabel,
    onTileLabelChange,
    showRoom,
    onShowRoomChange,
}: TileDisplaySettingsProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                    <Label className="text-xs">Tile label</Label>
                    <p className="text-[10px] text-muted-foreground">
                        {tileLabel === "code"
                            ? "Tiles show the course code — e.g. ICT 4403"
                            : "Tiles show the abbreviation — e.g. HCI [G]"}
                    </p>
                </div>
                <div className="flex items-center gap-1 bg-muted/30 p-0.5 shrink-0">
                    <Button
                        variant={tileLabel === "abbreviation" ? "default" : "ghost"}
                        size="xs"
                        onClick={() => onTileLabelChange("abbreviation")}
                    >
                        Abbreviation
                    </Button>
                    <Button
                        variant={tileLabel === "code" ? "default" : "ghost"}
                        size="xs"
                        onClick={() => onTileLabelChange("code")}
                    >
                        Code
                    </Button>
                </div>
            </div>

            <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                    <Label htmlFor="show-room" className="text-xs">
                        Show room on tiles
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                        Adds the room beside the course in day and week view — e.g. HCI [G] | AB5-311
                    </p>
                </div>
                <Switch
                    id="show-room"
                    checked={showRoom}
                    onCheckedChange={onShowRoomChange}
                    className="mt-0.5 shrink-0"
                />
            </div>
        </div>
    );
}
