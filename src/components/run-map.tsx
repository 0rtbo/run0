import { useEffect, useRef } from "react";
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

interface Props {
  coordinates: Coordinate[];
  style?: object;
  interactive?: boolean;
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

export default function RunMap({ coordinates, style, interactive = true }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || !mapboxgl) return;
    const center =
      coordinates.length > 0
        ? coordinates[coordinates.length - 1]
        : { latitude: 37.7749, longitude: -122.4194 };

    const hasRoute = coordinates.length > 1;
    const coords = coordinates.map((c) => [c.longitude, c.latitude]);
    const bearing = hasRoute ? getBearing(coords[0], coords[Math.min(3, coords.length - 1)]) : 0;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new mapboxgl.Map({
        container: mapRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [center.longitude, center.latitude],
        zoom: hasRoute ? 14.5 : 15,
        pitch: 60,
        bearing,
        interactive,
        attributionControl: false,
        antialias: true,
      });

      mapInstanceRef.current.on("style.load", () => {
        const map = mapInstanceRef.current;
        map.setFog({
          range: [0.5, 10],
          color: "#0a0a0a",
          "high-color": "#111",
          "horizon-blend": 0.05,
          "space-color": "#000",
          "star-intensity": 0.15,
        });
        map.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });
        map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
      });

      mapInstanceRef.current.on("load", () => {
        drawRoute(mapInstanceRef.current, coordinates, bearing);
      });
    } else {
      drawRoute(mapInstanceRef.current, coordinates, bearing);
    }
  }, [coordinates]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <View style={[{ overflow: "hidden", backgroundColor: "#0a0a0a" }, style]}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </View>
  );
}

function drawRoute(map: any, coordinates: Coordinate[], bearing: number) {
  if (!map.isStyleLoaded()) return;

  ["route-glow", "route", "start-glow", "start", "end-glow", "end"].forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
  });

  if (coordinates.length < 2) return;

  const coords = coordinates.map((c) => [c.longitude, c.latitude]);

  // Glow
  map.addSource("route-glow", {
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
    source: "route-glow",
    paint: { "line-color": PINK, "line-width": 10, "line-opacity": 0.2, "line-blur": 6 },
  });

  // Route
  map.addSource("route", {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: coords },
    },
  });
  map.addLayer({
    id: "route",
    type: "line",
    source: "route",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": PINK, "line-width": 4, "line-opacity": 0.9 },
  });

  // Start
  map.addSource("start", {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: { type: "Point", coordinates: coords[0] },
    },
  });
  map.addLayer({
    id: "start-glow",
    type: "circle",
    source: "start",
    paint: { "circle-radius": 12, "circle-color": PINK, "circle-opacity": 0.15 },
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

  // End
  map.addSource("end", {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: { type: "Point", coordinates: coords[coords.length - 1] },
    },
  });
  map.addLayer({
    id: "end-glow",
    type: "circle",
    source: "end",
    paint: { "circle-radius": 14, "circle-color": "#fff", "circle-opacity": 0.1 },
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

  const bounds = coords.reduce(
    (b: any, c: number[]) => b.extend(c),
    new (mapboxgl as any).LngLatBounds()
  );
  map.fitBounds(bounds, { padding: 50, pitch: 60, bearing });
}
