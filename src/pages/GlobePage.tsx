import { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Globe as GlobeIcon, Filter, X } from "lucide-react";
import { GlobeView } from "@/components/globe/GlobeView";
import { LocationDetailPanel } from "@/components/globe/LocationDetailPanel";
import { GlobeQueryBar } from "@/components/globe/GlobeQueryBar";
import { QueryResultPanel, type AiQueryResult } from "@/components/globe/QueryResultPanel";
import { demoGlobeLocations, demoGlobeArcs, demoHeatmapPoints, CATEGORY_COLORS, ARC_NETWORKS, type GlobeLocation } from "@/lib/demo-globe-data";
import { useIntelEntriesRealtime } from "@/hooks/use-intel-realtime";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const categories = [
  { key: "institution", label: "INSTITUTIONS" },
  { key: "event", label: "EVENTS" },
  { key: "document", label: "DOCUMENTS" },
  { key: "military", label: "MILITARY" },
  { key: "corporate", label: "CORPORATE" },
  { key: "government", label: "GOVERNMENT" },
];

const GlobePage = () => {
  const [selectedLocation, setSelectedLocation] = useState<GlobeLocation | null>(null);
  const [filter, setFilter] = useState<string[]>([]);
  const [arcFilter, setArcFilter] = useState<string[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(true);

  // AI query state
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResult, setQueryResult] = useState<AiQueryResult | null>(null);
  const [cameraTarget, setCameraTarget] = useState<{ lat: number; lng: number; altitude: number } | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Live intel data
  const { data: intelEntries = [] } = useIntelEntriesRealtime();

  // Intel entries with location → merge into globe
  const intelLocations = useMemo(() => {
    return intelEntries
      .filter((e) => e.lat != null && e.lng != null)
      .map((e, i) => ({
        id: `intel-${e.id}`,
        label: e.title,
        lat: e.lat!,
        lng: e.lng!,
        category: (e.category === "person" ? "institution" : e.category === "claim" ? "document" : e.category) as GlobeLocation["category"],
        description: e.description || e.ai_summary || e.title,
        sourceCount: e.credibility_score || 1,
        evidenceIds: [],
        color: e.fact_check_status === "verified" ? "#22c55e" : e.fact_check_status === "disputed" ? "#eab308" : "#64748b",
        size: 0.9,
      }));
  }, [intelEntries]);

  const intelHeatmapPoints = useMemo(() => {
    return intelEntries
      .filter((e) => e.lat != null && e.lng != null)
      .map((e) => ({
        lat: e.lat!,
        lng: e.lng!,
        weight: Math.max(3, (e.credibility_score || 50) / 10),
      }));
  }, [intelEntries]);

  const allLocations = useMemo(() => [...demoGlobeLocations, ...intelLocations], [intelLocations]);
  const allHeatmapPoints = useMemo(() => [...demoHeatmapPoints, ...intelHeatmapPoints], [intelHeatmapPoints]);

  // Auto-query from URL param
  useEffect(() => {
    const search = searchParams.get("search");
    if (search) {
      setSearchParams({}, { replace: true });
      handleQuery(search);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFilter = (cat: string) => {
    setFilter((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleArcFilter = (network: string) => {
    setArcFilter((prev) =>
      prev.includes(network) ? prev.filter((n) => n !== network) : [...prev, network]
    );
  };

  const handleQuery = useCallback(async (query: string) => {
    setIsQuerying(true);
    setQueryResult(null);
    setCameraTarget(null);

    try {
      const { data, error } = await supabase.functions.invoke("globe-query", {
        body: { query },
      });

      if (error) {
        toast({ title: "Query failed", description: error.message, variant: "destructive" });
        return;
      }

      if (data?.error) {
        toast({ title: "AI Error", description: data.error, variant: "destructive" });
        return;
      }

      const result: AiQueryResult = {
        query,
        summary: data.summary || "Results generated.",
        mode: data.mode || "points",
        locations: data.locations || [],
        heatmapPoints: data.heatmapPoints || [],
        arcs: data.arcs || [],
      };

      setQueryResult(result);

      if (data.camera) {
        setCameraTarget(data.camera);
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to query the globe AI.", variant: "destructive" });
    } finally {
      setIsQuerying(false);
    }
  }, []);

  const clearAiResults = useCallback(() => {
    setQueryResult(null);
    setCameraTarget(null);
  }, []);

  const handleFlyTo = useCallback((lat: number, lng: number) => {
    setCameraTarget({ lat, lng, altitude: 1.2 });
  }, []);

  const totalLocations = allLocations.length;
  const totalArcs = demoGlobeArcs.length;

  return (
    <div className="h-screen flex flex-col grid-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <GlobeIcon className="h-5 w-5 text-primary" />
          <h1 className="text-sm tracking-widest text-primary text-glow-cyan">GLOBAL INTELLIGENCE MAP</h1>
          <span className="font-mono text-[10px] text-muted-foreground ml-2">
            // EVENT-BASED LOCATIONS
          </span>
        </div>
        <div className="font-mono text-[10px] text-muted-foreground">
          {totalLocations} LOCATIONS // {totalArcs} CONNECTIONS
          {intelLocations.length > 0 && (
            <span className="text-emerald-400 ml-2">+{intelLocations.length} LIVE</span>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 px-6 py-2 border-b border-border bg-card/50 flex-wrap">
        <Filter className="h-3 w-3 text-muted-foreground" />
        <span className="font-mono text-[9px] text-muted-foreground tracking-wider mr-2">FILTER:</span>
        {categories.map((cat) => {
          const active = filter.length === 0 || filter.includes(cat.key);
          const color = CATEGORY_COLORS[cat.key];
          return (
            <button
              key={cat.key}
              onClick={() => toggleFilter(cat.key)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[9px] tracking-wider border transition-all ${
                active
                  ? "border-border text-foreground"
                  : "border-transparent text-muted-foreground/40"
              }`}
            >
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: active ? color : "#334155" }}
              />
              {cat.label}
            </button>
          );
        })}

        <div className="h-4 w-px bg-border mx-1" />
        <span className="font-mono text-[9px] text-muted-foreground tracking-wider mr-1">ARCS:</span>
        {Object.entries(ARC_NETWORKS).map(([key, net]) => {
          const active = arcFilter.length === 0 || arcFilter.includes(key);
          return (
            <button
              key={key}
              onClick={() => toggleArcFilter(key)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[9px] tracking-wider border transition-all ${
                active
                  ? "border-border text-foreground"
                  : "border-transparent text-muted-foreground/40"
              }`}
            >
              <div
                className="h-px w-3"
                style={{ backgroundColor: active ? net.color : "#334155" }}
              />
              {net.label}
            </button>
          );
        })}

        <div className="h-4 w-px bg-border mx-1" />
        <button
          onClick={() => setShowHeatmap((v) => !v)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[9px] tracking-wider border transition-all ${
            showHeatmap
              ? "border-border text-foreground"
              : "border-transparent text-muted-foreground/40"
          }`}
        >
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: showHeatmap ? "#00e5ff" : "#334155" }}
          />
          HEATMAP
        </button>

        {queryResult && (
          <>
            <div className="h-4 w-px bg-border mx-1" />
            <button
              onClick={clearAiResults}
              className="flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[9px] tracking-wider border border-pink-500/40 text-pink-400 hover:bg-pink-500/10 transition-all"
            >
              <X className="h-3 w-3" />
              CLEAR AI
            </button>
          </>
        )}
      </div>

      {/* Globe canvas */}
      <div className="flex-1 relative overflow-hidden">
        <GlobeView
          locations={allLocations}
          arcs={demoGlobeArcs}
          heatmapPoints={allHeatmapPoints}
          onLocationClick={setSelectedLocation}
          filter={filter}
          arcFilter={arcFilter}
          showHeatmap={showHeatmap}
          aiLocations={queryResult?.locations}
          aiHeatmapPoints={queryResult?.heatmapPoints}
          aiArcs={queryResult?.arcs}
          cameraTarget={cameraTarget}
        />

        {/* AI Query bar */}
        <GlobeQueryBar onQuery={handleQuery} isLoading={isQuerying} />

        {/* AI Result panel */}
        <QueryResultPanel
          result={queryResult}
          onClear={clearAiResults}
          onFlyTo={handleFlyTo}
        />

        {/* Detail panel */}
        <LocationDetailPanel
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
        />

        {/* Watermark */}
        <div className="absolute bottom-3 left-6 font-mono text-[9px] text-muted-foreground/30 tracking-widest pointer-events-none">
          CLEARFIELD // GLOBAL INTELLIGENCE MAP // EVENT-BASED ONLY
        </div>
      </div>
    </div>
  );
};

export default GlobePage;
