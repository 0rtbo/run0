import { useEffect, useRef, useMemo } from "react";
import { View } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import Mapbox, {
  MapView,
  Camera,
  RasterDemSource,
  Terrain,
  VectorSource,
  FillExtrusionLayer,
  ShapeSource,
  LineLayer,
  CircleLayer,
  LocationPuck,
} from "@rnmapbox/maps";
import { Coordinate } from "@/utils/run-storage";

const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";
Mapbox.setAccessToken(TOKEN);
Mapbox.setTelemetryEnabled(false);

const MAP_STYLE_3D = "mapbox://styles/mapbox/outdoors-v12";
const MAP_STYLE_DEFAULT = "mapbox://styles/mapbox/dark-v11";
const TERRAIN_EXAGGERATION = 1.8;

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

  useEffect(() => {
    if (!cameraRef.current || !hasRoute) return;
    cameraRef.current.setCamera({
      centerCoordinate: lastCoord,
      zoomLevel: enable3D ? 14.5 : 16,
      pitch: enable3D ? 75 : 60,
      heading: bearing,
      animationDuration: 1200,
    });
  }, [bearing, coordinates.length, enable3D, hasRoute, lastCoord]);

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

  const isIdle = interactive && !hasRoute;

  return (
    <View
      style={[
        { flex: 1, overflow: "hidden", backgroundColor: enable3D ? theme.colors.mapBg3D : theme.colors.mapBg },
        style,
      ]}
    >
      <MapView
        style={{ flex: 1 }}
        styleURL={enable3D ? MAP_STYLE_3D : MAP_STYLE_DEFAULT}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
        scrollEnabled={interactive}
        pitchEnabled={interactive}
        rotateEnabled={interactive}
        zoomEnabled={interactive}
      >
        {enable3D && (
          <>
            <RasterDemSource
              id="mapbox-dem"
              url="mapbox://mapbox.mapbox-terrain-dem-v1"
              tileSize={512}
              maxZoomLevel={14}
            />
            <Terrain
              sourceID="mapbox-dem"
              style={{ exaggeration: TERRAIN_EXAGGERATION }}
            />
            <VectorSource id="mapbox-buildings" url="mapbox://mapbox.mapbox-streets-v8">
              <FillExtrusionLayer
                id="3d-buildings"
                sourceLayerID="building"
                minZoomLevel={14}
                maxZoomLevel={22}
                filter={["==", ["get", "extrude"], "true"]}
                style={{
                  fillExtrusionColor: theme.colors.building,
                  fillExtrusionHeight: ["coalesce", ["get", "height"], 0],
                  fillExtrusionBase: ["coalesce", ["get", "min_height"], 0],
                  fillExtrusionOpacity: 0.35,
                }}
              />
            </VectorSource>
          </>
        )}

        <Camera
          ref={cameraRef}
          followUserLocation={isIdle}
          followZoomLevel={enable3D ? 14.5 : 16}
          followPitch={enable3D ? 75 : 60}
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
                      zoomLevel: enable3D ? 14.5 : 16,
                      pitch: enable3D ? 75 : 60,
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
                  lineColor: theme.colors.accent,
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
                  lineColor: theme.colors.accent,
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
                  circleColor: theme.colors.accent,
                  circleOpacity: 0.15,
                }}
              />
              <CircleLayer
                id="start-layer"
                style={{
                  circleRadius: 6,
                  circleColor: theme.colors.accent,
                  circleStrokeWidth: 2,
                  circleStrokeColor: theme.colors.foreground,
                }}
              />
            </ShapeSource>

            <ShapeSource id="end-point" shape={endGeoJSON}>
              <CircleLayer
                id="end-glow-layer"
                style={{
                  circleRadius: 14,
                  circleColor: theme.colors.foreground,
                  circleOpacity: 0.1,
                }}
              />
              <CircleLayer
                id="end-layer"
                style={{
                  circleRadius: 7,
                  circleColor: theme.colors.foreground,
                  circleStrokeWidth: 3,
                  circleStrokeColor: theme.colors.accent,
                }}
              />
            </ShapeSource>
          </>
        )}

        <LocationPuck puckBearing="heading" pulsing={{ isEnabled: true }} />
      </MapView>
    </View>
  );
}
