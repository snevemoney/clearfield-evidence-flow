import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ZoomIn, ZoomOut, X, FileText, Eye } from "lucide-react";
import { timelineData, type TimelineEvent } from "@/lib/demo-graph-data";
import { useIntelEntriesRealtime as useIntelEntries } from "@/hooks/use-intel-realtime";

const typeStyles: Record<string, { color: string; bg: string; border: string }> = {
  verified: { color: "text-emerald-400", bg: "bg-emerald-500", border: "border-emerald-500/40" },
  disputed: { color: "text-amber-400", bg: "bg-amber-500", border: "border-amber-500/40" },
  unknown: { color: "text-slate-500", bg: "bg-slate-500", border: "border-slate-500/40" },
  redacted: { color: "text-red-500", bg: "bg-red-500", border: "border-red-500/40" },
  unverified: { color: "text-slate-500", bg: "bg-slate-500", border: "border-slate-500/40" },
};

const Timeline = () => {
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<TimelineEvent | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: intelEntries = [] } = useIntelEntries();

  // Convert intel entries with dates into timeline events
  const intelTimelineEvents: TimelineEvent[] = useMemo(() => {
    return intelEntries
      .filter((e) => e.published_at)
      .map((e) => ({
        id: `intel-${e.id}`,
        title: e.title,
        date: e.published_at!.slice(0, 7), // YYYY-MM format
        type: (e.fact_check_status === "verified" ? "verified" : e.fact_check_status === "disputed" ? "disputed" : "unknown") as TimelineEvent["type"],
        branch: "main",
        evidenceCount: e.credibility_score ? Math.round(e.credibility_score / 10) : 0,
        description: e.description || e.ai_summary || e.title,
      }));
  }, [intelEntries]);

  const allEvents = useMemo(() => [...timelineData, ...intelTimelineEvents], [intelTimelineEvents]);

  const mainEvents = allEvents.filter((e) => e.branch === "main").sort((a, b) => a.date.localeCompare(b.date));
  const shadowEvents = allEvents.filter((e) => e.branch === "shadow").sort((a, b) => a.date.localeCompare(b.date));

  const eventWidth = 180 * zoom;
  const totalWidth = Math.max(mainEvents.length * eventWidth + 200, 1200);

  return (
    <div className="h-screen flex flex-col grid-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-primary" />
          <h1 className="text-sm tracking-widest text-primary text-glow-cyan">TIMELINE RIVER</h1>
          <span className="font-mono text-[10px] text-muted-foreground ml-2">
            // FLOWING NARRATIVE STREAMS
          </span>
          {intelTimelineEvents.length > 0 && (
            <span className="font-mono text-[10px] text-emerald-400 ml-2">
              +{intelTimelineEvents.length} LIVE
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Legend */}
          {Object.entries(typeStyles).filter(([k]) => k !== "unverified").map(([type, style]) => (
            <div key={type} className="flex items-center gap-1 mr-2">
              <div className={`h-2 w-2 rounded-full ${style.bg}`} />
              <span className="font-mono text-[8px] text-muted-foreground tracking-wider">{type.toUpperCase()}</span>
            </div>
          ))}

          <div className="h-4 w-px bg-border mx-2" />

          <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))} className="p-1 text-muted-foreground hover:text-foreground">
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="font-mono text-[9px] text-muted-foreground w-8 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(2, z + 0.2))} className="p-1 text-muted-foreground hover:text-foreground">
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Timeline canvas */}
      <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-8 relative">
        <div className="relative" style={{ width: totalWidth, minHeight: 400 }}>
          {/* Main river line */}
          <div
            className="absolute h-0.5 bg-gradient-to-r from-cyan-500/60 via-primary/40 to-cyan-500/20"
            style={{ top: 160, left: 60, width: totalWidth - 120 }}
          />

          {/* Shadow branch line */}
          <div
            className="absolute h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"
            style={{ top: 280, left: 60, width: totalWidth - 120 }}
          />
          <span className="absolute font-mono text-[8px] text-amber-500/40 tracking-widest" style={{ top: 290, left: 60 }}>
            ── SHADOW NARRATIVE ──
          </span>

          {/* Main stream events */}
          {mainEvents.map((event, i) => {
            const style = typeStyles[event.type] || typeStyles.unknown;
            const xPos = 80 + i * eventWidth;
            const isRedacted = event.type === "redacted";
            const isIntel = event.id.startsWith("intel-");

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="absolute"
                style={{ left: xPos, top: 40 }}
              >
                {/* Date */}
                <div className="font-mono text-[9px] text-muted-foreground tracking-wider mb-2 text-center">
                  {event.date}
                </div>

                {/* Event card */}
                <button
                  onClick={() => setSelected(event)}
                  className={`border ${style.border} rounded-sm p-3 bg-card/60 hover:bg-card/90 transition-all text-left ${
                    isRedacted ? "border-dashed" : ""
                  } ${isIntel ? "border-l-2 border-l-emerald-500/60" : ""}`}
                  style={{ width: eventWidth - 20 }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${style.bg}`} />
                    <span className={`font-mono text-[8px] tracking-widest ${style.color}`}>
                      {event.type.toUpperCase()}
                    </span>
                    {isIntel && (
                      <span className="font-mono text-[7px] tracking-widest text-emerald-400 ml-auto">LIVE</span>
                    )}
                  </div>
                  <p className={`font-mono text-[10px] ${isRedacted ? "text-red-500/60" : "text-foreground"} leading-tight`}>
                    {event.title}
                  </p>
                  {event.evidenceCount > 0 && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <FileText className="h-2.5 w-2.5 text-muted-foreground/50" />
                      <span className="font-mono text-[8px] text-muted-foreground">{event.evidenceCount}</span>
                    </div>
                  )}
                </button>

                {/* Connection line to river */}
                <div className={`mx-auto w-px h-6 ${style.bg}/30`} style={{ width: 1 }} />
                <div className={`mx-auto h-2 w-2 rounded-full ${style.bg} shadow-lg`}
                  style={{ boxShadow: `0 0 6px ${style.bg === "bg-emerald-500" ? "#22c55e" : style.bg === "bg-amber-500" ? "#eab308" : style.bg === "bg-red-500" ? "#ef4444" : "#64748b"}40` }}
                />
              </motion.div>
            );
          })}

          {/* Shadow branch events */}
          {shadowEvents.map((event, i) => {
            const style = typeStyles[event.type] || typeStyles.unknown;
            const dateIndex = mainEvents.findIndex((m) => m.date >= event.date);
            const xPos = 80 + (dateIndex >= 0 ? dateIndex : mainEvents.length - 1) * eventWidth + eventWidth / 3;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="absolute"
                style={{ left: xPos, top: 300 }}
              >
                <button
                  onClick={() => setSelected(event)}
                  className={`border border-dashed ${style.border} rounded-sm p-2.5 bg-card/30 hover:bg-card/60 transition-all text-left`}
                  style={{ width: eventWidth - 40 }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={`h-1.5 w-1.5 rounded-full ${style.bg} opacity-60`} />
                    <span className={`font-mono text-[8px] tracking-widest ${style.color} opacity-60`}>
                      {event.type.toUpperCase()} // {event.date}
                    </span>
                  </div>
                  <p className="font-mono text-[9px] text-foreground/60 leading-tight">{event.title}</p>
                </button>
              </motion.div>
            );
          })}

          {/* Watermark */}
          <div className="absolute bottom-2 left-6 font-mono text-[8px] text-muted-foreground/20 tracking-widest">
            CLEARFIELD TIMELINE // SCROLL → TO EXPLORE // EVIDENCE-BACKED EVENTS ONLY
          </div>
        </div>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="border border-border rounded-sm bg-card p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${(typeStyles[selected.type] || typeStyles.unknown).bg}`} />
                  <span className={`font-mono text-[10px] tracking-widest ${(typeStyles[selected.type] || typeStyles.unknown).color}`}>
                    {selected.type.toUpperCase()} // {selected.date}
                  </span>
                </div>
                <button onClick={() => setSelected(null)}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <h3 className="font-mono text-sm font-bold text-foreground mb-2">{selected.title}</h3>
              <p className="font-mono text-[11px] text-muted-foreground mb-3">{selected.description}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3 w-3 text-primary" />
                  <span className="font-mono text-[10px] text-primary">{selected.evidenceCount} SOURCES</span>
                </div>
                <span className="font-mono text-[9px] text-muted-foreground/50">
                  BRANCH: {selected.branch.toUpperCase()}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Timeline;
