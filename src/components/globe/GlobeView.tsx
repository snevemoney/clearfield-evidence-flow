import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import Globe, { GlobeMethods } from "react-globe.gl";
import { feature } from "topojson-client";
import { type GlobeLocation, type GlobeArc, type HeatmapPoint, CATEGORY_COLORS } from "@/lib/demo-globe-data";

interface GlobeViewProps {
  locations: GlobeLocation[];
  arcs: GlobeArc[];
  heatmapPoints: HeatmapPoint[];
  onLocationClick: (location: GlobeLocation) => void;
  filter: string[];
  arcFilter: string[];
  showHeatmap: boolean;
  aiLocations?: { lat: number; lng: number; label: string; description: string; category: string; weight: number }[];
  aiHeatmapPoints?: HeatmapPoint[];
  aiArcs?: { startLat: number; startLng: number; endLat: number; endLng: number; label: string; description: string }[];
  cameraTarget?: { lat: number; lng: number; altitude: number } | null;
}

const GEOJSON_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export function GlobeView({ locations, arcs, heatmapPoints, onLocationClick, filter, arcFilter, showHeatmap, aiLocations, aiHeatmapPoints, aiArcs, cameraTarget }: GlobeViewProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [countries, setCountries] = useState<{ features: any[] }>({ features: [] });
  const [hoveredCountry, setHoveredCountry] = useState<any>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Load country polygons
  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((r) => r.json())
      .then((topology) => {
        const geo = feature(topology, topology.objects.countries) as any;
        setCountries(geo);
      })
      .catch((err) => {
        console.error("GeoJSON load failed", err);
        setGeoError(err instanceof Error ? err.message : "Failed to load country outlines");
      });
  }, []);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Initial globe config
  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.4;
      controls.enableZoom = true;
    }
    globeRef.current.pointOfView({ lat: 30, lng: -20, altitude: 2.2 }, 0);
  }, []);

  // Camera fly-to when AI returns a target
  useEffect(() => {
    if (!cameraTarget || !globeRef.current) return;
    globeRef.current.pointOfView(cameraTarget, 1200);
    const controls = globeRef.current.controls();
    if (controls) controls.autoRotate = false;
  }, [cameraTarget]);

  const filteredLocations = useMemo(
    () =>
      filter.length === 0
        ? locations
        : locations.filter((l) => filter.includes(l.category)),
    [locations, filter]
  );

  const filteredArcs = useMemo(
    () =>
      arcFilter.length === 0
        ? arcs
        : arcs.filter((a) => arcFilter.includes(a.network)),
    [arcs, arcFilter]
  );

  // Merge AI locations into points data
  const mergedPoints = useMemo(() => {
    const base = filteredLocations as any[];
    if (!aiLocations?.length) return base;
    const aiPoints = aiLocations.map((loc, i) => ({
      ...loc,
      id: `ai-loc-${i}`,
      color: "#e879a0",
      size: 0.8 + (loc.weight / 10) * 0.6,
      sourceCount: loc.weight,
      evidenceIds: [],
      isAiGenerated: true,
    }));
    return [...base, ...aiPoints];
  }, [filteredLocations, aiLocations]);

  // Merge AI arcs
  const mergedArcs = useMemo(() => {
    const base = filteredArcs as any[];
    if (!aiArcs?.length) return base;
    const mapped = aiArcs.map((a, i) => ({
      ...a,
      id: `ai-arc-${i}`,
      color: ["#e879a0", "#e879a0"],
      network: "ai_query",
      isAiGenerated: true,
    }));
    return [...base, ...mapped];
  }, [filteredArcs, aiArcs]);

  // Merge AI heatmap
  const mergedHeatmap = useMemo(() => {
    const base = showHeatmap ? heatmapPoints : [];
    if (!aiHeatmapPoints?.length) return base;
    return [...base, ...aiHeatmapPoints];
  }, [heatmapPoints, aiHeatmapPoints, showHeatmap]);

  const handlePointClick = useCallback(
    (point: any) => {
      if (point.isAiGenerated) {
        // Fly to AI point
        if (globeRef.current) {
          globeRef.current.pointOfView({ lat: point.lat, lng: point.lng, altitude: 1.2 }, 800);
          const controls = globeRef.current.controls();
          if (controls) controls.autoRotate = false;
        }
        return;
      }
      const loc = point as GlobeLocation;
      onLocationClick(loc);
      if (globeRef.current) {
        globeRef.current.pointOfView({ lat: loc.lat, lng: loc.lng, altitude: 1.2 }, 800);
        const controls = globeRef.current.controls();
        if (controls) controls.autoRotate = false;
      }
    },
    [onLocationClick]
  );

  return (
    <div ref={containerRef} className="w-full h-full absolute inset-0" style={{ zIndex: 1 }}>
      {geoError && (
        <div className="absolute top-3 left-3 z-20 border border-destructive/30 bg-background/80 px-2 py-1 rounded-sm">
          <p className="font-mono text-[10px] text-destructive" role="alert">{geoError}</p>
        </div>
      )}
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        atmosphereColor="#00e5ff"
        atmosphereAltitude={0.18}
        // Country polygons
        polygonsData={countries.features}
        polygonCapColor={(d: any) =>
          d === hoveredCountry ? "rgba(245,158,11,0.15)" : "rgba(0,229,255,0.03)"
        }
        polygonSideColor={() => "rgba(0,229,255,0.02)"}
        polygonStrokeColor={() => "rgba(0,229,255,0.15)"}
        polygonAltitude={(d: any) => (d === hoveredCountry ? 0.008 : 0.004)}
        onPolygonHover={(d: any) => setHoveredCountry(d)}
        // Points layer
        pointsData={mergedPoints}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.02}
        pointRadius={(d: any) => (d.size || 0.8) * 0.35}
        pointLabel={(d: any) => {
          const isAi = d.isAiGenerated;
          const color = isAi ? "#e879a0" : d.color;
          const catLabel = isAi ? "AI RESULT" : (d.category || "").toUpperCase();
          return `<div style="font-family:monospace;font-size:11px;background:rgba(10,15,25,0.92);border:1px solid ${isAi ? "rgba(232,121,160,0.4)" : "rgba(0,229,255,0.3)"};padding:6px 10px;border-radius:2px;color:#e2e8f0;max-width:220px">
            <div style="color:${color};font-size:9px;letter-spacing:2px;margin-bottom:3px">${catLabel}</div>
            <div style="font-weight:bold;margin-bottom:2px">${d.label}</div>
            <div style="color:#94a3b8;font-size:9px">${isAi ? d.description?.slice(0, 80) + "..." : d.sourceCount + " sources"}</div>
          </div>`;
        }}
        onPointClick={handlePointClick}
        // Arcs layer
        arcsData={mergedArcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={2000}
        arcStroke={0.5}
        arcAltitudeAutoScale={0.3}
        arcLabel={(d: any) => {
          const isAi = d.isAiGenerated;
          const color = isAi ? "#e879a0" : d.color?.[0] || "#00e5ff";
          return `<div style="font-family:monospace;font-size:11px;background:rgba(10,15,25,0.92);border:1px solid ${isAi ? "rgba(232,121,160,0.4)" : "rgba(0,229,255,0.3)"};padding:6px 10px;border-radius:2px;color:#e2e8f0;max-width:240px">
            <div style="color:${color};font-size:9px;letter-spacing:2px;margin-bottom:3px">${isAi ? "AI CONNECTION" : (d.network || "").toUpperCase().replace("_"," ")}</div>
            <div style="font-weight:bold;margin-bottom:2px">${d.label}</div>
            <div style="color:#94a3b8;font-size:9px">${d.description}</div>
          </div>`;
        }}
        // Heatmap layer (flat color spectrum)
        heatmapsData={mergedHeatmap.length > 0 ? [{ points: mergedHeatmap }] : []}
        heatmapPointLat={(p: any) => p.lat}
        heatmapPointLng={(p: any) => p.lng}
        heatmapPointWeight={(p: any) => p.weight}
        heatmapBandwidth={4}
        heatmapBaseAltitude={0.004}
        heatmapTopAltitude={0.004}
        heatmapColorSaturation={1.5}
        heatmapColorFn={(t: number) => {
          if (t < 0.15) return `rgba(10,30,80,${t * 3})`;
          if (t < 0.4) return `hsla(187,90%,${30 + t * 60}%,${0.4 + t})`;
          if (t < 0.7) return `hsla(${187 - (t - 0.4) * 400},85%,${50 + t * 20}%,${0.6 + t * 0.3})`;
          return `hsla(${20 - (t - 0.7) * 50},90%,${45 + t * 15}%,${0.8 + t * 0.2})`;
        }}
      />
    </div>
  );
}
