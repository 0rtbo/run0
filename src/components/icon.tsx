import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface IconProps {
  sf: string;
  fallback: IoniconsName;
  size?: number;
  color?: string;
}

export default function Icon({ sf, fallback, size = 20, color = "#fff" }: IconProps) {
  if (process.env.EXPO_OS === "ios") {
    return (
      <Image
        source={`sf:${sf}`}
        style={{ width: size, height: size, color: color as any }}
      />
    );
  }
  return <Ionicons name={fallback} size={size} color={color} />;
}
