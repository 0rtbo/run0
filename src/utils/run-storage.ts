import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface Run {
  id: string;
  date: string; // ISO string
  duration: number; // seconds
  distance: number; // meters
  pace: number; // seconds per km
  coordinates: Coordinate[];
}

const RUNS_KEY = "@run_tracker/runs";

export async function saveRun(run: Run): Promise<void> {
  const existing = await getRuns();
  const updated = [run, ...existing];
  await AsyncStorage.setItem(RUNS_KEY, JSON.stringify(updated));
}

export async function getRuns(): Promise<Run[]> {
  const data = await AsyncStorage.getItem(RUNS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function deleteRun(id: string): Promise<void> {
  const existing = await getRuns();
  const updated = existing.filter((r) => r.id !== id);
  await AsyncStorage.setItem(RUNS_KEY, JSON.stringify(updated));
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

export function formatPace(secondsPerKm: number): string {
  if (!secondsPerKm || !isFinite(secondsPerKm)) return "--:--";
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.round(secondsPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")} /km`;
}

export function calcDistance(coords: Coordinate[]): number {
  if (coords.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += haversine(coords[i - 1], coords[i]);
  }
  return total;
}

function haversine(a: Coordinate, b: Coordinate): number {
  const R = 6371000; // meters
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
