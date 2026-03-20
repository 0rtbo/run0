import { useState, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "@/components/icon";
import Header from "@/components/header";
import {
  Run,
  getRuns,
  formatDistance,
  formatDuration,
  formatPace,
} from "@/utils/run-storage";

const PINK = "#FF375F";
const BG = "#0a0a0a";
const CARD = "#1a1a1a";
const DIM = "rgba(255,255,255,0.5)";
const WHITE = "#fff";
const BORDER = "rgba(255,255,255,0.08)";

interface Stats {
  totalRuns: number;
  totalDistance: number;
  totalDuration: number;
  avgDistance: number;
  avgPace: number;
  longestRun: number;
  fastestPace: number;
  thisWeekRuns: number;
  thisWeekDistance: number;
  thisWeekDuration: number;
  streak: number;
}

function computeStats(runs: Run[]): Stats {
  const empty: Stats = {
    totalRuns: 0,
    totalDistance: 0,
    totalDuration: 0,
    avgDistance: 0,
    avgPace: 0,
    longestRun: 0,
    fastestPace: 0,
    thisWeekRuns: 0,
    thisWeekDistance: 0,
    thisWeekDuration: 0,
    streak: 0,
  };
  if (runs.length === 0) return empty;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const weekRuns = runs.filter((r) => new Date(r.date) >= startOfWeek);
  const totalDistance = runs.reduce((s, r) => s + r.distance, 0);
  const totalDuration = runs.reduce((s, r) => s + r.duration, 0);
  const validPaces = runs.filter((r) => r.pace > 0).map((r) => r.pace);

  // Streak calculation
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayMs = 86400000;
  const sortedDates = [
    ...new Set(
      runs.map((r) => {
        const d = new Date(r.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    ),
  ].sort((a, b) => b - a);

  for (let i = 0; i < sortedDates.length; i++) {
    const expected = today.getTime() - i * dayMs;
    if (sortedDates[i] === expected) {
      streak++;
    } else break;
  }

  return {
    totalRuns: runs.length,
    totalDistance,
    totalDuration,
    avgDistance: totalDistance / runs.length,
    avgPace:
      validPaces.length > 0
        ? validPaces.reduce((s, p) => s + p, 0) / validPaces.length
        : 0,
    longestRun: Math.max(...runs.map((r) => r.distance)),
    fastestPace: validPaces.length > 0 ? Math.min(...validPaces) : 0,
    thisWeekRuns: weekRuns.length,
    thisWeekDistance: weekRuns.reduce((s, r) => s + r.distance, 0),
    thisWeekDuration: weekRuns.reduce((s, r) => s + r.duration, 0),
    streak,
  };
}

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<Stats | null>(null);

  useFocusEffect(
    useCallback(() => {
      getRuns().then((runs) => setStats(computeStats(runs)));
    }, [])
  );

  if (!stats) return null;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title="Stats" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 56,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 16,
          gap: 16,
        }}
      >
        {/* Week summary bar */}
        <View style={styles.weekCard}>
          <Text style={styles.weekTitle}>THIS WEEK</Text>
          <View style={styles.weekStats}>
            <WeekStat
              value={String(stats.thisWeekRuns)}
              label="Runs"
            />
            <View style={styles.weekDivider} />
            <WeekStat
              value={formatDistance(stats.thisWeekDistance)}
              label="Distance"
            />
            <View style={styles.weekDivider} />
            <WeekStat
              value={formatDuration(stats.thisWeekDuration)}
              label="Time"
            />
          </View>
        </View>

        {/* Streak + Total runs row */}
        <View style={styles.row}>
          <View style={[styles.compactCard, { flex: 1 }]}>
            <Icon sf="flame.fill" fallback="flame" size={20} color={PINK} />
            <Text style={styles.compactValue}>{stats.streak}</Text>
            <Text style={styles.compactLabel}>Day Streak</Text>
          </View>
          <View style={[styles.compactCard, { flex: 1 }]}>
            <Icon sf="figure.run" fallback="walk" size={20} color={PINK} />
            <Text style={styles.compactValue}>{stats.totalRuns}</Text>
            <Text style={styles.compactLabel}>Total Runs</Text>
          </View>
        </View>

        {/* All time */}
        <Text style={styles.sectionTitle}>ALL TIME</Text>
        <View style={styles.listCard}>
          <ListRow
            sf="road.lanes" fallback="map-outline"
            label="Total Distance"
            value={formatDistance(stats.totalDistance)}
          />
          <View style={styles.listDivider} />
          <ListRow
            sf="clock" fallback="time-outline"
            label="Total Time"
            value={formatDuration(stats.totalDuration)}
          />
          <View style={styles.listDivider} />
          <ListRow
            sf="arrow.triangle.swap" fallback="swap-vertical"
            label="Avg Distance"
            value={formatDistance(stats.avgDistance)}
          />
          <View style={styles.listDivider} />
          <ListRow
            sf="speedometer" fallback="speedometer-outline"
            label="Avg Pace"
            value={formatPace(stats.avgPace)}
          />
        </View>

        {/* Personal bests */}
        <Text style={styles.sectionTitle}>PERSONAL BESTS</Text>
        <View style={styles.listCard}>
          <ListRow
            sf="trophy.fill" fallback="trophy"
            label="Longest Run"
            value={formatDistance(stats.longestRun)}
            highlight
          />
          <View style={styles.listDivider} />
          <ListRow
            sf="bolt.fill" fallback="flash"
            label="Fastest Pace"
            value={formatPace(stats.fastestPace)}
            highlight
          />
        </View>
      </ScrollView>
    </View>
  );
}

function WeekStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.weekStat}>
      <Text style={styles.weekValue}>{value}</Text>
      <Text style={styles.weekLabel}>{label}</Text>
    </View>
  );
}

function ListRow({
  sf,
  fallback,
  label,
  value,
  highlight,
}: {
  sf: string;
  fallback: React.ComponentProps<typeof Icon>["fallback"];
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.listRow}>
      <Icon sf={sf} fallback={fallback} size={18} color={highlight ? PINK : DIM} />
      <Text style={styles.listLabel}>{label}</Text>
      <Text
        style={[styles.listValue, highlight && { color: PINK }]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  weekCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderCurve: "continuous",
    padding: 20,
    gap: 16,
  },
  weekTitle: {
    color: PINK,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  weekStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  weekStat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  weekDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: BORDER,
  },
  weekValue: {
    color: WHITE,
    fontSize: 22,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  weekLabel: {
    color: DIM,
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  compactCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderCurve: "continuous",
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  compactValue: {
    color: WHITE,
    fontSize: 28,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  compactLabel: {
    color: DIM,
    fontSize: 12,
    fontWeight: "500",
  },
  sectionTitle: {
    color: DIM,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginTop: 4,
  },
  listCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  listDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: BORDER,
    marginLeft: 46,
  },
  listLabel: {
    flex: 1,
    color: WHITE,
    fontSize: 15,
  },
  listValue: {
    color: WHITE,
    fontSize: 15,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});
