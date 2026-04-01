import {
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
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
} from "@rnmapbox/maps";
import { Coordinate } from "@/utils/run-storage";

const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";
Mapbox.setAccessToken(TOKEN);
Mapbox.setTelemetryEnabled(false);

const MAP_STYLE_3D = "mapbox://styles/mapbox/outdoors-v12";
const TERRAIN_EXAGGERATION = 1.8;

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
  const { theme } = useUnistyles();
  const cameraRef = useRef<Camera>(null);
  const [step, setStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentStepRef = useRef(0);
  const isPausedRef = useRef(false);

  const coords = useMemo(
    () => coordinates.map((c) => [c.longitude, c.latitude]),
    [coordinates]
  );

  const hasRoute = coords.length >= 2;
  const totalSteps = coords.length;
  const interval = totalSteps > 50 ? 60 : totalSteps > 20 ? 100 : 150;

  const initialBearing = hasRoute
    ? getBearing(coords[0], coords[Math.min(3, coords.length - 1)])
    : 0;

  const routeGeoJSON: GeoJSON.FeatureCollection = useMemo(
    () => ({
      type: "FeatureCollection",
      features: hasRoute
        ? [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } }]
        : [],
    }),
    [coords]
  );

  const startGeoJSON: GeoJSON.FeatureCollection = useMemo(
    () => ({
      type: "FeatureCollection",
      features:
        coords.length > 0
          ? [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: coords[0] } }]
          : [],
    }),
    [coords]
  );

  const endGeoJSON: GeoJSON.FeatureCollection = useMemo(
    () => ({
      type: "FeatureCollection",
      features: hasRoute
        ? [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: coords[coords.length - 1] } }]
        : [],
    }),
    [coords]
  );

  const progressGeoJSON: GeoJSON.FeatureCollection = useMemo(
    () => ({
      type: "FeatureCollection",
      features: [
        { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: coords[step] || coords[0] || [0, 0] } },
      ],
    }),
    [step, coords]
  );

  const animateStep = useCallback(
    (stepNum: number) => {
      if (stepNum >= totalSteps) return;
      const coord = coords[stepNum];
      const nextIdx = Math.min(stepNum + 3, totalSteps - 1);
      const prevIdx = Math.max(0, stepNum - 1);
      const heading = getBearing(coords[prevIdx], coords[nextIdx]);
      const progress = stepNum / totalSteps;

      cameraRef.current?.setCamera({
        centerCoordinate: coord,
        heading,
        pitch: 55 + Math.sin(progress * Math.PI) * 10,
        zoomLevel: 15.5 - Math.sin(progress * Math.PI) * 0.5,
        animationDuration: interval,
      });

      setStep(stepNum);
      onProgress?.(progress);
    },
    [coords, totalSteps, interval, onProgress]
  );

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startAnimation = useCallback(
    (fromStep: number) => {
      stopTimer();
      isPausedRef.current = false;
      currentStepRef.current = fromStep;
      onStatusChange?.("playing");

      timerRef.current = setInterval(() => {
        if (isPausedRef.current) return;
        if (currentStepRef.current >= totalSteps) {
          stopTimer();
          onStatusChange?.("finished");
          return;
        }
        animateStep(currentStepRef.current);
        currentStepRef.current++;
      }, interval);
    },
    [totalSteps, interval, animateStep, stopTimer, onStatusChange]
  );

  useImperativeHandle(
    ref,
    () => ({
      play: () => {
        if (isPausedRef.current) {
          isPausedRef.current = false;
          onStatusChange?.("playing");
          if (!timerRef.current) startAnimation(currentStepRef.current);
        } else if (!timerRef.current) {
          startAnimation(currentStepRef.current);
        }
      },
      pause: () => {
        isPausedRef.current = true;
        onStatusChange?.("paused");
      },
      restart: () => {
        stopTimer();
        currentStepRef.current = 0;
        setStep(0);
        cameraRef.current?.setCamera({
          centerCoordinate: coords[0],
          zoomLevel: 14.5,
          pitch: 75,
          heading: initialBearing,
          animationDuration: 600,
        });
        setTimeout(() => startAnimation(0), 700);
      },
    }),
    [coords, initialBearing, startAnimation, stopTimer, onStatusChange]
  );

  useEffect(() => {
    if (!hasRoute) return;
    const timeout = setTimeout(() => startAnimation(0), 800);
    return () => {
      clearTimeout(timeout);
      stopTimer();
    };
  }, [hasRoute]);

  if (!hasRoute) {
    return <View style={[{ flex: 1, backgroundColor: theme.colors.mapBg3D }, style]} />;
  }

  return (
    <View style={[{ flex: 1, overflow: "hidden", backgroundColor: theme.colors.mapBg3D }, style]}>
      <MapView
        style={{ flex: 1 }}
        styleURL={MAP_STYLE_3D}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
        scrollEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        zoomEnabled={false}
      >
        <RasterDemSource id="mapbox-dem" url="mapbox://mapbox.mapbox-terrain-dem-v1" tileSize={512} maxZoomLevel={14} />
        <Terrain sourceID="mapbox-dem" style={{ exaggeration: TERRAIN_EXAGGERATION }} />
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

        <Camera
          ref={cameraRef}
          defaultSettings={{ centerCoordinate: coords[0], zoomLevel: 14.5, pitch: 75, heading: initialBearing }}
        />

        <ShapeSource id="route-glow" shape={routeGeoJSON}>
          <LineLayer id="route-glow-layer" style={{ lineColor: theme.colors.accent, lineWidth: 8, lineOpacity: 0.3, lineBlur: 4 }} />
        </ShapeSource>

        <ShapeSource id="route-line" shape={routeGeoJSON}>
          <LineLayer id="route-line-layer" style={{ lineColor: theme.colors.accent, lineWidth: 4, lineOpacity: 0.9, lineJoin: "round", lineCap: "round" }} />
        </ShapeSource>

        <ShapeSource id="start-point" shape={startGeoJSON}>
          <CircleLayer id="start-glow-layer" style={{ circleRadius: 12, circleColor: theme.colors.accent, circleOpacity: 0.2 }} />
          <CircleLayer id="start-layer" style={{ circleRadius: 6, circleColor: theme.colors.accent, circleStrokeWidth: 2, circleStrokeColor: theme.colors.foreground }} />
        </ShapeSource>

        <ShapeSource id="end-point" shape={endGeoJSON}>
          <CircleLayer id="end-glow-layer" style={{ circleRadius: 14, circleColor: theme.colors.foreground, circleOpacity: 0.15 }} />
          <CircleLayer id="end-layer" style={{ circleRadius: 7, circleColor: theme.colors.foreground, circleStrokeWidth: 3, circleStrokeColor: theme.colors.accent }} />
        </ShapeSource>

        <ShapeSource id="progress-point" shape={progressGeoJSON}>
          <CircleLayer id="progress-glow-layer" style={{ circleRadius: 16, circleColor: theme.colors.accent, circleOpacity: 0.25 }} />
          <CircleLayer id="progress-layer" style={{ circleRadius: 5, circleColor: theme.colors.foreground, circleStrokeWidth: 2, circleStrokeColor: theme.colors.accent }} />
        </ShapeSource>
      </MapView>
    </View>
  );
});

export default FlybyMap;
