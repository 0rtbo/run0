import { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "@/components/icon";
import Header from "@/components/header";
import RunMap from "@/components/run-map";
import {
  Run,
  getRuns,
  deleteRun,
  formatDuration,
  formatDistance,
  formatPace,
} from "@/utils/run-storage";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useUnistyles();
  const [runs, setRuns] = useState<Run[]>([]);

  useFocusEffect(
    useCallback(() => {
      getRuns().then(setRuns);
    }, [])
  );

  const handleDelete = useCallback((run: Run) => {
    Alert.alert("Delete Run", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteRun(run.id);
          setRuns((prev) => prev.filter((r) => r.id !== run.id));
        },
      },
    ]);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title="Activity" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 56,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 16,
          gap: 12,
        }}
      >
        {runs.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <Text style={styles.count}>
              {runs.length} {runs.length === 1 ? "run" : "runs"}
            </Text>
            {runs.map((run) => (
              <RunCard
                key={run.id}
                run={run}
                onDelete={() => handleDelete(run)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function RunCard({ run, onDelete }: { run: Run; onDelete: () => void }) {
  const router = useRouter();
  const { theme } = useUnistyles();
  const date = new Date(run.date);
  const dateStr = date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const hasRoute = run.coordinates.length > 1;

  return (
    <Pressable
      onPress={() => router.push(`/(history)/${run.id}`)}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.8 : 1 }]}
    >
      {/* Mini map */}
      {hasRoute && (
        <RunMap
          coordinates={run.coordinates}
          style={{ height: 140 }}
          interactive={false}
          enable3D
        />
      )}

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>
              {getRunTitle(date)}
            </Text>
            <Text style={styles.cardDate}>
              {dateStr} · {timeStr}
            </Text>
          </View>
          <Pressable
            onPress={onDelete}
            hitSlop={12}
            style={({ pressed }) => ({ opacity: pressed ? 0.4 : 1 })}
          >
            <Icon sf="ellipsis" fallback="ellipsis-horizontal" size={18} color={theme.colors.muted} />
          </Pressable>
        </View>

        {/* Key stats row */}
        <View style={styles.statsRow}>
          <Stat label="Distance" value={formatDistance(run.distance)} />
          <Stat label="Pace" value={formatPace(run.pace)} />
          <Stat label="Time" value={formatDuration(run.duration)} />
          <Stat label="Cal" value={`${Math.round(run.distance * 0.06)}`} />
        </View>
      </View>
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EmptyState() {
  const { theme } = useUnistyles();

  return (
    <View style={styles.empty}>
      <Icon sf="figure.run" fallback="walk-outline" size={48} color={theme.colors.default} />
      <Text style={styles.emptyTitle}>No runs yet</Text>
      <Text style={styles.emptySubtitle}>
        Your completed runs will appear here.
      </Text>
    </View>
  );
}

function getRunTitle(date: Date): string {
  const h = date.getHours();
  if (h < 6) return "Night Run";
  if (h < 12) return "Morning Run";
  if (h < 17) return "Afternoon Run";
  if (h < 21) return "Evening Run";
  return "Night Run";
}

const styles = StyleSheet.create((theme) => ({
  count: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  cardContent: {
    padding: 16,
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  cardTitle: {
    color: theme.colors.foreground,
    fontSize: 17,
    fontWeight: "600",
  },
  cardDate: {
    color: theme.colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
  },
  stat: {
    flex: 1,
    gap: 3,
  },
  statValue: {
    color: theme.colors.foreground,
    fontSize: 15,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 140,
    gap: 12,
  },
  emptyTitle: {
    color: theme.colors.foreground,
    fontSize: 20,
    fontWeight: "600",
  },
  emptySubtitle: {
    color: theme.colors.muted,
    fontSize: 15,
    textAlign: "center",
  },
}));
