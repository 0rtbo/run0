import Stack from "expo-router/stack";
import { useUnistyles } from "react-native-unistyles";

export default function Layout() {
  const { theme } = useUnistyles();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }} />
  );
}
