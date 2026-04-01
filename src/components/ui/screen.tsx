import { View, type ViewProps } from "react-native";
import {
  StyleSheet,
  type UnistylesVariants,
} from "react-native-unistyles";

type ScreenEdge = "top" | "right" | "bottom" | "left";

const defaultEdges: Array<ScreenEdge> = ["top", "right", "bottom", "left"];

export type ScreenProps = ViewProps &
  UnistylesVariants<typeof styles> & {
    edges?: Array<ScreenEdge>;
  };

export function Screen({ style, surface, edges = defaultEdges, ...props }: ScreenProps) {
  styles.useVariants({ surface });

  return <View style={[styles.screen, styles.insets(edges), style]} {...props} />;
}

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    variants: {
      surface: {
        default: {
          backgroundColor: theme.colors.background,
        },
        background: {
          backgroundColor: theme.colors.background,
        },
        surface: {
          backgroundColor: theme.colors.surface,
        },
      },
    },
  },
  insets: (edges: Array<ScreenEdge>) => ({
    paddingTop: edges.includes("top") ? rt.insets.top : 0,
    paddingRight: edges.includes("right") ? rt.insets.right : 0,
    paddingBottom: edges.includes("bottom") ? rt.insets.bottom : 0,
    paddingLeft: edges.includes("left") ? rt.insets.left : 0,
  }),
}));
