# Theme System

How to think about, use, and extend the run0 design system.

## The core idea

**Theme = colors only.** Spacing, radii, and typography don't change between themes. Nobody switches from "ember" to "ocean" and expects the padding to change. So the theme holds color slots and nothing else.

**Spacing and radii are raw pixel numbers.** `p={16}` means 16 pixels. No scale to memorize, no lookup table, no token names. You write the number and every developer on earth knows what it means.

**Typography is variant-based.** You don't think "font size step 3, weight step 2." You think "this is a title" or "this is a caption." The variant IS the abstraction.

## Colors

Every color comes from a **slot** — a semantic name that describes what the color does, not what it looks like. The naming convention follows [HeroUI](https://heroui.com/docs/native/getting-started/colors):

- A slot **without a suffix** is a background. `accent` is what you paint a button with.
- A slot **with `Foreground`** is text on that background. `accentForeground` is the button label.

Put `accentForeground` text on an `accent` background and contrast is guaranteed in every theme.

### Color slots

**Layout**

| Slot | Paired with | What it is |
|---|---|---|
| `background` | `foreground` | App canvas. Root views, scroll backgrounds. |
| `surface` | `surfaceForeground` | Elevated content. Cards, list items, panels. |
| `overlay` | `overlayForeground` | Floating layers. Bottom sheets, modals, scrims. |

**Brand**

| Slot | Paired with | What it is |
|---|---|---|
| `accent` | `accentForeground` | Primary action. Start button, route lines, active indicators. |
| `accentSoft` | `accentSoftForeground` | Tinted background for secondary emphasis. Tags, selected states. |

**Neutral**

| Slot | Paired with | What it is |
|---|---|---|
| `default` | `defaultForeground` | Neutral component backgrounds. Pill buttons, circle buttons, chips. |
| `muted` | *(standalone)* | Secondary text. Timestamps, labels, placeholders. |

**Structure**

| Slot | What it is |
|---|---|
| `border` | Subtle structural borders (often near-transparent). |
| `separator` | Visible dividers between content sections. |
| `focus` | Focus ring color (defaults to accent). |

**Status**

| Slot | Paired with | When to use |
|---|---|---|
| `success` | `successForeground` | Completed actions, positive metrics. |
| `warning` | `warningForeground` | Caution states, approaching limits. |
| `danger` | `dangerForeground` | Destructive actions, errors, stop buttons. |
| `dangerSoft` | *(uses dangerForeground)* | Subtle danger background (hold-to-stop button). |

**Map (app-specific)**

| Slot | What it is |
|---|---|
| `mapBg` / `mapBg3D` | Container background behind the map. |
| `building` | 3D building extrusion fill. |
| `fogColor` / `fogHigh` / `fogSpace` | Mapbox fog layers. |
| `transparent` | Utility. |

### How to pick the right slot

Ask two questions:

1. **What is this thing?** Text → `foreground`. Secondary label → `muted`. Brand button → `accent`.
2. **What is it sitting on?** App background → `foreground`. Card → `surfaceForeground`. Overlay → `overlayForeground`. The accent button → `accentForeground`.

If a slot has no `Foreground` pair (like `muted`, `separator`), use it directly.

## Spacing and radii

No tokens. No scale. Raw pixel numbers.

```tsx
// Primitives accept numbers directly
<Box p={16} gap={8}>
<Box px={20} py={12} radius={16}>
<Stack gap={12}>
<HStack gap={8}>
<Separator spacing={16} />
```

Follow a 4px grid by convention: prefer multiples of 4 (4, 8, 12, 16, 20, 24, 32, 48, 64). But if you need 14px for optical alignment, just write 14. The system won't stop you.

Composed components have defaults built in:

```tsx
<Card>          // padding=16, radius=16 already set
<Card p={20}>   // override when needed
```

## Typography

Variant presets on the `Text` component. Each variant is a designed combination of size, weight, and tracking:

```tsx
<Text variant="heading">Weekly Stats</Text>     // 24px, bold
<Text variant="title">Morning Run</Text>        // 17px, semibold
<Text variant="body">Your run details</Text>    // 15px, regular
<Text variant="caption">5 min ago</Text>         // 12px, medium
<Text variant="label">DISTANCE</Text>            // 10px, bold, uppercase, tracked
<Text variant="stat">12.5</Text>                 // 48px, ultralight, tabular nums
<Text variant="mono">5:30</Text>                 // 15px, tabular nums
```

Override color with the `color` prop (any `ColorKey`) or use `dim` for secondary text:

```tsx
<Text variant="caption" dim>Last updated</Text>
<Text variant="title" color="accent">Streak!</Text>
```

## Themes

Five built-in. All share the exact same color keys — TypeScript enforces this.

| Theme | Accent | Background | Personality |
|---|---|---|---|
| `dark` | `#FF375F` hot pink | `#0a0a0a` near-black | The original run0 |
| `light` | `#FF375F` hot pink | `#f8f8fa` clean white | Inverted companion |
| `ember` | `#E8622B` burnt orange | `#FBF6F0` eggshell cream | Craft coffee, golden hour |
| `bloom` | `#8B5CF6` vivid purple | `#FFFBF5` warm cream | Wildflower fields, twilight |
| `ocean` | `#FF6B6B` coral | `#0C1B2A` deep navy | Bioluminescence, sunset on water |

`dark` and `light` follow the device color scheme automatically (adaptive). The rest are manual picks.

### Switching themes

```tsx
import { UnistylesRuntime } from "react-native-unistyles";

// Follow device (dark/light auto-switch)
UnistylesRuntime.setAdaptiveThemes(true);

// Pick a specific theme
UnistylesRuntime.setAdaptiveThemes(false);
UnistylesRuntime.setTheme("ember");

// Read current
const current = UnistylesRuntime.themeName;
```

## Using colors in code

### In stylesheets (recommended)

Zero re-renders. Styles recalculate at the C++ layer when the theme changes:

```tsx
import { StyleSheet } from "react-native-unistyles";

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  title: {
    color: theme.colors.surfaceForeground,
    fontSize: 17,
    fontWeight: "600",
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 13,
  },
}));
```

### For non-style props (icon tints, Mapbox colors)

Use the `useUnistyles` hook when you need a color string outside of a stylesheet:

```tsx
import { useUnistyles } from "react-native-unistyles";

function StatIcon() {
  const { theme } = useUnistyles();
  return <Icon color={theme.colors.accent} />;
}
```

### With composition primitives

```tsx
import { Box, Text, Card, HStack } from "@/components/ui";

<Box flex bg="background" p={16}>
  <Card>
    <Text variant="label" dim>DISTANCE</Text>
    <Text variant="stat">12.5</Text>
  </Card>
  <HStack gap={8}>
    <Text color="accent">5:30</Text>
    <Text color="muted">/km</Text>
  </HStack>
</Box>
```

## Extending the system

### Add a theme

1. Define it in `src/theme/tokens.ts`. Every theme must have the same keys.

```ts
export const tropicalTheme = {
  colors: {
    background: "#FFF8E7",
    foreground: "#1A3C34",
    accent: "#FF6F61",
    // ... all color keys
  },
} as const;
```

2. Register it in `src/theme/unistyles.ts`:

```ts
import { tropicalTheme } from "./tokens";

type AppThemes = {
  // ...existing
  tropical: typeof tropicalTheme;
};

StyleSheet.configure({
  themes: { /* ...existing, */ tropical: tropicalTheme },
});
```

3. Use it: `UnistylesRuntime.setTheme("tropical")`

### Add a color slot

Add the key to **every** theme in `tokens.ts`:

```ts
// In every theme's colors:
info: "#5AC8FA",
infoForeground: "#ffffff",
```

The `ColorKey` type updates automatically. Use it immediately in stylesheets or primitives.

### Add a text variant

Add it to the `variants` map in `src/components/ui/text.tsx`:

```ts
const variants = {
  // ...existing
  code: {
    fontSize: 13,
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
    fontWeight: "400" as const,
  },
};
```

Then update the `Variant` type union to include `"code"`.

## Design tips for new themes

- **Start with the accent.** That's the theme's personality.
- **Match temperature.** Warm accent (orange, red) → cream/warm-white background. Cool accent (blue, purple) → cool-white or deep navy.
- **Surface should be close to background but distinct.** Light themes: white cards on tinted bg. Dark themes: slightly lighter shade.
- **Status colors should belong to the palette.** Ember uses olive green and brick red, not neon. Ocean uses mint and coral.
- **Test `muted` on both `background` and `surface`.** It needs to be legible on both.

## File structure

```
src/theme/
  tokens.ts       — Color values for all themes. Nothing else.
  unistyles.ts    — Registers themes with Unistyles. Type augmentation.

src/components/ui/
  box.tsx          — Base view. Accepts raw numbers for spacing/radii.
  stack.tsx        — Vertical/horizontal stacks (built on Box).
  text.tsx         — Text with variant presets and theme colors.
  pressable.tsx    — Pressable with variant presets.
  card.tsx         — Surface card (built on Box, defaults: p=16 radius=16).
  separator.tsx    — Themed divider line.
  index.ts         — Barrel export.

index.ts           — App entry. Imports unistyles before expo-router.
```
