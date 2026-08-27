import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { GitBranch, Globe as GlobeIcon, Orbit, StickyNote, Network, Filter, X, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ConnectionWeb } from "@/components/graph/ConnectionWeb";
import { ShadowBoard } from "@/components/graph/ShadowBoard";
import { NodeDetailPanel } from "@/components/graph/NodeDetailPanel";
import { EDGE_COLORS, NODE_COLORS, type GraphNode } from "@/lib/demo-graph-data";
import { GraphSearchBar } from "@/components/graph/GraphSearchBar";
import { GraphLegend } from "@/components/graph/GraphLegend";
import type { GraphHandle } from "@/components/graph/ConnectionWeb";
import { GlobeView } from "@/components/globe/GlobeView";
import { LocationDetailPanel } from "@/components/globe/LocationDetailPanel";
import { GlobeQueryBar } from "@/components/globe/GlobeQueryBar";
import { QueryResultPanel, type AiQueryResult } from "@/components/globe/QueryResultPanel";
import { demoGlobeLocations, demoGlobeArcs, demoHeatmapPoints, CATEGORY_COLORS, ARC_NETWORKS, type GlobeLocation } from "@/lib/demo-globe-data";
import { RadialVisualization } from "@/components/nexus/RadialVisualization";
import { NexusDetailPanel } from "@/components/nexus/NexusDetailPanel";
import { NexusSearchBar } from "@/components/nexus/NexusSearchBar";
import { getTopicUniverse, getAllTopicIds, getTopicLabel, RING_COLORS, RING_LABELS, type NexusNode, type TopicUniverse, addDynamicUniverse } from "@/lib/demo-nexus-data";
import { useIntelEntriesRealtime as useIntelEntries } from "@/hooks/use-intel-realtime";
import { toast } from "@/hooks/use-toast";
import { invokeFunction } from "@/lib/invoke";
import { QueryError } from "@/components/QueryError";

type VisualizeMode = "graph" | "globe" | "nexus";

const nodeTypes = [
  { key: "institution", label: "INSTITUTIONS" },
  { key: "event", label: "EVENTS" },
  { key: "document", label: "DOCUMENTS" },
  { key: "person", label: "PERSONS" },
  { key: "law", label: "LAWS" },
  { key: "media_artifact", label: "MEDIA" },
  { key: "claim", label: "CLAIMS" },
];

const globeCategories = [
  { key: "institution", label: "INSTITUTIONS" },
  { key: "event", label: "EVENTS" },
  { key: "document", label: "DOCUMENTS" },
  { key: "military", label: "MILITARY" },
  { key: "corporate", label: "CORPORATE" },
  { key: "government", label: "GOVERNMENT" },
];

