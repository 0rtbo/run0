import { useEffect, useRef } from "react";
import { View } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import { Coordinate } from "@/utils/run-storage";

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";
const MAP_STYLE_DEFAULT = "mapbox://styles/mapbox/dark-v11";
const MAP_STYLE_3D = "mapbox://styles/mapbox/outdoors-v12";

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
  enable3D?: boolean;
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

export default function RunMap({
  coordinates,
  style,
  interactive = true,
  enable3D = false,
}: Props) {
  const { theme } = useUnistyles();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  function syncMap3D(map: any, is3D: boolean) {
    if (!map.isStyleLoaded()) return;

    if (is3D) {
      map.setFog({
        range: [0.5, 10],
        color: themeRef.current.colors.fogColor,
        "high-color": themeRef.current.colors.fogHigh,
        "horizon-blend": 0.05,
        "space-color": themeRef.current.colors.fogSpace,
        "star-intensity": 0.15,
      });

      if (!map.getSource("mapbox-dem")) {
        map.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });
      }

      map.setTerrain({ source: "mapbox-dem", exaggeration: 1.8 });

      if (!map.getSource("mapbox-buildings")) {
        map.addSource("mapbox-buildings", {
          type: "vector",
          url: "mapbox://mapbox.mapbox-streets-v8",
        });
      }

      if (!map.getLayer("3d-buildings")) {
        const labelLayerId = map
          .getStyle()
          .layers?.find(
            (layer: any) => layer.type === "symbol" && layer.layout?.["text-field"]
          )?.id;

        map.addLayer(
          {
            id: "3d-buildings",
            type: "fill-extrusion",
            source: "mapbox-buildings",
            "source-layer": "building",
            filter: ["==", ["get", "extrude"], "true"],
            minzoom: 14,
            paint: {
              "fill-extrusion-color": themeRef.current.colors.building,
              "fill-extrusion-height": ["coalesce", ["get", "height"], 0],
              "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0],
              "fill-extrusion-opacity": 0.35,
            },
          },
          labelLayerId
        );
      }

      return;
    }

    if (map.getLayer("3d-buildings")) map.removeLayer("3d-buildings");
    if (map.getSource("mapbox-buildings")) map.removeSource("mapbox-buildings");
    if (map.getSource("mapbox-dem")) {
      map.setTerrain(null);
      map.removeSource("mapbox-dem");
    }
    map.setFog(null);
  }

  function drawRoute(map: any, coords: Coordinate[], bearing: number) {
    if (!map.isStyleLoaded()) return;
    const t = themeRef.current;

    ["route-glow", "route", "start-glow", "start", "end-glow", "end"].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });

    if (coords.length < 2) return;

    const positions = coords.map((c) => [c.longitude, c.latitude]);

    map.addSource("route-glow", {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: positions } },
    });
    map.addLayer({
      id: "route-glow",
      type: "line",
      source: "route-glow",
      paint: { "line-color": t.colors.accent, "line-width": 10, "line-opacity": 0.2, "line-blur": 6 },
    });

    map.addSource("route", {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: positions } },
    });
    map.addLayer({
      id: "route",
      type: "line",
      source: "route",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": t.colors.accent, "line-width": 4, "line-opacity": 0.9 },
    });

    map.addSource("start", {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: positions[0] } },
    });
    map.addLayer({
      id: "start-glow",
      type: "circle",
      source: "start",
      paint: { "circle-radius": 12, "circle-color": t.colors.accent, "circle-opacity": 0.15 },
    });
    map.addLayer({
      id: "start",
      type: "circle",
      source: "start",
      paint: {
        "circle-radius": 6,
        "circle-color": t.colors.accent,
        "circle-stroke-width": 2,
        "circle-stroke-color": t.colors.foreground,
      },
    });

    map.addSource("end", {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: positions[positions.length - 1] } },
    });
    map.addLayer({
      id: "end-glow",
      type: "circle",
      source: "end",
      paint: { "circle-radius": 14, "circle-color": t.colors.foreground, "circle-opacity": 0.1 },
    });
    map.addLayer({
      id: "end",
      type: "circle",
      source: "end",
      paint: {
        "circle-radius": 7,
        "circle-color": t.colors.foreground,
        "circle-stroke-width": 3,
        "circle-stroke-color": t.colors.accent,
      },
    });

    const bounds = positions.reduce(
      (b: any, c: number[]) => b.extend(c),
      new (mapboxgl as any).LngLatBounds()
    );
    map.fitBounds(bounds, { padding: 50, pitch: 60, bearing });
  }

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
        style: enable3D ? MAP_STYLE_3D : MAP_STYLE_DEFAULT,
        center: [center.longitude, center.latitude],
        zoom: enable3D ? 14.5 : hasRoute ? 14.5 : 15,
        pitch: enable3D ? 75 : 60,
        bearing,
        interactive,
        attributionControl: false,
        antialias: true,
      });

      mapInstanceRef.current.on("style.load", () => {
        syncMap3D(mapInstanceRef.current, enable3D);
      });

      mapInstanceRef.current.on("load", () => {
        drawRoute(mapInstanceRef.current, coordinates, bearing);
      });
    } else {
      syncMap3D(mapInstanceRef.current, enable3D);
      drawRoute(mapInstanceRef.current, coordinates, bearing);
    }
  }, [coordinates, enable3D, interactive]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <View
      style={[
        { overflow: "hidden", backgroundColor: enable3D ? theme.colors.mapBg3D : theme.colors.mapBg },
        style,
      ]}
    >
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </View>
  );
}
