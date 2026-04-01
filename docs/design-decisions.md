# Design Decisions

A review of every choice made in the run0 design system, why it was made, and what was rejected.

## Decision 1: Theme = colors only

**What we did:** The theme object contains color slots and nothing else. No spacing tokens, no radii tokens, no typography tokens.

**Why:** Spacing doesn't change when you switch themes. Nobody goes from "ember" to "ocean" and expects padding to grow. Radii are the same story. Typography too. Putting these in the theme creates a false dependency — it implies they're part of theming when they're actually part of component design.

The systems that put spacing in the theme (Tailwind, Chakra, Tamagui) do it because they need a shared language between a config file and utility classes or style props. That makes sense on web. On React Native, we're already writing styles in TypeScript objects. The shared language is just... numbers.

**What we rejected:**
- Tailwind-style named tokens (`sm`, `md`, `lg`, `xl`). You have to memorize what each maps to. `p="lg"` means nothing without checking the definition. And you inevitably need a value between two steps.
- Numeric scale (1-9). Same problem in a different costume. `p={5}` meaning 24px is just as arbitrary as `p="xl"` meaning 24px. The non-linear curve adds a second thing to memorize.
- Base-unit multiplier (`n * 4`). Better than the above — the math is learnable. But it still forces every value onto a grid via the API, and the numbers get large for big spacing (`p={16}` for 64px looks weird).

**What we chose:** Raw pixel numbers. `p={16}` means 16 pixels. No translation layer. Follow a 4px grid by convention, not by API constraint. If you need 14px for optical alignment, just write 14.

**The tradeoff:** No enforcement of consistency. Two developers might use `p={16}` in one place and `p={18}` in another. In practice this hasn't been a problem for teams under ~5 people, and for larger teams a lint rule (`padding must be divisible by 4`) is simpler than a token system.

**Reference:** This is how SwiftUI works. `.padding(16)` is a raw number. Apple's own design system doesn't have a global spacing scale — components have sensible defaults and you override with explicit values when needed.

## Decision 2: HeroUI-style semantic color slots

**What we did:** Colors are named by what they do (`background`, `accent`, `muted`), not what they look like (`gray-900`, `pink-500`). Every background slot has a paired `Foreground` slot for text that sits on it.

**Why:** The pairing rule is the key insight. If you use `accentForeground` on an `accent` background, contrast works in every theme — dark, light, ember, ocean. You don't have to think about it. The theme author handles contrast once when defining the theme, and every consumer gets it for free.

**What we rejected:**
- Radix-style numeric scales (`gray.1` through `gray.12`). Principled and granular, but verbose for a mobile app. You end up writing `theme.colors.gray[11]` and nobody can remember what step 11 is for without the docs open. The 12-step scale is designed for complex web design systems with dozens of surface levels. A mobile running app has 3-4 surface levels.
- Ad-hoc names (`PINK`, `BG`, `CARD`, `DIM`). What we started with. These break the moment you add a second theme because `PINK` is meaningless in a purple theme and `WHITE` is meaningless in a dark-on-cream theme.
- Fully custom names. Possible, but every new developer has to learn your vocabulary from scratch. Following HeroUI's convention means anyone who has used HeroUI, shadcn, or similar systems recognizes the pattern immediately.

**What we chose:** HeroUI's slot convention adapted for Unistyles. `background`/`foreground`, `surface`/`surfaceForeground`, `accent`/`accentForeground`, `muted`, `default`, `border`, `separator`, plus status colors. 30 color keys total.

**The pairing rule in practice:**

```
background  ←→  foreground          (app canvas)
surface     ←→  surfaceForeground   (cards)
overlay     ←→  overlayForeground   (sheets)
accent      ←→  accentForeground    (buttons)
accentSoft  ←→  accentSoftForeground (tags)
default     ←→  defaultForeground   (neutral controls)
```

`muted` is standalone — it's a text color for secondary content, not a background.

## Decision 3: Themes with personality

**What we did:** Five themes where three of them (ember, bloom, ocean) have strong color identities. Not just "dark blue" and "light blue" — actual palettes with warm browns, lavender tints, coral on navy.

**Why:** Most theming systems ship with dark and light and call it done. The themes are technically correct but emotionally flat. This works for enterprise tools. It doesn't work for consumer apps where the theme IS a feature — people choose themes because they like how they feel.

The test for a good theme: can you describe it without using color names? "Craft coffee and golden hour" (ember). "Wildflower fields at twilight" (bloom). "Sunset on deep water" (ocean). If a theme has a mood, people connect with it.

**Design rules we followed:**
- Status colors belong to the palette. Ember's danger is brick red (`#C0392B`), not neon red. Its success is olive green (`#5E8C3A`), not electric green. The status colors feel like they grew from the same soil as the accent.
- `muted` and `separator` need to work against both `background` and `surface`. These are the two surfaces that secondary text sits on, and the color must be legible on both.
- Overlays should match the theme's temperature. Ember's overlay is warm-tinted (`rgba(61,44,30,0.85)`), not neutral gray.

**What we rejected:**
- A "midnight" theme (deep indigo + purple accent). We had this initially. Replaced it with bloom (purple on warm cream) because two dark themes (dark + midnight) didn't add enough variety. Bloom is more distinctive.
- Generic light/dark only. Technically sufficient but misses the point. The system is built for expressive themes — if we only shipped two, we'd be proving the system can do the bare minimum.

## Decision 4: Typography as variants, not tokens

**What we did:** The `Text` component has named variants (`heading`, `title`, `body`, `caption`, `label`, `stat`, `mono`). Each is a designed combination of font size, weight, letter spacing, and font features.

