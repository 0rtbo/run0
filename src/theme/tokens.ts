const space = {
  0: 0,
  2: 2,
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  40: 40,
} as const;

const radius = {
  0: 0,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  full: 999,
} as const;

const foundations = {
  space,
  radius,
} as const;

type ThemeColors = {
  background: string;
  foreground: string;
  surface: string;
  surfaceForeground: string;
  overlay: string;
  overlayForeground: string;
  accent: string;
  accentForeground: string;
  accentSoft: string;
  accentSoftForeground: string;
  default: string;
  defaultForeground: string;
  muted: string;
  border: string;
  separator: string;
  focus: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  danger: string;
  dangerForeground: string;
  dangerSoft: string;
  mapBg: string;
  mapBg3D: string;
  building: string;
  fogColor: string;
  fogHigh: string;
  fogSpace: string;
  transparent: string;
};

const createTheme = (colors: ThemeColors) => ({
  ...foundations,
  colors,
});

export const darkTheme = createTheme({
  background: "#0a0a0a",
  foreground: "#ffffff",
  surface: "#1a1a1a",
  surfaceForeground: "#ffffff",
  overlay: "rgba(10,10,10,0.88)",
  overlayForeground: "#ffffff",
  accent: "#FF375F",
  accentForeground: "#ffffff",
  accentSoft: "rgba(255,55,95,0.15)",
  accentSoftForeground: "#FF375F",
  default: "rgba(255,255,255,0.08)",
  defaultForeground: "rgba(255,255,255,0.7)",
  muted: "rgba(255,255,255,0.5)",
  border: "rgba(255,255,255,0.06)",
  separator: "rgba(255,255,255,0.08)",
  focus: "#FF375F",
  success: "#34C759",
  successForeground: "#ffffff",
  warning: "#FFD60A",
  warningForeground: "#000000",
  danger: "#FF453A",
  dangerForeground: "#ffffff",
  dangerSoft: "rgba(255,69,58,0.15)",
  mapBg: "#0a0a0a",
  mapBg3D: "#dbe7cf",
  building: "#d6d3d1",
  fogColor: "#0a0a0a",
  fogHigh: "#111111",
  fogSpace: "#000000",
  transparent: "transparent",
});

export const lightTheme = createTheme({
  background: "#f8f8fa",
  foreground: "#1a1a1a",
  surface: "#ffffff",
  surfaceForeground: "#1a1a1a",
  overlay: "rgba(255,255,255,0.92)",
  overlayForeground: "#1a1a1a",
  accent: "#FF375F",
  accentForeground: "#ffffff",
  accentSoft: "rgba(255,55,95,0.08)",
  accentSoftForeground: "#E02050",
  default: "rgba(0,0,0,0.04)",
  defaultForeground: "rgba(0,0,0,0.6)",
  muted: "rgba(0,0,0,0.45)",
  border: "rgba(0,0,0,0.06)",
  separator: "rgba(0,0,0,0.08)",
  focus: "#FF375F",
  success: "#34C759",
  successForeground: "#ffffff",
  warning: "#FF9500",
  warningForeground: "#ffffff",
  danger: "#FF3B30",
  dangerForeground: "#ffffff",
  dangerSoft: "rgba(255,59,48,0.08)",
  mapBg: "#f8f8fa",
  mapBg3D: "#dbe7cf",
  building: "#d6d3d1",
  fogColor: "#f8f8fa",
  fogHigh: "#e0e0e0",
  fogSpace: "#d0d0d0",
  transparent: "transparent",
});

export const emberTheme = createTheme({
  background: "#FBF6F0",
  foreground: "#3D2C1E",
  surface: "#FFFFFF",
  surfaceForeground: "#3D2C1E",
  overlay: "rgba(61,44,30,0.85)",
  overlayForeground: "#FBF6F0",
  accent: "#E8622B",
  accentForeground: "#FFFFFF",
  accentSoft: "rgba(232,98,43,0.12)",
  accentSoftForeground: "#C4521F",
  default: "#F0E6D8",
  defaultForeground: "#6B5744",
  muted: "#8B7355",
  border: "rgba(61,44,30,0.06)",
  separator: "#E2D5C3",
  focus: "#E8622B",
  success: "#5E8C3A",
  successForeground: "#FFFFFF",
  warning: "#D4930D",
  warningForeground: "#3D2C1E",
  danger: "#C0392B",
  dangerForeground: "#FFFFFF",
  dangerSoft: "rgba(192,57,43,0.1)",
  mapBg: "#FBF6F0",
  mapBg3D: "#dbe7cf",
  building: "#d6d3d1",
  fogColor: "#FBF6F0",
  fogHigh: "#E8DED0",
  fogSpace: "#D4C8B8",
  transparent: "transparent",
});

export const bloomTheme = createTheme({
  background: "#FFFBF5",
  foreground: "#2D1B4E",
  surface: "#F8F4FF",
  surfaceForeground: "#2D1B4E",
  overlay: "rgba(45,27,78,0.85)",
  overlayForeground: "#FFFBF5",
  accent: "#8B5CF6",
  accentForeground: "#FFFFFF",
  accentSoft: "rgba(139,92,246,0.1)",
  accentSoftForeground: "#7C3AED",
  default: "#F0EBF8",
  defaultForeground: "#5B4A7A",
  muted: "#7C6B99",
  border: "rgba(45,27,78,0.06)",
  separator: "#E5DDF0",
  focus: "#8B5CF6",
  success: "#10B981",
  successForeground: "#FFFFFF",
  warning: "#F59E0B",
  warningForeground: "#2D1B4E",
  danger: "#EF4444",
  dangerForeground: "#FFFFFF",
  dangerSoft: "rgba(239,68,68,0.1)",
  mapBg: "#FFFBF5",
  mapBg3D: "#dbe7cf",
  building: "#d6d3d1",
  fogColor: "#FFFBF5",
  fogHigh: "#EDE5F5",
  fogSpace: "#DAD0E8",
  transparent: "transparent",
});

export const oceanTheme = createTheme({
  background: "#0C1B2A",
  foreground: "#E8F1F8",
  surface: "#142840",
  surfaceForeground: "#E8F1F8",
  overlay: "rgba(12,27,42,0.92)",
  overlayForeground: "#E8F1F8",
  accent: "#FF6B6B",
  accentForeground: "#0C1B2A",
  accentSoft: "rgba(255,107,107,0.15)",
  accentSoftForeground: "#FF6B6B",
  default: "rgba(232,241,248,0.08)",
  defaultForeground: "rgba(232,241,248,0.6)",
  muted: "rgba(232,241,248,0.45)",
  border: "rgba(232,241,248,0.06)",
  separator: "rgba(232,241,248,0.1)",
  focus: "#FF6B6B",
  success: "#6EE7B7",
  successForeground: "#0C1B2A",
  warning: "#FCD34D",
  warningForeground: "#0C1B2A",
  danger: "#F87171",
  dangerForeground: "#0C1B2A",
  dangerSoft: "rgba(248,113,113,0.15)",
  mapBg: "#0C1B2A",
  mapBg3D: "#dbe7cf",
  building: "#d6d3d1",
  fogColor: "#0C1B2A",
  fogHigh: "#1A2F45",
  fogSpace: "#050E18",
  transparent: "transparent",
});

export type AppTheme = typeof darkTheme;
export type ColorKey = keyof AppTheme["colors"];
export type SpaceKey = keyof AppTheme["space"];
export type RadiusKey = keyof AppTheme["radius"];
