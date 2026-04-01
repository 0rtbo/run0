import { View, Text, Pressable } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface HeaderProps {
  title: string;
  subtitle?: string;
  leftIcon?: IoniconsName;
  rightIcon?: IoniconsName;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  transparent?: boolean;
}

export default function Header({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  transparent,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useUnistyles();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 4,
          backgroundColor: transparent ? "transparent" : theme.colors.background,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.side}>
          {leftIcon && (
            <Pressable
              onPress={onLeftPress ?? (() => router.back())}
              hitSlop={12}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            >
              <Ionicons name={leftIcon} size={20} color={theme.colors.foreground} />
            </Pressable>
          )}
        </View>
        <View style={styles.center}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        <View style={[styles.side, { alignItems: "flex-end" }]}>
          {rightIcon && (
            <Pressable
              onPress={onRightPress}
              hitSlop={12}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            >
              <Ionicons name={rightIcon} size={20} color={theme.colors.foreground} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  side: {
    width: 40,
  },
  center: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    color: theme.colors.foreground,
    fontSize: 17,
    fontWeight: "600",
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: 1,
  },
}));
