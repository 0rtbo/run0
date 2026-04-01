import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface IconProps {
  sf: string;
  fallback: IoniconsName;
  size?: number;
  color?: string;
}

export default function Icon({ sf, fallback, size = 20, color }: IconProps) {
  // Default color is handled by the caller via theme.colors.text
  // We keep a safe fallback for standalone usage
  const resolvedColor = color ?? "#fff";

  if (process.env.EXPO_OS === "ios") {
    return (
      <Image
        source={`sf:${sf}`}
        style={{ width: size, height: size, color: resolvedColor as any }}
      />
    );
  }
  return <Ionicons name={fallback} size={size} color={resolvedColor} />;
}
