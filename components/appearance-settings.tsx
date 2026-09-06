"use client";

import { classNames } from "@/ui.stylex";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TileDisplaySettings } from "@/components/tile-display-settings";
import { TileLabelMode } from "@/lib/hooks/use-timetable";
import { useTheme } from "@/lib/theme-provider";
import {
  ACCENT_PRESETS,
  BACKGROUND_PRESETS,
  THEME_TEMPLATES,
  ThemeTemplate,
  hexToOklch,
  oklchToHex,
} from "@/lib/theme";
import { ArrowCounterClockwiseIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";

/**
 * A template's two colours shown as the app arranges them: a background pane
 * with a surface strip and an accent block sitting on it.
 */
function TemplatePreview({ template, isDark }: { template: ThemeTemplate; isDark: boolean }) {
  const bg = isDark ? template.darkBg : template.lightBg;
  const base = hexToOklch(bg);
  // Same elevation the real palette gives cards, so the preview shows how much
  // separation the theme actually has.
  const surface = base ? oklchToHex({ ...base, l: base.l + (isDark ? 0.09 : -0.06) }) : bg;

  return (
    <div className={classNames.appearanceSettings253} style={{ backgroundColor: bg }}>
      <div className={classNames.appearanceSettings254} style={{ backgroundColor: surface }} />
      <div
        className={classNames.appearanceSettings255}
        style={{ backgroundColor: template.accent }}
      />
    </div>
  );
}

function SwatchRow({
  colors,
  value,
  onSelect,
  label,
}: {
  colors: string[];
  value: string;
  onSelect: (hex: string) => void;
  label: string;
}) {
  const active = value.toLowerCase();

  return (
    <div className={classNames.appearanceSettings256}>
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`${label} ${color}`}
          aria-pressed={active === color.toLowerCase()}
          onClick={() => onSelect(color)}
          style={{ backgroundColor: color }}
          className={cn(
            classNames.appearanceSettings257,
            active === color.toLowerCase()
              ? classNames.appearanceSettings258
              : classNames.appearanceSettings259,
          )}
        />
      ))}

      {/* Native picker for anything not in the row. */}
      <label className={classNames.appearanceSettings260} title={`Custom ${label.toLowerCase()}`}>
        <span
          className={classNames.appearanceSettings261}
          style={{
            background: "conic-gradient(#f54900,#eab308,#22c55e,#0ea5e9,#8b5cf6,#f43f5e,#f54900)",
          }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onSelect(e.target.value)}
          aria-label={`Custom ${label.toLowerCase()}`}
          className={classNames.appearanceSettings262}
        />
      </label>

      <span className={classNames.appearanceSettings263}>{active}</span>
    </div>
  );
}

interface AppearanceSettingsProps {
  tileLabel: TileLabelMode;
  onTileLabelChange: (value: TileLabelMode) => void;
  showRoom: boolean;
  onShowRoomChange: (value: boolean) => void;
}

export function AppearanceSettings({
  tileLabel,
  onTileLabelChange,
  showRoom,
  onShowRoomChange,
}: AppearanceSettingsProps) {
  const { theme, settings, setMode, setAccent, setBackground, applyTemplate, resetTheme } =
    useTheme();

  const isDark = theme === "dark";
  const background = isDark ? settings.darkBg : settings.lightBg;

  return (
    <div className={classNames.appearanceSettings264}>
      <div className={classNames.setupModal51}>
        <Label className={classNames.home16}>Mode</Label>
        <div className={classNames.appearanceSettings265}>
          <Button
            variant={isDark ? "ghost" : "default"}
            size="xs"
            onClick={() => setMode("light")}
            className={classNames.dayView204}
          >
            <SunIcon className={classNames.setupModal75} />
            Light
          </Button>
          <Button
            variant={isDark ? "default" : "ghost"}
            size="xs"
            onClick={() => setMode("dark")}
            className={classNames.dayView204}
          >
            <MoonIcon className={classNames.setupModal75} />
            Dark
          </Button>
        </div>
      </div>

      <div className={classNames.appearanceSettings266}>
        <p className={classNames.setupModal60}>
          Templates set the accent and both backgrounds at once.
        </p>
        <div className={classNames.appearanceSettings267}>
          {THEME_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => applyTemplate(template.id)}
              title={template.description}
              aria-pressed={settings.templateId === template.id}
              className={cn(
                classNames.appearanceSettings268,
                settings.templateId === template.id
                  ? classNames.appearanceSettings269
                  : classNames.appearanceSettings270,
              )}
            >
              <TemplatePreview template={template} isDark={isDark} />
              <span className={classNames.appearanceSettings271}>{template.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={classNames.appearanceSettings266}>
        <Label className={classNames.setupModal60}>Accent</Label>
        <SwatchRow
          colors={ACCENT_PRESETS}
          value={settings.accent}
          onSelect={setAccent}
          label="Accent"
        />
      </div>

      <div className={classNames.appearanceSettings266}>
        <Label className={classNames.setupModal60}>
          Background ({isDark ? "dark" : "light"} mode)
        </Label>
        <SwatchRow
          colors={BACKGROUND_PRESETS[theme]}
          value={background}
          onSelect={setBackground}
          label="Background"
        />
        <p className={classNames.setupModal60}>
          Cards, borders and text are derived from this, so each mode keeps its own background.
        </p>
      </div>

      <Separator />

      <TileDisplaySettings
        tileLabel={tileLabel}
        onTileLabelChange={onTileLabelChange}
        showRoom={showRoom}
        onShowRoomChange={onShowRoomChange}
      />

      <Separator />

      {/* Resets the theme only — tile display prefs belong to the timetable
                settings and are cleared by "Reset All Settings" instead. */}
      <Button variant="outline" size="sm" className={classNames.setupModal79} onClick={resetTheme}>
        <ArrowCounterClockwiseIcon className={classNames.home27} />
        Reset Appearance
      </Button>
    </div>
  );
}
