import { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Orbit, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RadialVisualization } from "@/components/nexus/RadialVisualization";
import { NexusDetailPanel } from "@/components/nexus/NexusDetailPanel";
import { getTopicUniverse, getAllTopicIds, getTopicLabel, RING_COLORS, RING_LABELS, type NexusNode, type TopicUniverse, addDynamicUniverse } from "@/lib/demo-nexus-data";
import { useIntelEntries } from "@/hooks/use-intel-data";

const NexusPage = () => {
  const [currentTopic, setCurrentTopic] = useState("surveillance");
  const [history, setHistory] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<NexusNode | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: intelEntries = [] } = useIntelEntries();

  // Build dynamic "Epstein Network" universe from intel entries tagged with "epstein"
  useMemo(() => {
    const epsteinEntries = intelEntries.filter(
      (e) => e.tags?.some((t) => t.toLowerCase().includes("epstein")) ||
             e.title.toLowerCase().includes("epstein") ||
             e.related_entities?.some((r) => r.toLowerCase().includes("epstein"))
    );

    if (epsteinEntries.length === 0) return;

    const persons = epsteinEntries.filter((e) => e.category === "person");
    const events = epsteinEntries.filter((e) => e.category === "event");
    const docs = epsteinEntries.filter((e) => ["document", "claim"].includes(e.category));
    const rest = epsteinEntries.filter((e) => !["person", "event", "document", "claim"].includes(e.category));

    const universe: TopicUniverse = {
      center: {
        id: "epstein-network",
        label: "Epstein Network",
        type: "topic",
        ring: 0,
        description: "Intelligence-sourced connections and evidence related to the Jeffrey Epstein case. Auto-populated from live intel data.",
        sourceCount: epsteinEntries.length,
        color: RING_COLORS[0],
      },
      rings: [
        // Ring 1: Evidence / Documents
        docs.slice(0, 6).map((e, i) => ({
          id: `epstein-doc-${i}`,
          label: e.title.length > 20 ? e.title.slice(0, 20) + "…" : e.title,
          type: "evidence" as const,
          ring: 1 as const,
          description: e.description || e.title,
          sourceCount: e.credibility_score ? Math.round(e.credibility_score / 10) : 1,
          color: RING_COLORS[1],
        })),
        // Ring 2: Events / Claims
        [...events, ...rest].slice(0, 6).map((e, i) => ({
          id: `epstein-event-${i}`,
          label: e.title.length > 20 ? e.title.slice(0, 20) + "…" : e.title,
          type: "claim" as const,
          ring: 2 as const,
          description: e.description || e.title,
          sourceCount: e.credibility_score ? Math.round(e.credibility_score / 10) : 1,
          color: RING_COLORS[2],
        })),
        // Ring 3: Persons / Connections
        persons.slice(0, 8).map((e, i) => ({
          id: `epstein-person-${i}`,
          label: e.title.length > 20 ? e.title.slice(0, 20) + "…" : e.title,
          type: "connection" as const,
          ring: 3 as const,
          description: e.description || e.title,
          sourceCount: e.credibility_score ? Math.round(e.credibility_score / 10) : 1,
          color: RING_COLORS[3],
        })),
      ],
    };

    addDynamicUniverse("epstein-network", universe);
  }, [intelEntries]);

  // Auto-navigate from URL param
  useEffect(() => {
    const topic = searchParams.get("topic");
    if (topic) {
      setSearchParams({}, { replace: true });
      const matchingId = getAllTopicIds().find(
        (id) => getTopicLabel(id).toLowerCase() === topic.toLowerCase() || id === topic.toLowerCase()
      );
      if (matchingId && matchingId !== currentTopic) {
        navigateTo(matchingId);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const universe = getTopicUniverse(currentTopic);

  const navigateTo = useCallback((topicId: string) => {
    setHistory((prev) => [...prev, currentTopic]);
    setCurrentTopic(topicId);
    setSelectedNode(null);
  }, [currentTopic]);

  const goBack = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setCurrentTopic(prev);
    setSelectedNode(null);
  }, [history]);

  return (
    <div className="h-screen flex flex-col grid-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <Orbit className="h-5 w-5 text-primary" />
          <h1 className="text-sm tracking-widest text-primary text-glow-cyan">THE NEXUS</h1>
          <span className="font-mono text-[10px] text-muted-foreground ml-2">
            // RADIAL TOPIC EXPLORER
          </span>
        </div>

        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={goBack}
              className="flex items-center gap-1 px-2 py-1 rounded-sm font-mono text-[10px] tracking-wider border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <ChevronLeft className="h-3 w-3" />
              BACK
            </button>
          )}
        </div>
      </div>

      {/* Topic selector + legend */}
      <div className="flex items-center gap-2 px-6 py-2 border-b border-border bg-card/50 overflow-x-auto">
        <span className="font-mono text-[9px] text-muted-foreground tracking-wider mr-1 shrink-0">TOPICS:</span>
        {getAllTopicIds().map((id) => (
          <button
            key={id}
            onClick={() => {
              if (id !== currentTopic) navigateTo(id);
            }}
            className={`shrink-0 px-2 py-0.5 rounded-sm font-mono text-[9px] tracking-wider border transition-all ${
              id === currentTopic
                ? "border-primary/50 text-primary bg-primary/10"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {getTopicLabel(id).toUpperCase()}
          </button>
        ))}

        <div className="h-4 w-px bg-border mx-2 shrink-0" />
        <span className="font-mono text-[9px] text-muted-foreground tracking-wider mr-1 shrink-0">RINGS:</span>
        {[1, 2, 3].map((r) => (
          <div key={r} className="flex items-center gap-1 shrink-0">
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: RING_COLORS[r] }} />
            <span className="font-mono text-[8px] text-muted-foreground tracking-wider">{RING_LABELS[r]}</span>
          </div>
        ))}
      </div>

      {/* Visualization */}
      <div className="flex-1 relative overflow-hidden">
        {/* Breadcrumb */}
        {history.length > 0 && (
          <div className="absolute top-3 left-6 z-10 flex items-center gap-1 font-mono text-[9px] text-muted-foreground/60">
            {history.map((h, i) => (
              <span key={i}>
                <button
                  onClick={() => {
                    setCurrentTopic(h);
                    setHistory((prev) => prev.slice(0, i));
                    setSelectedNode(null);
                  }}
                  className="hover:text-primary transition-colors"
                >
                  {getTopicLabel(h).toUpperCase()}
                </button>
                <span className="mx-1">→</span>
              </span>
            ))}
            <span className="text-primary">{universe.center.label.toUpperCase()}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentTopic}
            initial={{ opacity: 0, scale: 0.9, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotate: 10 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full h-full"
          >
            <RadialVisualization
              universe={universe}
              onNodeClick={setSelectedNode}
              onRecenter={navigateTo}
            />
          </motion.div>
        </AnimatePresence>

        <NexusDetailPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onNavigate={navigateTo}
        />

        {/* Watermark */}
        <div className="absolute bottom-3 left-6 font-mono text-[9px] text-muted-foreground/30 tracking-widest pointer-events-none">
          CLEARFIELD // THE NEXUS v0.1 // RADIAL TOPIC EXPLORER
        </div>
      </div>
    </div>
  );
};

export default NexusPage;
