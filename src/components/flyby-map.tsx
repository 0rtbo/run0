import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { View } from "react-native";
import { Coordinate } from "@/utils/run-storage";

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";
const PINK = "#FF375F";

let mapboxgl: typeof import("mapbox-gl") | null = null;
if (typeof window !== "undefined") {
  mapboxgl = require("mapbox-gl");
  require("mapbox-gl/dist/mapbox-gl.css");
  (mapboxgl as any).accessToken = MAPBOX_TOKEN;
}

export interface FlybyHandle {
  play: () => void;
  pause: () => void;
  restart: () => void;
}

interface Props {
  coordinates: Coordinate[];
  style?: object;
  onStatusChange?: (status: "playing" | "paused" | "finished") => void;
  onProgress?: (progress: number) => void;
}

function getBearing(a: number[], b: number[]): number {
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const FlybyMap = forwardRef<FlybyHandle, Props>(function FlybyMap(
  { coordinates, style, onStatusChange, onProgress },
  ref
) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentStepRef = useRef(0);
  const isPausedRef = useRef(false);
  const coordsRef = useRef<number[][]>([]);

  const stopTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const animate = () => {
    const map = mapInstanceRef.current;
    const coords = coordsRef.current;
    if (!map || isPausedRef.current) return;
    if (currentStepRef.current >= coords.length) {
      onStatusChange?.("finished");
      return;
    }

    const step = currentStepRef.current;
    const total = coords.length;
    const interval = total > 50 ? 60 : total > 20 ? 100 : 150;
    const coord = coords[step];
    const nextIdx = Math.min(step + 3, total - 1);
    const bearing = getBearing(coords[Math.max(0, step - 1)], coords[nextIdx]);

    map.easeTo({
      center: coord as [number, number],
      bearing,
      pitch: 55 + Math.sin((step / total) * Math.PI) * 10,
      zoom: 15.5 - Math.sin((step / total) * Math.PI) * 0.5,
      duration: interval,
      easing: (t: number) => t,
    });

    (map.getSource("progress") as any)?.setData({
      type: "Feature",
      properties: {},
      geometry: { type: "Point", coordinates: coord },
    });

    onProgress?.(step / total);
    currentStepRef.current++;
    timerRef.current = setTimeout(animate, interval);
  };

  useImperativeHandle(
    ref,
    () => ({
      play: () => {
        isPausedRef.current = false;
        onStatusChange?.("playing");
        animate();
      },
      pause: () => {
        isPausedRef.current = true;
        stopTimer();
        onStatusChange?.("paused");
      },
      restart: () => {
        stopTimer();
        currentStepRef.current = 0;
        isPausedRef.current = false;
        const coords = coordsRef.current;
        if (mapInstanceRef.current && coords.length > 0) {
          mapInstanceRef.current.easeTo({
            center: coords[0],
            bearing: getBearing(
              coords[0],
              coords[Math.min(3, coords.length - 1)]
            ),
            pitch: 60,
            zoom: 15.5,
            duration: 600,
          });
        }
        onStatusChange?.("playing");
        setTimeout(animate, 700);
      },
    }),
    [onStatusChange]
  );

  useEffect(() => {
    if (!mapRef.current || !mapboxgl || coordinates.length < 2) return;

    const coords = coordinates.map((c) => [c.longitude, c.latitude]);
    coordsRef.current = coords;

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: coords[0] as [number, number],
      zoom: 15.5,
      pitch: 60,
      bearing: getBearing(coords[0], coords[Math.min(3, coords.length - 1)]),
      interactive: false,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    map.on("load", () => {
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: coords },
        },
      });
      map.addLayer({
        id: "route-glow",
        type: "line",
        source: "route",
        paint: {
          "line-color": PINK,
          "line-width": 8,
          "line-opacity": 0.3,
          "line-blur": 4,
        },
      });
      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": PINK, "line-width": 4, "line-opacity": 0.9 },
      });

      map.addSource("start", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: coords[0] },
        },
      });
      map.addLayer({
        id: "start",
        type: "circle",
        source: "start",
        paint: {
          "circle-radius": 6,
          "circle-color": PINK,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });

      map.addSource("end", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: coords[coords.length - 1],
          },
        },
      });
      map.addLayer({
        id: "end",
        type: "circle",
        source: "end",
        paint: {
          "circle-radius": 7,
          "circle-color": "#fff",
          "circle-stroke-width": 3,
          "circle-stroke-color": PINK,
        },
      });

      map.addSource("progress", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: coords[0] },
        },
      });
      map.addLayer({
        id: "progress",
        type: "circle",
        source: "progress",
        paint: {
          "circle-radius": 5,
          "circle-color": "#fff",
          "circle-stroke-width": 2,
          "circle-stroke-color": PINK,
        },
      });

      // Auto-play
      onStatusChange?.("playing");
      setTimeout(animate, 800);
    });

    return () => {
      stopTimer();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [coordinates]);

  return (
    <View
      style={[{ flex: 1, overflow: "hidden", backgroundColor: "#0a0a0a" }, style]}
    >
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </View>
  );
});

export default FlybyMap;
