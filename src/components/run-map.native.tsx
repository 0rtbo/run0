import { useEffect, useRef, useMemo } from "react";
import { View } from "react-native";
import Mapbox, {
  MapView,
  Camera,
  ShapeSource,
  LineLayer,
  CircleLayer,
  LocationPuck,
} from "@rnmapbox/maps";
import { Coordinate } from "@/utils/run-storage";

const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";
Mapbox.setAccessToken(TOKEN);
Mapbox.setTelemetryEnabled(false);

const PINK = "#FF375F";

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

export default function RunMap({
  coordinates,
  style,
  interactive = true,
}: Props) {
  const cameraRef = useRef<Camera>(null);

  const coords = useMemo(
    () => coordinates.map((c) => [c.longitude, c.latitude]),
    [coordinates.length]
  );

  const hasRoute = coords.length >= 2;
  const lastCoord =
    coords.length > 0 ? coords[coords.length - 1] : undefined;

  const bearing = hasRoute
    ? getBearing(
        coords[Math.max(0, coords.length - 3)],
        coords[coords.length - 1]
      )
    : 0;

  const routeGeoJSON: GeoJSON.FeatureCollection = useMemo(
    () => ({
      type: "FeatureCollection",
      features: hasRoute
        ? [
            {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: coords },
            },
          ]
        : [],
    }),
    [coordinates.length]
  );

  const startGeoJSON: GeoJSON.FeatureCollection = useMemo(
    () => ({
      type: "FeatureCollection",
      features:
        coords.length > 0
          ? [
              {
                type: "Feature",
                properties: {},
                geometry: { type: "Point", coordinates: coords[0] },
              },
            ]
          : [],
    }),
    [coords[0]?.[0], coords[0]?.[1]]
  );

  const endGeoJSON: GeoJSON.FeatureCollection = useMemo(
    () => ({
      type: "FeatureCollection",
      features: hasRoute
        ? [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Point",
                coordinates: coords[coords.length - 1],
              },
            },
          ]
        : [],
    }),
    [coordinates.length]
  );

  // When running, follow the route with bearing
  useEffect(() => {
    if (!cameraRef.current || !hasRoute) return;
    cameraRef.current.setCamera({
      centerCoordinate: lastCoord,
      zoomLevel: 16,
      pitch: 60,
      heading: bearing,
      animationDuration: 1200,
    });
  }, [coordinates.length]);

  // Bounds for static (non-interactive) display like history cards
  const bounds = useMemo(() => {
    if (!hasRoute) return undefined;
    let minLng = Infinity,
      maxLng = -Infinity,
      minLat = Infinity,
      maxLat = -Infinity;
    for (const c of coords) {
      if (c[0] < minLng) minLng = c[0];
      if (c[0] > maxLng) maxLng = c[0];
      if (c[1] < minLat) minLat = c[1];
      if (c[1] > maxLat) maxLat = c[1];
    }
    return {
      ne: [maxLng, maxLat] as [number, number],
      sw: [minLng, minLat] as [number, number],
    };
  }, [coordinates.length]);

  // When idle (no route): follow user location with heading
  // When running: follow route coordinates
  // When static (non-interactive): fit bounds
  const isIdle = interactive && !hasRoute;

  return (
    <View style={[{ flex: 1, overflow: "hidden", backgroundColor: "#0a0a0a" }, style]}>
      <MapView
        style={{ flex: 1 }}
        styleURL="mapbox://styles/mapbox/dark-v11"
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
        scrollEnabled={interactive}
        pitchEnabled={interactive}
        rotateEnabled={interactive}
        zoomEnabled={interactive}
      >
        <Camera
          ref={cameraRef}
          followUserLocation={isIdle}
          followUserMode="compass"
          followZoomLevel={16}
          followPitch={60}
          {...(bounds && !interactive
            ? {
                bounds: {
                  ne: bounds.ne,
                  sw: bounds.sw,
                  paddingTop: 50,
                  paddingBottom: 50,
                  paddingLeft: 50,
                  paddingRight: 50,
                },
              }
            : !isIdle
              ? {
                  defaultSettings: {
                    centerCoordinate: lastCoord || [0, 0],
                    zoomLevel: 16,
                    pitch: 60,
                    heading: bearing,
                  },
                }
              : {})}
        />

        {hasRoute && (
          <>
            <ShapeSource id="route-glow" shape={routeGeoJSON}>
              <LineLayer
                id="route-glow-layer"
                style={{
                  lineColor: PINK,
                  lineWidth: 10,
                  lineOpacity: 0.2,
                  lineBlur: 6,
                }}
              />
            </ShapeSource>

            <ShapeSource id="route-line" shape={routeGeoJSON}>
              <LineLayer
                id="route-line-layer"
                style={{
                  lineColor: PINK,
                  lineWidth: 4,
                  lineOpacity: 0.9,
                  lineJoin: "round",
                  lineCap: "round",
                }}
              />
            </ShapeSource>

            <ShapeSource id="start-point" shape={startGeoJSON}>
              <CircleLayer
                id="start-glow-layer"
                style={{
                  circleRadius: 12,
                  circleColor: PINK,
                  circleOpacity: 0.15,
                }}
              />
              <CircleLayer
                id="start-layer"
                style={{
                  circleRadius: 6,
                  circleColor: PINK,
                  circleStrokeWidth: 2,
                  circleStrokeColor: "#fff",
                }}
              />
            </ShapeSource>

            <ShapeSource id="end-point" shape={endGeoJSON}>
              <CircleLayer
                id="end-glow-layer"
                style={{
                  circleRadius: 14,
                  circleColor: "#fff",
                  circleOpacity: 0.1,
                }}
              />
              <CircleLayer
                id="end-layer"
                style={{
                  circleRadius: 7,
                  circleColor: "#fff",
                  circleStrokeWidth: 3,
                  circleStrokeColor: PINK,
                }}
              />
            </ShapeSource>
          </>
        )}

        {/* Always show location puck */}
        <LocationPuck puckBearing="heading" pulsing={{ isEnabled: true }} />
      </MapView>
    </View>
  );
}
