"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
    buildThemeCss,
    DEFAULT_THEME,
    normalizeTheme,
    THEME_TEMPLATES,
    ThemeMode,
    ThemeSettings,
} from "@/lib/theme";

export const MODE_KEY = "theme";
export const THEME_KEY = "timetable-theme";
/**
 * The derived custom properties, cached verbatim so the pre-paint script in the
 * document head can apply them without re-running the palette maths.
 */
export const THEME_VARS_KEY = "timetable-theme-vars";

interface ThemeContextValue {
    theme: ThemeMode;
    settings: ThemeSettings;
    toggleTheme: () => void;
    setMode: (mode: ThemeMode) => void;
    /** Set the accent, or the background for the mode currently on screen. */
    setAccent: (hex: string) => void;
    setBackground: (hex: string) => void;
    applyTemplate: (templateId: string) => void;
    resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function paint(settings: ThemeSettings, mode: ThemeMode) {
    const css = buildThemeCss(settings, mode);
    document.documentElement.style.cssText = css;
    document.documentElement.classList.toggle("dark", mode === "dark");
    localStorage.setItem(THEME_VARS_KEY, css);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Both default to the shipped values so the server render and the first
    // client render agree; the stored values land in the effect below, after
    // the head script has already painted them.
    const [theme, setTheme] = useState<ThemeMode>("dark");
    const [settings, setSettings] = useState<ThemeSettings>(DEFAULT_THEME);

    // Mirrors of the state above. Every setter derives the next theme from the
    // current one, and two changes inside a single tick — clicking a template
    // and a mode in quick succession — would otherwise both read the same stale
    // render's values and the second would undo the first.
    const settingsRef = useRef(settings);
    const modeRef = useRef(theme);

    const commit = useCallback((next: ThemeSettings, mode: ThemeMode) => {
        settingsRef.current = next;
        modeRef.current = mode;
        setSettings(next);
        setTheme(mode);
        localStorage.setItem(THEME_KEY, JSON.stringify(next));
        localStorage.setItem(MODE_KEY, mode);
        paint(next, mode);
    }, []);

    useEffect(() => {
        const storedMode = localStorage.getItem(MODE_KEY);
        const mode: ThemeMode = storedMode === "light" ? "light" : "dark";

        let stored = DEFAULT_THEME;
        try {
            const raw = localStorage.getItem(THEME_KEY);
            if (raw) stored = normalizeTheme(JSON.parse(raw));
        } catch {
            console.error("Failed to parse saved theme");
        }

        commit(stored, mode);
    }, [commit]);

    const setMode = useCallback(
        (mode: ThemeMode) => commit(settingsRef.current, mode),
        [commit]
    );

    const toggleTheme = useCallback(
        () => commit(settingsRef.current, modeRef.current === "dark" ? "light" : "dark"),
        [commit]
    );

    // Any hand-picked colour detaches the theme from its template, so the
    // template list stops claiming a preset is still active.
    const setAccent = useCallback(
        (hex: string) =>
            commit(
                { ...settingsRef.current, templateId: null, accent: hex },
                modeRef.current
            ),
        [commit]
    );

    const setBackground = useCallback(
        (hex: string) =>
            commit(
                {
                    ...settingsRef.current,
                    templateId: null,
                    ...(modeRef.current === "dark" ? { darkBg: hex } : { lightBg: hex }),
                },
                modeRef.current
            ),
        [commit]
    );

    const applyTemplate = useCallback(
        (templateId: string) => {
            const template = THEME_TEMPLATES.find((t) => t.id === templateId);
            if (!template) return;
            commit(
                {
                    templateId: template.id,
                    accent: template.accent,
                    lightBg: template.lightBg,
                    darkBg: template.darkBg,
                },
                modeRef.current
            );
        },
        [commit]
    );

    const resetTheme = useCallback(
        () => commit(DEFAULT_THEME, modeRef.current),
        [commit]
    );

    return (
        <ThemeContext.Provider
            value={{
                theme,
                settings,
                toggleTheme,
                setMode,
                setAccent,
                setBackground,
                applyTemplate,
                resetTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
}
