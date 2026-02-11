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

  // Load country polygons
  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((r) => r.json())
      .then((topology) => {
        const geo = feature(topology, topology.objects.countries) as any;
        setCountries(geo);
      })
      .catch(() => {});
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
    <div ref={containerRef} className="w-full h-full">
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
        // Hex bin heatmap layer
        hexBinPointsData={mergedHeatmap}
        hexBinPointLat="lat"
        hexBinPointLng="lng"
        hexBinPointWeight="weight"
        hexBinResolution={3}
        hexAltitude={(d: any) => d.sumWeight * 0.002}
        hexTopColor={(d: any) => {
          const intensity = Math.min(d.sumWeight / 60, 1);
          const h = 187 - intensity * 30;
          const l = 30 + intensity * 40;
          return `hsla(${h}, 90%, ${l}%, ${0.5 + intensity * 0.4})`;
        }}
        hexSideColor={(d: any) => {
          const intensity = Math.min(d.sumWeight / 60, 1);
          const h = 187 - intensity * 30;
          const l = 20 + intensity * 25;
          return `hsla(${h}, 80%, ${l}%, ${0.3 + intensity * 0.3})`;
        }}
        hexLabel={(d: any) => {
          return `<div style="font-family:monospace;font-size:11px;background:rgba(10,15,25,0.92);border:1px solid rgba(0,229,255,0.3);padding:6px 10px;border-radius:2px;color:#e2e8f0">
            <div style="color:#00e5ff;font-size:9px;letter-spacing:2px;margin-bottom:3px">EVIDENCE DENSITY</div>
            <div style="font-weight:bold">${Math.round(d.sumWeight)} evidence weight</div>
            <div style="color:#94a3b8;font-size:9px">${d.points.length} data points in region</div>
          </div>`;
        }}
      />
    </div>
  );
}
