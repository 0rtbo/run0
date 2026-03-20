import Stack from "expo-router/stack";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0a0a0a" } }} />
  );
}
