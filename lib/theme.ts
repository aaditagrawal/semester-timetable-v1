/**
 * Palette derivation for user-editable theming.
 *
 * The user picks two things — an accent and a background — and everything else
 * (surfaces, text, borders, charts) is derived from them in OKLCH so a custom
 * colour can never produce unreadable text or a flat, contrast-free surface
 * stack. The offsets below are lifted from the hand-tuned tokens that used to
 * live in globals.css, so the default template reproduces the original look
 * exactly.
 */

export interface Oklch {
  l: number;
  c: number;
  h: number;
}

export type ThemeMode = "light" | "dark";

export interface ThemeSettings {
  /** id of the template this came from, or null once the user edits a colour. */
  templateId: string | null;
  accent: string;
  lightBg: string;
  darkBg: string;
}

export interface ThemeTemplate {
  id: string;
  name: string;
  description: string;
  accent: string;
  lightBg: string;
  darkBg: string;
}

/* -------------------------------------------------------------------------- */
/* Colour conversion                                                          */
/* -------------------------------------------------------------------------- */

function srgbToLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

/** Parse `#rgb` / `#rrggbb` into 0..1 sRGB channels. Returns null if unparseable. */
function parseHex(hex: string): [number, number, number] | null {
  const raw = hex.trim().replace(/^#/, "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ];
}

/** Björn Ottosson's sRGB → OKLab transform, expressed in polar form. */
export function hexToOklch(hex: string): Oklch | null {
  const parsed = parseHex(hex);
  if (!parsed) return null;

  const [r, g, b] = parsed.map(srgbToLinear);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const okL = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const okA = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const okB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const c = Math.hypot(okA, okB);
  // Hue is meaningless for near-neutrals; pin it to 0 so greys stay grey.
  const h = c < 0.0004 ? 0 : ((Math.atan2(okB, okA) * 180) / Math.PI + 360) % 360;

  return { l: okL, c, h };
}

/** OKLCH → linear sRGB, clipped to gamut. */
function oklchToLinearRgb({ l: okL, c, h }: Oklch): [number, number, number] {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);

  const l_ = (okL + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (okL - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (okL - 0.0894841775 * a - 1.291485548 * b) ** 3;

  // Clipped channel by channel rather than through `.map`, which flattens the
  // triple back to `number[]` and then needs asserting into shape again.
  const toGamut = (channel: number) => Math.min(1, Math.max(0, channel));

  return [
    toGamut(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_),
    toGamut(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_),
    toGamut(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_),
  ];
}

/** WCAG relative luminance, used to decide whether text on a colour is light or dark. */
function relativeLuminance(color: Oklch): number {
  const [r, g, b] = oklchToLinearRgb(color);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** OKLCH → `#rrggbb`, for previewing a derived colour in a swatch. */
export function oklchToHex(color: Oklch): string {
  return (
    "#" +
    oklchToLinearRgb(color)
      .map((channel) => {
        const srgb =
          channel <= 0.0031308 ? channel * 12.92 : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
        return Math.round(srgb * 255)
          .toString(16)
          .padStart(2, "0");
      })
      .join("")
  );
}

/* -------------------------------------------------------------------------- */
/* Derivation                                                                 */
/* -------------------------------------------------------------------------- */

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const round = (n: number, places: number) => {
  const f = 10 ** places;
  return Math.round(n * f) / f;
};

function css({ l, c, h }: Oklch): string {
  return `oklch(${round(l, 3)} ${round(c, 4)} ${round(h, 2)})`;
}

/**
 * Surface elevation offsets in OKLCH lightness. Dark themes lift surfaces above
 * the background; light themes press them below it, and by much less — a light
 * UI reads as flat far more easily than a dark one.
 */
const SURFACES = {
  dark: { card: 0.05, muted: 0.11, secondary: 0.15, accent: 0.19 },
  light: { card: 0, muted: 0.03, secondary: 0.037, accent: 0.03 },
} as const;

const TEXT = {
  dark: { foreground: 0.95, muted: 0.65, ring: 0.6 },
  light: { foreground: 0.145, muted: 0.556, ring: 0.708 },
} as const;

/**
 * Keep the accent legible against the background it sits on. Dark mode lifts
 * the picked colour and takes a little saturation out of it — a colour tuned
 * against white is muddy against near-black.
 */
const ACCENT_RANGE = {
  dark: { bias: 0.1, chroma: 0.82, min: 0.6, max: 0.85 },
  light: { bias: 0, chroma: 1, min: 0.45, max: 0.74 },
} as const;

/**
 * Analogous ramp for the chart tokens, expressed as offsets from the accent so
 * the series always reads as a family of the user's colour.
 */
const CHART_RAMP = [
  { l: 0.837, c: 0.577, h: 25.17 },
  { l: 0.705, c: 0.959, h: 6.49 },
  { l: 0.646, c: 1, h: 0 },
  { l: 0.553, c: 0.878, h: -2.71 },
  { l: 0.47, c: 0.707, h: -3.81 },
] as const;

const DESTRUCTIVE = {
  dark: "oklch(0.704 0.191 22.216)",
  light: "oklch(0.58 0.22 27)",
} as const;

const FALLBACK_ACCENT: Oklch = { l: 0.646, c: 0.222, h: 41.116 };
const FALLBACK_BG = { dark: { l: 0.13, c: 0, h: 0 }, light: { l: 1, c: 0, h: 0 } };

/**
 * Build the custom-property block for one mode.
 *
 * Returned as a `cssText` string rather than an object because the pre-paint
 * script in the document head replays the exact same string — computing the
 * palette twice, once in JS and once inline, would be a second implementation
 * to keep in sync.
 */
export function buildThemeCss(settings: ThemeSettings, mode: ThemeMode): string {
  const isDark = mode === "dark";
  const key = isDark ? "dark" : "light";

  const bgHex = isDark ? settings.darkBg : settings.lightBg;
  const bg = hexToOklch(bgHex) ?? FALLBACK_BG[key];
  const rawAccent = hexToOklch(settings.accent) ?? FALLBACK_ACCENT;

  const surface = SURFACES[key];
  const text = TEXT[key];

  /** A surface `d` steps of lightness away from the background, keeping its tint. */
  const step = (d: number): Oklch => ({
    l: clamp(bg.l + (isDark ? d : -d), 0, 1),
    c: bg.c,
    h: bg.h,
  });

  // Text picks up a trace of the background's tint so a coloured theme reads
  // as one temperature rather than grey text floating on a colour.
  const tint = Math.min(bg.c * 0.35, 0.02);
  const foreground = css({ l: text.foreground, c: tint, h: bg.h });
  const mutedForeground = css({ l: text.muted, c: tint, h: bg.h });

  const range = ACCENT_RANGE[key];
  const primary: Oklch = {
    l: clamp(rawAccent.l + range.bias, range.min, range.max),
    c: rawAccent.c * range.chroma,
    h: rawAccent.h,
  };
  // 0.179 is the luminance at which black and white text contrast equally, so
  // this always picks the more readable of the two. Users can choose a pale
  // yellow accent; white text on it has to not happen.
  const primaryForeground =
    relativeLuminance(primary) > 0.179
      ? css({ l: 0.15, c: 0, h: 0 })
      : css({ l: 0.98, c: Math.min(primary.c * 0.08, 0.02), h: primary.h });

  // Dark themes get translucent white hairlines (they survive any surface
  // they land on); light themes get a solid line a fixed distance below the bg.
  const border = isDark ? "oklch(1 0 0 / 15%)" : css(step(0.078));
  const input = isDark ? "oklch(1 0 0 / 18%)" : css(step(0.078));

  const card = css(step(surface.card));
  const secondary = css(step(surface.secondary));
  const accentSurface = css(step(surface.accent));
  const ring = css({ l: text.ring, c: tint, h: bg.h });

  // A list of pairs rather than an object: the result is a `cssText` string, so
  // declaration order is the only thing the shape has to preserve, and this
  // does not need an index signature to append the chart ramp to.
  const vars: [name: string, value: string][] = [
    ["background", css(bg)],
    ["foreground", foreground],
    ["card", card],
    ["card-foreground", foreground],
    ["popover", card],
    ["popover-foreground", foreground],
    ["primary", css(primary)],
    ["primary-foreground", primaryForeground],
    ["secondary", secondary],
    ["secondary-foreground", foreground],
    ["muted", css(step(surface.muted))],
    ["muted-foreground", mutedForeground],
    ["accent", accentSurface],
    ["accent-foreground", foreground],
    ["destructive", DESTRUCTIVE[key]],
    ["border", border],
    ["input", input],
    ["ring", ring],
    ["sidebar", card],
    ["sidebar-foreground", foreground],
    ["sidebar-primary", css(primary)],
    ["sidebar-primary-foreground", primaryForeground],
    ["sidebar-accent", secondary],
    ["sidebar-accent-foreground", foreground],
    ["sidebar-border", border],
    ["sidebar-ring", ring],
  ];

  CHART_RAMP.forEach((stop, i) => {
    vars.push([
      `chart-${i + 1}`,
      css({
        l: stop.l,
        c: rawAccent.c * stop.c,
        h: rawAccent.h + stop.h,
      }),
    ]);
  });

  return vars.map(([name, value]) => `--${name}:${value}`).join(";");
}

/* -------------------------------------------------------------------------- */
/* Templates                                                                  */
/* -------------------------------------------------------------------------- */

export const THEME_TEMPLATES: ThemeTemplate[] = [
  {
    id: "ember",
    name: "Ember",
    description: "The original — warm orange on neutral",
    accent: "#f54900",
    lightBg: "#ffffff",
    darkBg: "#070707",
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Cool blue, cooler surfaces",
    accent: "#0ea5e9",
    lightBg: "#f9fcff",
    darkBg: "#050b0f",
  },
  {
    id: "forest",
    name: "Forest",
    description: "Green on a shaded neutral",
    accent: "#22c55e",
    lightBg: "#f9fdfa",
    darkBg: "#070c08",
  },
  {
    id: "violet",
    name: "Violet",
    description: "Purple with a matching cast",
    accent: "#8b5cf6",
    lightBg: "#fbfbff",
    darkBg: "#0b0a12",
  },
  {
    id: "rose",
    name: "Rose",
    description: "Pink-red, slightly warm",
    accent: "#f43f5e",
    lightBg: "#fffafa",
    darkBg: "#100808",
  },
  {
    id: "mono",
    name: "Mono",
    description: "No colour at all",
    accent: "#a1a1aa",
    lightBg: "#ffffff",
    darkBg: "#070707",
  },
  {
    id: "paper",
    name: "Paper",
    description: "Warm off-white and ink",
    accent: "#b45309",
    lightBg: "#faf6f1",
    darkBg: "#0d0b08",
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Deep navy with a bright blue",
    accent: "#60a5fa",
    lightBg: "#f8fafe",
    darkBg: "#070d19",
  },
];

export const DEFAULT_TEMPLATE = THEME_TEMPLATES[0];

export const DEFAULT_THEME: ThemeSettings = {
  templateId: DEFAULT_TEMPLATE.id,
  accent: DEFAULT_TEMPLATE.accent,
  lightBg: DEFAULT_TEMPLATE.lightBg,
  darkBg: DEFAULT_TEMPLATE.darkBg,
};

/** Accent presets offered next to the free-form colour input. */
export const ACCENT_PRESETS = [
  "#f54900",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#a1a1aa",
];

/** Background presets, per mode — neutral first, then a few tinted options. */
export const BACKGROUND_PRESETS = {
  light: ["#ffffff", "#f7f7f7", "#faf6f1", "#f8fafe", "#f9fdfa", "#fbfbff"],
  dark: ["#070707", "#000000", "#171717", "#050b0f", "#070c08", "#0b0a12"],
} satisfies Record<ThemeMode, string[]>;

/**
 * A theme as it comes back out of `localStorage`.
 *
 * The field names are the ones `ThemeProvider` wrote, but none of the values
 * have been checked: the entry is a string a user can edit, and a stale build
 * may have written a shape this version no longer recognises. Every field is
 * therefore optional, and `normalizeTheme` is the only thing allowed to turn
 * one of these into a `ThemeSettings`.
 */
export interface StoredTheme {
  templateId?: string;
  accent?: string;
  lightBg?: string;
  darkBg?: string;
}

/**
 * Decode a stored theme into settings the palette maths can rely on.
 *
 * A colour is kept only if `hexToOklch` can actually parse it, and a template
 * id only if a template by that name still ships — so a hand-edited entry, or
 * one naming a template that has since been removed, degrades to the default
 * rather than producing an unreadable palette.
 */
export function normalizeTheme(stored: StoredTheme | null): ThemeSettings {
  const hex = (value: string | undefined, fallback: string) =>
    value !== undefined && hexToOklch(value) !== null ? value : fallback;

  const templateId = stored?.templateId;

  return {
    templateId:
      templateId !== undefined && THEME_TEMPLATES.some((t) => t.id === templateId)
        ? templateId
        : null,
    accent: hex(stored?.accent, DEFAULT_THEME.accent),
    lightBg: hex(stored?.lightBg, DEFAULT_THEME.lightBg),
    darkBg: hex(stored?.darkBg, DEFAULT_THEME.darkBg),
  };
}
