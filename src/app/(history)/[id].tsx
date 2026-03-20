import { useState, useCallback, useRef } from "react";
import { View, Text, Pressable, StyleSheet, StatusBar } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import Icon from "@/components/icon";
import FlybyMap, { FlybyHandle } from "@/components/flyby-map";
import {
  Run,
  getRuns,
  formatDuration,
  formatDistance,
  formatPace,
} from "@/utils/run-storage";

const PINK = "#FF375F";
const BG = "#0a0a0a";
const DIM = "rgba(255,255,255,0.5)";
const WHITE = "#fff";

export default function RunDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [run, setRun] = useState<Run | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<
    "playing" | "paused" | "finished"
  >("playing");
  const [progress, setProgress] = useState(0);
  const flybyRef = useRef<FlybyHandle>(null);

  useFocusEffect(
    useCallback(() => {
      getRuns().then((runs) => {
        const found = runs.find((r) => r.id === id);
        if (found) setRun(found);
      });
    }, [id])
  );

  if (!run) return <View style={{ flex: 1, backgroundColor: BG }} />;

  const date = new Date(run.date);
  const dateStr = date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const h = date.getHours();
  const title =
    h < 6
      ? "Night Run"
      : h < 12
      ? "Morning Run"
      : h < 17
      ? "Afternoon Run"
      : h < 21
      ? "Evening Run"
      : "Night Run";

  const calories = Math.round(run.distance * 0.06);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      <View style={[styles.root, { backgroundColor: BG }]}>
        {/* Full screen flyby map */}
        <FlybyMap
          ref={flybyRef}
          coordinates={run.coordinates}
          style={StyleSheet.absoluteFillObject}
          onStatusChange={setPlaybackStatus}
          onProgress={setProgress}
        />

        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [
              styles.pillButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Icon
              sf="chevron.left"
              fallback="chevron-back"
              size={16}
              color={WHITE}
            />
          </Pressable>

          <Text style={styles.topTitle}>{title}</Text>

          {/* Playback controls */}
          <View style={styles.playbackControls}>
            <Pressable
              onPress={() => flybyRef.current?.restart()}
              hitSlop={8}
              style={({ pressed }) => [
                styles.pillButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Icon
                sf="arrow.counterclockwise"
                fallback="refresh"
                size={16}
                color={WHITE}
              />
            </Pressable>
            <Pressable
              onPress={() => {
                if (playbackStatus === "playing") {
                  flybyRef.current?.pause();
                } else {
                  flybyRef.current?.play();
                }
              }}
              hitSlop={8}
              style={({ pressed }) => [
                styles.pillButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Icon
                sf={playbackStatus === "playing" ? "pause.fill" : "play.fill"}
                fallback={playbackStatus === "playing" ? "pause" : "play"}
                size={16}
                color={WHITE}
              />
            </Pressable>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>

        {/* Stats overlay at bottom */}
        <View style={[styles.overlay, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.titleSection}>
            <Text style={styles.runTitle}>{title}</Text>
            <Text style={styles.runDate}>
              {dateStr} · {timeStr}
            </Text>
          </View>

          <View style={styles.primaryStat}>
            <Text style={styles.primaryValue}>
              {run.distance < 1000
                ? `${Math.round(run.distance)}`
                : (run.distance / 1000).toFixed(2)}
            </Text>
            <Text style={styles.primaryUnit}>
              {run.distance < 1000 ? "m" : "km"}
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <StatCell
              label="Duration"
              value={formatDuration(run.duration)}
              sf="clock"
              fallback="time-outline"
            />
            <View style={styles.gridDivider} />
            <StatCell
              label="Avg Pace"
              value={formatPace(run.pace)}
              sf="speedometer"
              fallback="speedometer-outline"
            />
            <View style={styles.gridDivider} />
            <StatCell
              label="Calories"
              value={`${calories}`}
              sf="flame.fill"
              fallback="flame"
            />
          </View>

          {run.coordinates.length > 1 && (
            <Text style={styles.hint}>
              {run.coordinates.length} GPS points recorded
            </Text>
          )}
        </View>
      </View>
    </>
  );
}

function StatCell({
  label,
  value,
  sf,
  fallback,
}: {
  label: string;
  value: string;
  sf: string;
  fallback: React.ComponentProps<typeof Icon>["fallback"];
}) {
  return (
    <View style={styles.statCell}>
      <Icon sf={sf} fallback={fallback} size={14} color={PINK} />
      <Text style={styles.cellValue}>{value}</Text>
      <Text style={styles.cellLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  pillButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    flex: 1,
    textAlign: "center",
    color: WHITE,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  playbackControls: {
    flexDirection: "row",
    gap: 8,
  },
  progressBarContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.08)",
    zIndex: 20,
  },
  progressBar: {
    height: 3,
    backgroundColor: PINK,
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(10,10,10,0.88)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 16,
  },
  titleSection: {
    gap: 4,
  },
  runTitle: {
    color: WHITE,
    fontSize: 20,
    fontWeight: "700",
  },
  runDate: {
    color: DIM,
    fontSize: 13,
  },
  primaryStat: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  primaryValue: {
    color: WHITE,
    fontSize: 52,
    fontWeight: "200",
    fontVariant: ["tabular-nums"],
    letterSpacing: -2,
  },
  primaryUnit: {
    color: DIM,
    fontSize: 18,
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  gridDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 14,
  },
  cellValue: {
    color: WHITE,
    fontSize: 16,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  cellLabel: {
    color: DIM,
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  hint: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 11,
    textAlign: "center",
  },
});
