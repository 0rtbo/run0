import { Screen, Text } from "@/components/ui";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function TestScreen() {
  return (
    <Screen edges={["top", "left", "right"]} style={styles.screen}>
      <View style={styles.block}>
        <Text variant="heading">Minimal UI</Text>
        <Text tone="muted">Use `Screen` for safe areas, then compose with local stylesheets.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: {
    paddingHorizontal: theme.space[16],
  },
  block: {
    gap: theme.space[8],
  },
}));
