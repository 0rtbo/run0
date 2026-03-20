import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  StyleSheet,
  Animated,
} from "react-native";
import { Stack } from "expo-router";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "@/components/icon";
import RunMap from "@/components/run-map";
import {
  Coordinate,
  Run,
  saveRun,
  calcDistance,
  formatDuration,
  formatDistance,
  formatPace,
} from "@/utils/run-storage";

const PINK = "#FF375F";
const BG = "#0a0a0a";
const CARD = "#1a1a1a";
const DIM = "rgba(255,255,255,0.5)";
const WHITE = "#fff";

type RunState = "idle" | "running" | "paused" | "done";

export default function RunScreen() {
  const insets = useSafeAreaInsets();
  const [runState, setRunState] = useState<RunState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [distance, setDistance] = useState(0);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(
    null
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const coordsRef = useRef<Coordinate[]>([]);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      setLocationPermission(status === "granted");
    });
  }, []);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTracking = useCallback(async () => {
    if (!locationPermission) {
      Alert.alert(
        "Location Required",
        "Please enable location access to track your run."
      );
      return;
    }
    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (loc) => {
        const coord: Coordinate = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        coordsRef.current.push(coord);
        // Shallow copy so React sees a new array reference, but we reuse the same objects
        setCoordinates(coordsRef.current.slice());
        setDistance(calcDistance(coordsRef.current));
      }
    );
    locationSubRef.current = sub;
  }, [locationPermission]);

  const stopTracking = useCallback(() => {
    locationSubRef.current?.remove();
    locationSubRef.current = null;
  }, []);

  const handleStart = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setRunState("running");
    startTimer();
    await startTracking();
  }, [startTimer, startTracking]);

  const handlePause = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRunState("paused");
    stopTimer();
    stopTracking();
  }, [stopTimer, stopTracking]);

  const handleResume = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRunState("running");
    startTimer();
    await startTracking();
  }, [startTimer, startTracking]);

  const handleFinish = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    stopTimer();
    stopTracking();
    setRunState("done");

    const pace = distance > 0 ? elapsed / (distance / 1000) : 0;
    const run: Run = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      duration: elapsed,
      distance,
      pace,
      coordinates: coordsRef.current,
    };
    await saveRun(run);
    Alert.alert(
      "Run Complete",
      `${formatDistance(distance)}  ·  ${formatDuration(elapsed)}  ·  ${formatPace(pace)}`,
      [{ text: "Done", onPress: handleReset }]
    );
  }, [stopTimer, stopTracking, distance, elapsed]);

  const handleReset = useCallback(() => {
    setRunState("idle");
    setElapsed(0);
    setCoordinates([]);
    setDistance(0);
    coordsRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      stopTimer();
      stopTracking();
    };
  }, []);

  const pace = distance > 0 ? elapsed / (distance / 1000) : 0;
  const isActive = runState === "running" || runState === "paused";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.root, { backgroundColor: BG }]}>
        {/* Full screen map */}
        <RunMap coordinates={coordinates} style={StyleSheet.absoluteFillObject} />

        {/* Dark gradient overlay at top */}
        <View
          style={[
            styles.topGradient,
            { paddingTop: insets.top + 8 },
          ]}
        >
          <Text style={styles.screenTitle}>
            {isActive ? (runState === "paused" ? "PAUSED" : "RUNNING") : "RUN"}
          </Text>
          {isActive && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>

        {/* Floating stats panel */}
        <View
          style={[styles.bottomPanel, { paddingBottom: insets.bottom + 16 }]}
        >
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.mainStat}>
              <Text style={styles.mainStatValue}>
                {distance < 1000
                  ? `${Math.round(distance)}`
                  : (distance / 1000).toFixed(2)}
              </Text>
              <Text style={styles.mainStatUnit}>
                {distance < 1000 ? "m" : "km"}
              </Text>
            </View>

            <View style={styles.secondaryStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>{formatDuration(elapsed)}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Pace</Text>
                <Text style={styles.statValue}>{formatPace(pace)}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Calories</Text>
                <Text style={styles.statValue}>
                  {Math.round(distance * 0.06)}
                </Text>
              </View>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            {runState === "idle" && (
              <Pressable
                onPress={handleStart}
                style={({ pressed }) => [
                  styles.startButton,
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <Text style={styles.startText}>START</Text>
              </Pressable>
            )}

            {runState === "running" && (
              <View style={styles.activeControls}>
                <Pressable
                  onPress={handlePause}
                  style={({ pressed }) => [
                    styles.circleButton,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Icon sf="pause.fill" fallback="pause" size={24} color={WHITE} />
                </Pressable>
                <HoldToStop onComplete={handleFinish} />
              </View>
            )}

            {runState === "paused" && (
              <View style={styles.activeControls}>
                <Pressable
                  onPress={handleResume}
                  style={({ pressed }) => [
                    styles.circleButton,
                    styles.resumeButton,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Icon sf="play.fill" fallback="play" size={24} color={BG} />
                </Pressable>
                <HoldToStop onComplete={handleFinish} />
              </View>
            )}

            {runState === "done" && (
              <Pressable
                onPress={handleReset}
                style={({ pressed }) => [
                  styles.startButton,
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <Text style={styles.startText}>NEW RUN</Text>
              </Pressable>
            )}
          </View>

          {!locationPermission && locationPermission !== null && (
            <Text style={styles.warning}>
              Enable location access in Settings to track your run.
            </Text>
          )}
        </View>
      </View>
    </>
  );
}

const HOLD_DURATION = 1500;

function HoldToStop({ onComplete }: { onComplete: () => void }) {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holding, setHolding] = useState(false);

  const onPressIn = () => {
    setHolding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(fillAnim, {
      toValue: 1,
      duration: HOLD_DURATION,
      useNativeDriver: false,
    }).start();
    holdTimer.current = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete();
    }, HOLD_DURATION);
  };

  const onPressOut = () => {
    setHolding(false);
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    Animated.timing(fillAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const fillWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={styles.holdButton}
    >
      <Animated.View
        style={[
          styles.holdFill,
          { width: fillWidth },
        ]}
      />
      <View style={styles.holdContent}>
        <Icon sf="stop.fill" fallback="stop" size={16} color={WHITE} />
        <Text style={styles.holdText}>
          {holding ? "HOLD..." : "HOLD TO END"}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "transparent",
  },
  screenTitle: {
    color: WHITE,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 2,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PINK,
  },
  liveText: {
    color: PINK,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(10,10,10,0.92)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  statsContainer: {
    gap: 16,
  },
  mainStat: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 4,
  },
  mainStatValue: {
    color: WHITE,
    fontSize: 64,
    fontWeight: "200",
    fontVariant: ["tabular-nums"],
    letterSpacing: -2,
  },
  mainStatUnit: {
    color: DIM,
    fontSize: 20,
    fontWeight: "500",
  },
  secondaryStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  statLabel: {
    color: DIM,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  statValue: {
    color: WHITE,
    fontSize: 17,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  controls: {
    marginTop: 20,
  },
  startButton: {
    backgroundColor: PINK,
    borderRadius: 32,
    borderCurve: "continuous",
    paddingVertical: 18,
    alignItems: "center",
  },
  startText: {
    color: BG,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 3,
  },
  activeControls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },
  circleButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  stopButton: {
    backgroundColor: "rgba(255,59,48,0.3)",
  },
  holdButton: {
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,59,48,0.2)",
    overflow: "hidden",
    justifyContent: "center",
    paddingHorizontal: 24,
    minWidth: 160,
  },
  holdFill: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: "rgba(255,59,48,0.5)",
    borderRadius: 32,
  },
  holdContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  holdText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  resumeButton: {
    backgroundColor: PINK,
  },
  warning: {
    color: DIM,
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
  },
});