const Visualize = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const modeParam = searchParams.get("mode");
  const [mode, setMode] = useState<VisualizeMode>((modeParam as VisualizeMode) || "graph");

  // Graph state
  const [graphViewMode, setGraphViewMode] = useState<"web" | "circuit">("web");
  const [selectedGraphNode, setSelectedGraphNode] = useState<GraphNode | null>(null);
  const [graphFilter, setGraphFilter] = useState<string[]>([]);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const graphRef = useRef<GraphHandle>(null);

  // Globe state
  const [selectedLocation, setSelectedLocation] = useState<GlobeLocation | null>(null);
  const [globeFilter, setGlobeFilter] = useState<string[]>([]);
  const [arcFilter, setArcFilter] = useState<string[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResult, setQueryResult] = useState<AiQueryResult | null>(null);
  const [cameraTarget, setCameraTarget] = useState<{ lat: number; lng: number; altitude: number } | null>(null);

  // Nexus state
  const [currentTopic, setCurrentTopic] = useState("surveillance");
  const [nexusHistory, setNexusHistory] = useState<string[]>([]);
  const [selectedNexusNode, setSelectedNexusNode] = useState<NexusNode | null>(null);

  const { data: intelEntries = [], isError: intelError, error: intelErr, isLoading: intelLoading } = useIntelEntries();

  // Handle URL params
  useEffect(() => {
    if (modeParam && ["graph", "globe", "nexus"].includes(modeParam)) {
      setMode(modeParam as VisualizeMode);
    }
    const search = searchParams.get("search");
    if (search && modeParam === "globe") {
      setSearchParams({}, { replace: true });
      handleGlobeQuery(search);
    }
    const topic = searchParams.get("topic");
    if (topic && modeParam === "nexus") {
      setSearchParams({}, { replace: true });
      const matchingId = getAllTopicIds().find(
        (id) => getTopicLabel(id).toLowerCase() === topic.toLowerCase() || id === topic.toLowerCase()
      );
      if (matchingId) navigateNexus(matchingId);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Globe data
  const intelLocations = useMemo(() => {
    return intelEntries.filter((e) => e.lat != null && e.lng != null).map((e) => ({
      id: `intel-${e.id}`, label: e.title, lat: e.lat!, lng: e.lng!,
      category: (e.category === "person" ? "institution" : e.category === "claim" ? "document" : e.category) as GlobeLocation["category"],
      description: e.description || e.ai_summary || e.title, sourceCount: e.credibility_score || 1, evidenceIds: [],
      color: e.fact_check_status === "verified" ? "#22c55e" : e.fact_check_status === "disputed" ? "#eab308" : "#64748b", size: 0.9,
    }));
  }, [intelEntries]);

  const intelHeatmapPoints = useMemo(() => {
    return intelEntries.filter((e) => e.lat != null && e.lng != null).map((e) => ({ lat: e.lat!, lng: e.lng!, weight: Math.max(3, (e.credibility_score || 50) / 10) }));
  }, [intelEntries]);

  const allLocations = useMemo(() => [...demoGlobeLocations, ...intelLocations], [intelLocations]);
  const allHeatmapPoints = useMemo(() => [...demoHeatmapPoints, ...intelHeatmapPoints], [intelHeatmapPoints]);

  // Nexus dynamic universe
  useMemo(() => {
    const epsteinEntries = intelEntries.filter((e) => e.tags?.some((t) => t.toLowerCase().includes("epstein")) || e.title.toLowerCase().includes("epstein") || e.related_entities?.some((r) => r.toLowerCase().includes("epstein")));
    if (epsteinEntries.length === 0) return;
    const persons = epsteinEntries.filter((e) => e.category === "person");
    const events = epsteinEntries.filter((e) => e.category === "event");
    const docs = epsteinEntries.filter((e) => ["document", "claim"].includes(e.category));
    const rest = epsteinEntries.filter((e) => !["person", "event", "document", "claim"].includes(e.category));
    const universe: TopicUniverse = {
      center: { id: "epstein-network", label: "Epstein Network", type: "topic", ring: 0, description: "Intelligence-sourced connections related to the Jeffrey Epstein case.", sourceCount: epsteinEntries.length, color: RING_COLORS[0] },
      rings: [
        docs.slice(0, 6).map((e, i) => ({ id: `epstein-doc-${i}`, label: e.title.length > 20 ? e.title.slice(0, 20) + "…" : e.title, type: "evidence" as const, ring: 1 as const, description: e.description || e.title, sourceCount: e.credibility_score ? Math.round(e.credibility_score / 10) : 1, color: RING_COLORS[1] })),
        [...events, ...rest].slice(0, 6).map((e, i) => ({ id: `epstein-event-${i}`, label: e.title.length > 20 ? e.title.slice(0, 20) + "…" : e.title, type: "claim" as const, ring: 2 as const, description: e.description || e.title, sourceCount: e.credibility_score ? Math.round(e.credibility_score / 10) : 1, color: RING_COLORS[2] })),
        persons.slice(0, 8).map((e, i) => ({ id: `epstein-person-${i}`, label: e.title.length > 20 ? e.title.slice(0, 20) + "…" : e.title, type: "connection" as const, ring: 3 as const, description: e.description || e.title, sourceCount: e.credibility_score ? Math.round(e.credibility_score / 10) : 1, color: RING_COLORS[3] })),
      ],
    };
    addDynamicUniverse("epstein-network", universe);
  }, [intelEntries]);

  const universe = getTopicUniverse(currentTopic);

  // Graph handlers
  const toggleGraphFilter = (type: string) => setGraphFilter((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);

  // Globe handlers
  const toggleGlobeFilter = (cat: string) => setGlobeFilter((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  const toggleArcFilter = (network: string) => setArcFilter((prev) => prev.includes(network) ? prev.filter((n) => n !== network) : [...prev, network]);

  const handleGlobeQuery = useCallback(async (query: string) => {
    setIsQuerying(true); setQueryResult(null); setCameraTarget(null);
    try {
      const data = await invokeFunction<{
        summary?: string;
        mode?: string;
        locations?: AiQueryResult["locations"];
        heatmapPoints?: AiQueryResult["heatmapPoints"];
        arcs?: AiQueryResult["arcs"];
        camera?: { lat: number; lng: number; altitude: number };
      }>("globe-query", { query });
      const mode = data.mode === "heatmap" || data.mode === "arcs" || data.mode === "mixed" ? data.mode : "points";
      setQueryResult({ query, summary: data.summary || "Results generated.", mode, locations: data.locations || [], heatmapPoints: data.heatmapPoints || [], arcs: data.arcs || [] });
      if (data.camera) setCameraTarget(data.camera);
    } catch { toast({ title: "Error", description: "Failed to query the globe AI.", variant: "destructive" }); }
    finally { setIsQuerying(false); }
  }, []);

  const clearAiResults = useCallback(() => { setQueryResult(null); setCameraTarget(null); }, []);
  const handleFlyTo = useCallback((lat: number, lng: number) => { setCameraTarget({ lat, lng, altitude: 1.2 }); }, []);

  // Nexus handlers
  const navigateNexus = useCallback((topicId: string) => { setNexusHistory((prev) => [...prev, currentTopic]); setCurrentTopic(topicId); setSelectedNexusNode(null); }, [currentTopic]);
  const goBackNexus = useCallback(() => { if (nexusHistory.length === 0) return; const prev = nexusHistory[nexusHistory.length - 1]; setNexusHistory((h) => h.slice(0, -1)); setCurrentTopic(prev); setSelectedNexusNode(null); }, [nexusHistory]);

  const switchMode = (m: VisualizeMode) => { setMode(m); };

  return (
    <div className="h-screen flex flex-col grid-bg">
      {(intelError || intelLoading) && (
        <div className="px-6 pt-2">
          {intelError && <QueryError message={intelErr instanceof Error ? intelErr.message : "Failed to load intel."} />}
          {intelLoading && !intelError && <p className="font-mono text-[10px] text-muted-foreground animate-pulse">LOADING INTEL...</p>}
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          {mode === "graph" && <GitBranch className="h-5 w-5 text-primary" />}
          {mode === "globe" && <GlobeIcon className="h-5 w-5 text-primary" />}
          {mode === "nexus" && <Orbit className="h-5 w-5 text-primary" />}
          <h1 className="text-sm tracking-widest text-primary text-glow-cyan">VISUALIZE</h1>
        </div>

        {/* Mode switcher */}
        <div className="flex items-center gap-1 border border-border rounded-sm p-0.5">
          <button onClick={() => switchMode("graph")} className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-wider rounded-sm transition-all ${mode === "graph" ? "bg-primary/20 text-primary border-glow-cyan border" : "text-muted-foreground hover:text-foreground"}`}>
            <GitBranch className="h-3 w-3" />GRAPH
          </button>
          <button onClick={() => switchMode("globe")} className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-wider rounded-sm transition-all ${mode === "globe" ? "bg-primary/20 text-primary border-glow-cyan border" : "text-muted-foreground hover:text-foreground"}`}>
            <GlobeIcon className="h-3 w-3" />GLOBE
          </button>
          <button onClick={() => switchMode("nexus")} className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-wider rounded-sm transition-all ${mode === "nexus" ? "bg-primary/20 text-primary border-glow-cyan border" : "text-muted-foreground hover:text-foreground"}`}>
            <Orbit className="h-3 w-3" />NEXUS
          </button>
        </div>

        {/* Mode-specific header controls */}
        <div className="flex items-center gap-2">
          {mode === "graph" && (
            <div className="flex items-center gap-1 border border-border rounded-sm p-0.5">
              <button onClick={() => setGraphViewMode("web")} className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-wider rounded-sm transition-all ${graphViewMode === "web" ? "bg-primary/20 text-primary border-glow-cyan border" : "text-muted-foreground hover:text-foreground"}`}><Network className="h-3 w-3" />THE WEB</button>
              <button onClick={() => setGraphViewMode("circuit")} className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-wider rounded-sm transition-all ${graphViewMode === "circuit" ? "bg-primary/20 text-primary border-glow-cyan border" : "text-muted-foreground hover:text-foreground"}`}><StickyNote className="h-3 w-3" />SHADOW BOARD</button>
            </div>
          )}
          {mode === "nexus" && nexusHistory.length > 0 && (
            <button onClick={goBackNexus} className="flex items-center gap-1 px-2 py-1 rounded-sm font-mono text-[10px] tracking-wider border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
              <ChevronLeft className="h-3 w-3" />BACK
            </button>
          )}
        </div>
      </div>

      {/* Sub-header / filter bar */}
      {mode === "graph" && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-border bg-card/50">
          <Filter className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-[9px] text-muted-foreground tracking-wider mr-2">FILTER:</span>
          {nodeTypes.map((nt) => {
            const active = graphFilter.length === 0 || graphFilter.includes(nt.key);
            const color = NODE_COLORS[nt.key];
            return (
              <button key={nt.key} onClick={() => toggleGraphFilter(nt.key)} className={`flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[9px] tracking-wider border transition-all ${active ? "border-border text-foreground" : "border-transparent text-muted-foreground/40"}`}>
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: active ? color : "#334155" }} />{nt.label}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-3">
            {Object.entries(EDGE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1"><div className="h-px w-3" style={{ backgroundColor: color }} /><span className="font-mono text-[8px] text-muted-foreground tracking-wider">{type.toUpperCase().replace("_", " ")}</span></div>
            ))}
          </div>
        </div>
      )}

      {mode === "globe" && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-border bg-card/50 flex-wrap">
          <Filter className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-[9px] text-muted-foreground tracking-wider mr-2">FILTER:</span>
          {globeCategories.map((cat) => {
            const active = globeFilter.length === 0 || globeFilter.includes(cat.key);
            const color = CATEGORY_COLORS[cat.key];
            return (
              <button key={cat.key} onClick={() => toggleGlobeFilter(cat.key)} className={`flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[9px] tracking-wider border transition-all ${active ? "border-border text-foreground" : "border-transparent text-muted-foreground/40"}`}>
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: active ? color : "#334155" }} />{cat.label}
              </button>
            );
          })}
          <div className="h-4 w-px bg-border mx-1" />
          <span className="font-mono text-[9px] text-muted-foreground tracking-wider mr-1">ARCS:</span>
          {Object.entries(ARC_NETWORKS).map(([key, net]) => {
            const active = arcFilter.length === 0 || arcFilter.includes(key);
            return (
              <button key={key} onClick={() => toggleArcFilter(key)} className={`flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[9px] tracking-wider border transition-all ${active ? "border-border text-foreground" : "border-transparent text-muted-foreground/40"}`}>
                <div className="h-px w-3" style={{ backgroundColor: active ? net.color : "#334155" }} />{net.label}
              </button>
            );
          })}
          <div className="h-4 w-px bg-border mx-1" />
          <button onClick={() => setShowHeatmap((v) => !v)} className={`flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[9px] tracking-wider border transition-all ${showHeatmap ? "border-border text-foreground" : "border-transparent text-muted-foreground/40"}`}>
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: showHeatmap ? "#00e5ff" : "#334155" }} />HEATMAP
          </button>
          {queryResult && (
            <><div className="h-4 w-px bg-border mx-1" /><button onClick={clearAiResults} className="flex items-center gap-1 px-2 py-0.5 rounded-sm font-mono text-[9px] tracking-wider border border-pink-500/40 text-pink-400 hover:bg-pink-500/10 transition-all"><X className="h-3 w-3" />CLEAR AI</button></>
          )}
        </div>
      )}

      {mode === "nexus" && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-border bg-card/50 overflow-x-auto">
          <span className="font-mono text-[9px] text-muted-foreground tracking-wider mr-1 shrink-0">TOPICS:</span>
          {getAllTopicIds().map((id) => (
            <button key={id} onClick={() => { if (id !== currentTopic) navigateNexus(id); }} className={`shrink-0 px-2 py-0.5 rounded-sm font-mono text-[9px] tracking-wider border transition-all ${id === currentTopic ? "border-primary/50 text-primary bg-primary/10" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {getTopicLabel(id).toUpperCase()}
            </button>
          ))}
          <div className="h-4 w-px bg-border mx-2 shrink-0" />
          <span className="font-mono text-[9px] text-muted-foreground tracking-wider mr-1 shrink-0">RINGS:</span>
          {[1, 2, 3].map((r) => (
            <div key={r} className="flex items-center gap-1 shrink-0"><div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: RING_COLORS[r] }} /><span className="font-mono text-[8px] text-muted-foreground tracking-wider">{RING_LABELS[r]}</span></div>
          ))}
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        {mode === "graph" && (
          <>
            <motion.div key={graphViewMode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="w-full h-full">
              {graphViewMode === "web" ? <ConnectionWeb ref={graphRef} onNodeClick={setSelectedGraphNode} filter={graphFilter} onNodesReady={setGraphNodes} /> : <ShadowBoard ref={graphRef} onNodeClick={setSelectedGraphNode} filter={graphFilter} onNodesReady={setGraphNodes} />}
            </motion.div>
            <GraphSearchBar
              nodes={graphNodes}
              onFocusNode={(node) => graphRef.current?.focusNode(node.id)}
            />
            <GraphLegend />
            <NodeDetailPanel node={selectedGraphNode} onClose={() => setSelectedGraphNode(null)} />
          </>
        )}

        {mode === "globe" && (
          <>
            <GlobeView locations={allLocations} arcs={demoGlobeArcs} heatmapPoints={allHeatmapPoints} onLocationClick={setSelectedLocation} filter={globeFilter} arcFilter={arcFilter} showHeatmap={showHeatmap} aiLocations={queryResult?.locations} aiHeatmapPoints={queryResult?.heatmapPoints} aiArcs={queryResult?.arcs} cameraTarget={cameraTarget} />
            <GlobeQueryBar onQuery={handleGlobeQuery} isLoading={isQuerying} />
            <QueryResultPanel result={queryResult} onClear={clearAiResults} onFlyTo={handleFlyTo} />
            <LocationDetailPanel location={selectedLocation} onClose={() => setSelectedLocation(null)} />
          </>
        )}

        {mode === "nexus" && (
          <>
            {nexusHistory.length > 0 && (
              <div className="absolute top-3 left-6 z-10 flex items-center gap-1 font-mono text-[9px] text-muted-foreground/60">
                {nexusHistory.map((h, i) => (
                  <span key={i}><button onClick={() => { setCurrentTopic(h); setNexusHistory((prev) => prev.slice(0, i)); setSelectedNexusNode(null); }} className="hover:text-primary transition-colors">{getTopicLabel(h).toUpperCase()}</button><span className="mx-1">→</span></span>
                ))}
                <span className="text-primary">{universe.center.label.toUpperCase()}</span>
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div key={currentTopic} initial={{ opacity: 0, scale: 0.9, rotate: -10 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.9, rotate: 10 }} transition={{ duration: 0.5, ease: "easeOut" }} className="w-full h-full">
                <RadialVisualization universe={universe} onNodeClick={setSelectedNexusNode} onRecenter={navigateNexus} />
              </motion.div>
            </AnimatePresence>
            <NexusSearchBar onNavigate={navigateNexus} onSelectNode={setSelectedNexusNode} currentTopic={currentTopic} />
            <NexusDetailPanel node={selectedNexusNode} onClose={() => setSelectedNexusNode(null)} onNavigate={navigateNexus} />
          </>
        )}

        <div className="absolute bottom-3 left-6 font-mono text-[9px] text-muted-foreground/30 tracking-widest pointer-events-none">
          CLEARFIELD // VISUALIZE v0.1
        </div>
      </div>
    </div>
  );
};

export default Visualize;
