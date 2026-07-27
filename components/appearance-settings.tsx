"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
function TemplatePreview({
    template,
    isDark,
}: {
    template: ThemeTemplate;
    isDark: boolean;
}) {
    const bg = isDark ? template.darkBg : template.lightBg;
    const base = hexToOklch(bg);
    // Same elevation the real palette gives cards, so the preview shows how much
    // separation the theme actually has.
    const surface = base
        ? oklchToHex({ ...base, l: base.l + (isDark ? 0.09 : -0.06) })
        : bg;

    return (
        <div
            className="flex h-8 w-full items-center gap-1 border border-border/60 p-1"
            style={{ backgroundColor: bg }}
        >
            <div className="h-full w-1/2" style={{ backgroundColor: surface }} />
            <div className="h-full w-3" style={{ backgroundColor: template.accent }} />
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
        <div className="flex flex-wrap items-center gap-1.5">
            {colors.map((color) => (
                <button
                    key={color}
                    type="button"
                    aria-label={`${label} ${color}`}
                    aria-pressed={active === color.toLowerCase()}
                    onClick={() => onSelect(color)}
                    style={{ backgroundColor: color }}
                    className={cn(
                        "size-6 border transition-all",
                        active === color.toLowerCase()
                            ? "border-foreground ring-1 ring-foreground ring-offset-2 ring-offset-background"
                            : "border-border hover:border-foreground/40"
                    )}
                />
            ))}

            {/* Native picker for anything not in the row. */}
            <label
                className="relative size-6 shrink-0 cursor-pointer overflow-hidden border border-dashed border-border hover:border-foreground/40"
                title={`Custom ${label.toLowerCase()}`}
            >
                <span
                    className="absolute inset-0"
                    style={{
                        background:
                            "conic-gradient(#f54900,#eab308,#22c55e,#0ea5e9,#8b5cf6,#f43f5e,#f54900)",
                    }}
                />
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onSelect(e.target.value)}
                    aria-label={`Custom ${label.toLowerCase()}`}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                />
            </label>

            <span className="font-mono text-[10px] uppercase text-muted-foreground">
                {active}
            </span>
        </div>
    );
}

export function AppearanceSettings() {
    const { theme, settings, setMode, setAccent, setBackground, applyTemplate, resetTheme } =
        useTheme();

    const isDark = theme === "dark";
    const background = isDark ? settings.darkBg : settings.lightBg;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Mode</Label>
                <div className="flex items-center gap-1 bg-muted/30 p-0.5">
                    <Button
                        variant={isDark ? "ghost" : "default"}
                        size="xs"
                        onClick={() => setMode("light")}
                        className="gap-1"
                    >
                        <SunIcon className="size-3" />
                        Light
                    </Button>
                    <Button
                        variant={isDark ? "default" : "ghost"}
                        size="xs"
                        onClick={() => setMode("dark")}
                        className="gap-1"
                    >
                        <MoonIcon className="size-3" />
                        Dark
                    </Button>
                </div>
            </div>

            <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground">
                    Templates set the accent and both backgrounds at once.
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                    {THEME_TEMPLATES.map((template) => (
                        <button
                            key={template.id}
                            type="button"
                            onClick={() => applyTemplate(template.id)}
                            title={template.description}
                            aria-pressed={settings.templateId === template.id}
                            className={cn(
                                "space-y-1 border p-1.5 text-left transition-colors",
                                settings.templateId === template.id
                                    ? "border-primary bg-muted/40"
                                    : "border-border hover:bg-muted/30"
                            )}
                        >
                            <TemplatePreview template={template} isDark={isDark} />
                            <span className="block text-[10px] font-medium">
                                {template.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground">Accent</Label>
                <SwatchRow
                    colors={ACCENT_PRESETS}
                    value={settings.accent}
                    onSelect={setAccent}
                    label="Accent"
                />
            </div>

            <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground">
                    Background ({isDark ? "dark" : "light"} mode)
                </Label>
                <SwatchRow
                    colors={BACKGROUND_PRESETS[theme]}
                    value={background}
                    onSelect={setBackground}
                    label="Background"
                />
                <p className="text-[10px] text-muted-foreground">
                    Cards, borders and text are derived from this, so each mode keeps
                    its own background.
                </p>
            </div>

            <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={resetTheme}
            >
                <ArrowCounterClockwiseIcon className="size-4 mr-2" />
                Reset Appearance
            </Button>
        </div>
    );
}
