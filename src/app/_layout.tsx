import { ThemeProvider } from "@/components/theme-provider";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";

const PINK = "#FF375F";

export default function Layout() {
  return (
    <ThemeProvider>
      <NativeTabs
        tintColor={"#FF375F"}
        shadowColor="transparent"
      >
        <NativeTabs.Trigger name="(run)">
          <NativeTabs.Trigger.Icon
            sf="figure.run"
            src={
              <NativeTabs.Trigger.VectorIcon
                family={Ionicons}
                name="walk-outline"
              />
            }
          />
          <NativeTabs.Trigger.Label>Run</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(history)">
          <NativeTabs.Trigger.Icon
            sf="clock.arrow.circlepath"
            src={
              <NativeTabs.Trigger.VectorIcon
                family={Ionicons}
                name="time-outline"
              />
            }
          />
          <NativeTabs.Trigger.Label>Activity</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(stats)">
          <NativeTabs.Trigger.Icon
            sf="chart.bar.fill"
            src={
              <NativeTabs.Trigger.VectorIcon
                family={Ionicons}
                name="stats-chart"
              />
            }
          />
          <NativeTabs.Trigger.Label>Stats</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </ThemeProvider>
  );
}