**Why:** Nobody thinks about typography as independent axes. You don't decide "I need size 17 and weight 600 and letter spacing 0" — you decide "this is a title." The variant encapsulates that decision.

This also prevents the combinatorial explosion problem. If you expose size, weight, and tracking as separate props, you get `7 sizes * 5 weights * 3 tracking options = 105 possible combinations`, most of which look bad. Variants constrain you to the 7 combinations that were actually designed.

**What we rejected:**
- A type scale with size tokens (`text-sm`, `text-base`, `text-lg`). Same problem as spacing tokens — arbitrary names for arbitrary values. And it only covers size, not the weight/tracking combination that makes a heading look like a heading.
- Fully open props (`size={17} weight="600"`). Maximum flexibility, zero design guidance. Every developer makes different choices and the app looks inconsistent.

**What we kept open:** The `style` prop. If a variant is close but not exactly right, you can override individual properties. `<Text variant="title" style={{ fontSize: 20 }}>` — use the variant's weight and tracking but bump the size. Escape hatch, not the default path.

## Decision 5: Unistyles over NativeWind/Uniwind

**What we did:** Used `react-native-unistyles` v3 for the styling engine.

**Why:**
- Themes are JavaScript objects, not CSS variables. This works naturally with React Native's style system and TypeScript.
- `StyleSheet.create((theme) => ...)` gives you theme access in every stylesheet with zero re-renders. The C++ JSI layer recalculates styles when the theme changes without triggering React re-renders.
- Per-component colocation. The stylesheet lives right below the component. No separate CSS file, no global stylesheet to maintain.
- Adaptive themes built in. Name your themes `dark` and `light`, flip `adaptiveThemes: true`, and the device color scheme is handled.

**What we rejected:**
- NativeWind/Tailwind CSS. Utility classes don't compose well in React Native. `className="bg-surface p-4 rounded-lg"` is a string — no TypeScript checking on individual values, no autocomplete on theme colors, and the Tailwind compilation step adds build complexity.
- Uniwind. Works well but couples you to CSS-variable theming. Unistyles keeps themes as plain objects, which is simpler to reason about and debug.
- Plain StyleSheet. React Native's built-in `StyleSheet.create` has no theme support. You'd need a context provider and hooks for every component, which means re-renders on every theme change.

## Decision 6: Composition primitives (Box, Stack, Text, Card)

**What we did:** A small set of primitive components that handle the most common layout patterns via props.

**Why:** 80% of layout code is the same patterns repeated: a padded container, a row with a gap, a card with rounded corners, a text element with a specific style. Primitives turn these into one-liners:

```tsx
// Without primitives
<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>

// With primitives
<HStack gap={8}>
```

The JSX becomes self-documenting. `<HStack gap={8}>` tells you the layout intent instantly. `<View style={styles.row}>` forces you to look up what `styles.row` contains.

**What we kept limited:** The props are intentionally few. Box has ~12 props. This covers 90% of use cases. The remaining 10% use the `style` prop directly — there's no attempt to wrap every CSS property in a shorthand prop.

**What we rejected:**
- A fully prop-driven system like Tamagui/Dripsy where every style property is a prop (`borderWidth={1} borderColor="border" opacity={0.5}`). This creates a huge API surface, complex TypeScript types, and performance overhead from prop-to-style mapping. The few most-used properties (padding, gap, bg, radius) as props is the sweet spot.
- No primitives at all (just StyleSheet everywhere). Works, but leads to verbose JSX and duplicated style patterns across screens.

## Decision 7: Expo Router entry point

**What we did:** Created `index.ts` at the project root that imports `src/theme/unistyles` before `expo-router/entry`, following the [Unistyles Expo Router guide](https://reactnativeunistyles.vercel.app/v3/guides/expo-router/).

**Why:** Unistyles v3 parses `StyleSheet.create` calls at import time via its Babel plugin. If a screen component is imported (by Expo Router resolving routes) before `StyleSheet.configure` runs, the styles won't have theme access. The entry point ordering ensures configuration happens first.

## What's missing (known gaps)

- **No animation tokens.** Spring configs, durations, and easing curves aren't in the system. They could be — a shared `motion` object with presets like `spring.snappy` or `duration.slow`. Not needed yet.
- **No elevation/shadow system.** Shadows differ between iOS and Android and are hard to theme. Cards currently rely on background color contrast rather than shadows. If shadows are needed later, they'd be platform-specific presets, not theme tokens.
- **No breakpoints.** Unistyles supports breakpoints for responsive design. We haven't needed them because the app targets phone-sized screens only. If tablet support is added, breakpoints would go in the Unistyles configuration (not the theme).
- **Map styles don't switch per theme.** The Mapbox style URLs (`dark-v11`, `outdoors-v12`) are hardcoded. A full theme integration would switch between light/dark Mapbox styles based on the active theme. This requires conditional logic in the map components, not just color tokens.

## Links

- [HeroUI Native Colors](https://heroui.com/docs/native/getting-started/colors) — the color slot convention we follow
- [Unistyles v3 Configuration](https://reactnativeunistyles.vercel.app/v3/start/configuration/) — theme registration
- [Unistyles v3 Theming Guide](https://reactnativeunistyles.vercel.app/v3/guides/theming/) — adaptive themes, runtime switching
- [Unistyles v3 Expo Router Guide](https://reactnativeunistyles.vercel.app/v3/guides/expo-router/) — entry point setup
- [Unistyles v3 StyleSheet Reference](https://reactnativeunistyles.vercel.app/v3/references/stylesheet/) — theme-aware stylesheets
