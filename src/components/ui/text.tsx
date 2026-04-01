import {
  Text as RNText,
  type TextProps as RNTextProps,
} from "react-native";
import {
  StyleSheet,
  type UnistylesVariants,
} from "react-native-unistyles";

export type TextProps = RNTextProps & UnistylesVariants<typeof styles>;

export function Text({ style, variant, tone, ...props }: TextProps) {
  styles.useVariants({ variant, tone });

  return <RNText style={[styles.text, style]} {...props} />;
}

const styles = StyleSheet.create((theme) => ({
  text: {
    color: theme.colors.foreground,
    variants: {
      variant: {
        default: {
          fontSize: 15,
          lineHeight: 22,
          fontWeight: "400",
        },
        body: {
          fontSize: 15,
          lineHeight: 22,
          fontWeight: "400",
        },
        title: {
          fontSize: 17,
          lineHeight: 24,
          fontWeight: "600",
        },
        heading: {
          fontSize: 24,
          lineHeight: 30,
          fontWeight: "700",
        },
        caption: {
          fontSize: 12,
          lineHeight: 16,
          fontWeight: "500",
        },
        label: {
          fontSize: 10,
          lineHeight: 14,
          fontWeight: "700",
          letterSpacing: 2,
          textTransform: "uppercase",
        },
      },
      tone: {
        default: {},
        muted: {
          color: theme.colors.muted,
        },
        primary: {
          color: theme.colors.accent,
        },
        danger: {
          color: theme.colors.danger,
        },
      },
    },
  },
}));
