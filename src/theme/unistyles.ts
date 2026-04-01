import { StyleSheet } from "react-native-unistyles";
import {
  darkTheme,
  lightTheme,
  emberTheme,
  bloomTheme,
  oceanTheme,
} from "./tokens";

// ── Type augmentation ───────────────────────────────────────────────
// Per docs: https://reactnativeunistyles.vercel.app/v3/start/configuration/

type AppThemes = {
  dark: typeof darkTheme;
  light: typeof lightTheme;
  ember: typeof emberTheme;
  bloom: typeof bloomTheme;
  ocean: typeof oceanTheme;
};

declare module "react-native-unistyles" {
  export interface UnistylesThemes extends AppThemes {}
}

// ── Configure ───────────────────────────────────────────────────────
// Per docs: https://reactnativeunistyles.vercel.app/v3/guides/theming/
//
// "dark" and "light" are reserved names — Unistyles automatically
// follows the device color scheme when adaptiveThemes is enabled.
//
// The other themes are selected manually:
//   import { UnistylesRuntime } from "react-native-unistyles"
//   UnistylesRuntime.setAdaptiveThemes(false)
//   UnistylesRuntime.setTheme("ember")

StyleSheet.configure({
  themes: {
    dark: darkTheme,
    light: lightTheme,
    ember: emberTheme,
    bloom: bloomTheme,
    ocean: oceanTheme,
  },
  settings: {
    adaptiveThemes: true,
  },
});
