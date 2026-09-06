"use client";

import { classNames } from "@/ui.stylex";

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
    <div className={classNames.appearanceSettings264}>
      <div className={classNames.tileDisplaySettings281}>
        <div className={classNames.dayView222}>
          <Label className={classNames.home16}>Tile label</Label>
          <p className={classNames.setupModal60}>
            {tileLabel === "code"
              ? "Tiles show the course code — e.g. ICT 4403"
              : "Tiles show the abbreviation — e.g. HCI [G]"}
          </p>
        </div>
        <div className={classNames.tileDisplaySettings282}>
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

      <div className={classNames.tileDisplaySettings281}>
        <div className={classNames.dayView222}>
          <Label htmlFor="show-room" className={classNames.home16}>
            Show room on tiles
          </Label>
          <p className={classNames.setupModal60}>
            Adds the room beside the course in day and week view — e.g. HCI [G] | AB5-311
          </p>
        </div>
        <Switch
          id="show-room"
          checked={showRoom}
          onCheckedChange={onShowRoomChange}
          className={classNames.tileDisplaySettings283}
        />
      </div>
    </div>
  );
}
