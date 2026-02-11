import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import Globe, { GlobeMethods } from "react-globe.gl";
import { feature } from "topojson-client";
import { type GlobeLocation, CATEGORY_COLORS } from "@/lib/demo-globe-data";

interface GlobeViewProps {
  locations: GlobeLocation[];
  onLocationClick: (location: GlobeLocation) => void;
  filter: string[];
}

const GEOJSON_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export function GlobeView({ locations, onLocationClick, filter }: GlobeViewProps) {
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

  const filteredLocations = useMemo(
    () =>
      filter.length === 0
        ? locations
        : locations.filter((l) => filter.includes(l.category)),
    [locations, filter]
  );

  const handlePointClick = useCallback(
    (point: any) => {
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
        pointsData={filteredLocations}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.02}
        pointRadius={(d: any) => (d as GlobeLocation).size * 0.35}
        pointLabel={(d: any) => {
          const loc = d as GlobeLocation;
          return `<div style="font-family:monospace;font-size:11px;background:rgba(10,15,25,0.92);border:1px solid rgba(0,229,255,0.3);padding:6px 10px;border-radius:2px;color:#e2e8f0;max-width:220px">
            <div style="color:${loc.color};font-size:9px;letter-spacing:2px;margin-bottom:3px">${loc.category.toUpperCase()}</div>
            <div style="font-weight:bold;margin-bottom:2px">${loc.label}</div>
            <div style="color:#94a3b8;font-size:9px">${loc.sourceCount} sources</div>
          </div>`;
        }}
        onPointClick={handlePointClick}
      />
    </div>
  );
}
