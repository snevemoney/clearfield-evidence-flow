import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ZoomIn, ZoomOut, X, FileText, Eye, Layers, ChevronDown, AlertTriangle } from "lucide-react";
import { timelineData, icebergData, type TimelineEvent, type IcebergItem } from "@/lib/demo-graph-data";
import { useIntelEntriesRealtime as useIntelEntries, useRealtimeInvalidation } from "@/hooks/use-intel-realtime";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LIST_LIMIT } from "@/lib/constants";
import { QueryError } from "@/components/QueryError";

type TimelineMode = "river" | "depth";

const typeStyles: Record<string, { color: string; bg: string; border: string }> = {
  verified: { color: "text-emerald-400", bg: "bg-emerald-500", border: "border-emerald-500/40" },
  disputed: { color: "text-amber-400", bg: "bg-amber-500", border: "border-amber-500/40" },
  unknown: { color: "text-slate-500", bg: "bg-slate-500", border: "border-slate-500/40" },
  redacted: { color: "text-red-500", bg: "bg-red-500", border: "border-red-500/40" },
  unverified: { color: "text-slate-500", bg: "bg-slate-500", border: "border-slate-500/40" },
  candidate: { color: "text-cyan-400", bg: "bg-cyan-500", border: "border-cyan-500/40" },
};

const depths = [
  { key: "surface", label: "SURFACE", subtitle: "Well-sourced, acknowledged facts", gradient: "from-cyan-500/20 to-cyan-600/5", borderColor: "border-cyan-500/30", textColor: "text-cyan-400" },
  { key: "shallow", label: "SHALLOW", subtitle: "Disputed claims with partial evidence", gradient: "from-blue-600/20 to-blue-700/5", borderColor: "border-blue-500/30", textColor: "text-blue-400" },
  { key: "deep", label: "DEEP", subtitle: "Speculation with minimal sourcing", gradient: "from-indigo-700/20 to-indigo-900/5", borderColor: "border-indigo-500/30", textColor: "text-indigo-400" },
  { key: "abyss", label: "THE ABYSS", subtitle: "Open questions — zero evidence", gradient: "from-slate-800/40 to-slate-950/20", borderColor: "border-slate-600/30", textColor: "text-slate-500" },
];

const statusColors: Record<string, string> = {
  verified: "text-emerald-400 border-emerald-500/30",
  disputed: "text-amber-400 border-amber-500/30",
  speculative: "text-indigo-400 border-indigo-500/30",
  unknown: "text-slate-500 border-slate-600/30",
  alleged: "text-amber-400 border-amber-500/30",
  unsupported: "text-slate-500 border-slate-600/30",
  retracted: "text-red-400 border-red-500/30",
  open: "text-slate-500 border-slate-600/30",
  confirmed: "text-emerald-400 border-emerald-500/30",
  debunked: "text-red-400 border-red-500/30",
};

function useTimelineEvents() {
  useRealtimeInvalidation();
  return useQuery({
    queryKey: ["timeline_events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("timeline_events").select("*").order("event_date", { ascending: true }).limit(LIST_LIMIT);
      if (error) throw error;
      return data || [];
    },
  });
}

function useClaims() {
  useRealtimeInvalidation();
  return useQuery({
    queryKey: ["claims_with_evidence"],
    queryFn: async () => {
      const { data: claims, error } = await supabase.from("claims").select("*, claim_evidence(evidence_id)").order("created_at", { ascending: false }).limit(LIST_LIMIT);
      if (error) throw error;
      return claims || [];
    },
  });
}

const Timeline = () => {
  const [mode, setMode] = useState<TimelineMode>("river");
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<TimelineEvent | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: intelEntries = [], isError: intelError, error: intelErr } = useIntelEntries();
  const { data: dbTimelineEvents = [], isError: timelineError, error: timelineErr, isLoading: timelineLoading } = useTimelineEvents();

  // Depth view state
  const [expandedDepth, setExpandedDepth] = useState<string | null>("surface");
  const [selectedIcebergItem, setSelectedIcebergItem] = useState<IcebergItem | null>(null);
  const { data: dbClaims = [], isError: claimsError, error: claimsErr } = useClaims();

  // River data
  const intelTimelineEvents: TimelineEvent[] = useMemo(() => {
    return intelEntries.filter((e) => e.published_at).map((e) => ({
      id: `intel-${e.id}`, title: e.title, date: e.published_at!.slice(0, 7),
      type: (e.fact_check_status === "verified" ? "verified" : e.fact_check_status === "disputed" ? "disputed" : "unknown") as TimelineEvent["type"],
      branch: "main", evidenceCount: e.credibility_score ? Math.round(e.credibility_score / 10) : 0,
      description: e.description || e.ai_summary || e.title,
    }));
  }, [intelEntries]);

  const dbEvents: TimelineEvent[] = useMemo(() => {
    return dbTimelineEvents.map((te: any) => ({
      id: `tl-${te.id}`, title: te.title, date: (te.event_date || "").slice(0, 7),
      type: (te.event_type === "verified" ? "verified" : te.event_type === "disputed" ? "disputed" : te.event_type === "redacted" ? "redacted" : "unknown") as TimelineEvent["type"],
      branch: te.branch || "main", evidenceCount: te.evidence_id ? 1 : 0, description: te.description || te.title,
    }));
  }, [dbTimelineEvents]);

  const allEvents = useMemo(() => {
    const combined = [...timelineData, ...dbEvents, ...intelTimelineEvents];
    const seen = new Set<string>();
    return combined.filter((e) => { const key = e.title.toLowerCase().slice(0, 30); if (seen.has(key)) return false; seen.add(key); return true; });
  }, [dbEvents, intelTimelineEvents]);

  const mainEvents = allEvents.filter((e) => e.branch === "main").sort((a, b) => a.date.localeCompare(b.date));
  const shadowEvents = allEvents.filter((e) => e.branch === "shadow").sort((a, b) => a.date.localeCompare(b.date));
  const liveCount = dbEvents.length + intelTimelineEvents.length;
  const eventWidth = 180 * zoom;
  const totalWidth = Math.max(mainEvents.length * eventWidth + 200, 1200);

  // Depth data
  const dbIcebergItems: IcebergItem[] = useMemo(() => {
    return dbClaims.map((claim: any) => {
      const evidenceCount = claim.claim_evidence?.length || 0;
      const label = claim.label || "alleged";
      let depth: IcebergItem["depth"];
      if (evidenceCount >= 5) depth = "surface";
      else if (evidenceCount >= 2) depth = "shallow";
      else if (evidenceCount >= 1) depth = "deep";
      else depth = "abyss";
      let status: IcebergItem["status"];
      if (label === "verified" || claim.status === "confirmed") status = "verified";
      else if (label === "disputed" || label === "retracted" || claim.status === "debunked") status = "disputed";
      else if (label === "unsupported" || label === "alleged") status = "speculative";
      else status = "unknown";
      return { id: `claim-${claim.id}`, title: claim.title, depth, evidenceCount, status, description: claim.content || claim.title };
    });
  }, [dbClaims]);

  const allIcebergItems = useMemo(() => [...icebergData, ...dbIcebergItems], [dbIcebergItems]);

  return (
    <div className="h-screen flex flex-col grid-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          {mode === "river" ? <Clock className="h-5 w-5 text-primary" /> : <Layers className="h-5 w-5 text-primary" />}
          <h1 className="text-sm tracking-widest text-primary text-glow-cyan">TIMELINE</h1>
          {liveCount > 0 && mode === "river" && <span className="font-mono text-[10px] text-emerald-400">+{liveCount} LIVE</span>}
          {dbIcebergItems.length > 0 && mode === "depth" && <span className="font-mono text-[10px] text-emerald-400">+{dbIcebergItems.length} LIVE</span>}
        </div>

        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex items-center gap-1 border border-border rounded-sm p-0.5">
            <button onClick={() => setMode("river")} className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-wider rounded-sm transition-all ${mode === "river" ? "bg-primary/20 text-primary border-glow-cyan border" : "text-muted-foreground hover:text-foreground"}`}>
              <Clock className="h-3 w-3" />RIVER
            </button>
            <button onClick={() => setMode("depth")} className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-wider rounded-sm transition-all ${mode === "depth" ? "bg-primary/20 text-primary border-glow-cyan border" : "text-muted-foreground hover:text-foreground"}`}>
              <Layers className="h-3 w-3" />DEPTH
            </button>
          </div>

          {mode === "river" && (
            <>
              {Object.entries(typeStyles).filter(([k]) => !["unverified", "candidate"].includes(k)).map(([type, style]) => (
                <div key={type} className="flex items-center gap-1 mr-2"><div className={`h-2 w-2 rounded-full ${style.bg}`} /><span className="font-mono text-[8px] text-muted-foreground tracking-wider">{type.toUpperCase()}</span></div>
              ))}
              <div className="h-4 w-px bg-border mx-2" />
              <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))} className="p-1 text-muted-foreground hover:text-foreground"><ZoomOut className="h-3.5 w-3.5" /></button>
              <span className="font-mono text-[9px] text-muted-foreground w-8 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => Math.min(2, z + 0.2))} className="p-1 text-muted-foreground hover:text-foreground"><ZoomIn className="h-3.5 w-3.5" /></button>
            </>
          )}
        </div>
      </div>

      {(intelError || timelineError || claimsError) && (
        <div className="px-6">
          <QueryError message={(intelErr || timelineErr || claimsErr)?.message} />
        </div>
      )}
      {timelineLoading && mode === "river" && (
        <p className="px-6 font-mono text-xs text-muted-foreground animate-pulse">LOADING TIMELINE...</p>
      )}

      {/* Content */}
      {mode === "river" ? (
        <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-8 relative">
          <div className="relative" style={{ width: totalWidth, minHeight: 400 }}>
            <div className="absolute h-0.5 bg-gradient-to-r from-cyan-500/60 via-primary/40 to-cyan-500/20" style={{ top: 160, left: 60, width: totalWidth - 120 }} />
            <div className="absolute h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" style={{ top: 280, left: 60, width: totalWidth - 120 }} />
            <span className="absolute font-mono text-[8px] text-amber-500/40 tracking-widest" style={{ top: 290, left: 60 }}>── SHADOW NARRATIVE ──</span>

            {mainEvents.map((event, i) => {
              const style = typeStyles[event.type] || typeStyles.unknown;
              const xPos = 80 + i * eventWidth;
              const isRedacted = event.type === "redacted";
              const isLive = event.id.startsWith("intel-") || event.id.startsWith("tl-");
              return (
                <motion.div key={event.id} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="absolute" style={{ left: xPos, top: 40 }}>
                  <div className="font-mono text-[9px] text-muted-foreground tracking-wider mb-2 text-center">{event.date}</div>
                  <button onClick={() => setSelected(event)} className={`border ${style.border} rounded-sm p-3 bg-card/60 hover:bg-card/90 transition-all text-left ${isRedacted ? "border-dashed" : ""} ${isLive ? "border-l-2 border-l-emerald-500/60" : ""}`} style={{ width: eventWidth - 20 }}>
                    <div className="flex items-center gap-1.5 mb-1.5"><div className={`h-1.5 w-1.5 rounded-full ${style.bg}`} /><span className={`font-mono text-[8px] tracking-widest ${style.color}`}>{event.type.toUpperCase()}</span>{isLive && <span className="font-mono text-[7px] tracking-widest text-emerald-400 ml-auto">LIVE</span>}</div>
                    <p className={`font-mono text-[10px] ${isRedacted ? "text-red-500/60" : "text-foreground"} leading-tight`}>{event.title}</p>
                    {event.evidenceCount > 0 && <div className="flex items-center gap-1 mt-1.5"><FileText className="h-2.5 w-2.5 text-muted-foreground/50" /><span className="font-mono text-[8px] text-muted-foreground">{event.evidenceCount}</span></div>}
                  </button>
                  <div className={`mx-auto w-px h-6 ${style.bg}/30`} style={{ width: 1 }} />
                  <div className={`mx-auto h-2 w-2 rounded-full ${style.bg} shadow-lg`} style={{ boxShadow: `0 0 6px ${style.bg === "bg-emerald-500" ? "#22c55e" : style.bg === "bg-amber-500" ? "#eab308" : style.bg === "bg-red-500" ? "#ef4444" : "#64748b"}40` }} />
                </motion.div>
              );
            })}

            {shadowEvents.map((event, i) => {
              const style = typeStyles[event.type] || typeStyles.unknown;
              const dateIndex = mainEvents.findIndex((m) => m.date >= event.date);
              const xPos = 80 + (dateIndex >= 0 ? dateIndex : mainEvents.length - 1) * eventWidth + eventWidth / 3;
              return (
                <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="absolute" style={{ left: xPos, top: 300 }}>
                  <button onClick={() => setSelected(event)} className={`border border-dashed ${style.border} rounded-sm p-2.5 bg-card/30 hover:bg-card/60 transition-all text-left`} style={{ width: eventWidth - 40 }}>
                    <div className="flex items-center gap-1.5 mb-1"><div className={`h-1.5 w-1.5 rounded-full ${style.bg} opacity-60`} /><span className={`font-mono text-[8px] tracking-widest ${style.color} opacity-60`}>{event.type.toUpperCase()} // {event.date}</span></div>
                    <p className="font-mono text-[9px] text-foreground/60 leading-tight">{event.title}</p>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Depth View */
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto py-6 px-6 relative">
            <div className="flex items-center gap-3 mb-6"><div className="h-px flex-1 bg-cyan-500/30" /><span className="font-mono text-[9px] text-cyan-400/60 tracking-widest">▼ PUBLIC KNOWLEDGE ▼</span><div className="h-px flex-1 bg-cyan-500/30" /></div>
            <div className="space-y-2">
              {depths.map((depth, di) => {
                const items = allIcebergItems.filter((i) => i.depth === depth.key);
                const isExpanded = expandedDepth === depth.key;
                return (
                  <motion.div key={depth.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: di * 0.15 }}>
                    <button onClick={() => setExpandedDepth(isExpanded ? null : depth.key)} className={`w-full border ${depth.borderColor} rounded-sm bg-gradient-to-b ${depth.gradient} p-4 text-left transition-all hover:brightness-110`} style={{ marginLeft: `${di * 8}px`, marginRight: `${di * 8}px`, width: `calc(100% - ${di * 16}px)` }}>
                      <div className="flex items-center justify-between">
                        <div><span className={`font-mono text-xs tracking-widest font-bold ${depth.textColor}`}>{depth.label}</span><span className="font-mono text-[10px] text-muted-foreground ml-3">{depth.subtitle}</span></div>
                        <div className="flex items-center gap-2"><span className={`font-mono text-[10px] ${depth.textColor}`}>{items.length} ITEMS</span><ChevronDown className={`h-3 w-3 ${depth.textColor} transition-transform ${isExpanded ? "rotate-180" : ""}`} /></div>
                      </div>
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden" style={{ marginLeft: `${di * 8 + 8}px`, marginRight: `${di * 8 + 8}px` }}>
                          <div className="space-y-1 pt-2">
                            {items.map((item) => {
                              const isLive = item.id.startsWith("claim-");
                              return (
                                <motion.button key={item.id} onClick={() => setSelectedIcebergItem(item)} className={`w-full text-left border ${depth.borderColor} rounded-sm p-3 bg-card/50 hover:bg-card/80 transition-all ${isLive ? "border-l-2 border-l-emerald-500/60" : ""}`} whileHover={{ x: 4 }}>
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                      <p className="font-mono text-[11px] text-foreground">{item.title}</p>
                                      <div className="flex items-center gap-3 mt-1.5">
                                        <span className={`font-mono text-[9px] tracking-wider border rounded-sm px-1.5 py-0.5 ${statusColors[item.status] || statusColors.unknown}`}>{item.status.toUpperCase()}</span>
                                        <span className="font-mono text-[9px] text-muted-foreground flex items-center gap-1"><FileText className="h-2.5 w-2.5" />{item.evidenceCount} sources</span>
                                        {isLive && <span className="font-mono text-[7px] tracking-widest text-emerald-400">LIVE</span>}
                                      </div>
                                    </div>
                                    <Eye className="h-3 w-3 text-muted-foreground/50 mt-1 shrink-0" />
                                  </div>
                                </motion.button>
                              );
                            })}
                            {items.length === 0 && <div className="py-3 text-center font-mono text-[10px] text-muted-foreground/40">No items at this depth</div>}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex items-center gap-3 mt-6"><div className="h-px flex-1 bg-slate-700/30" /><span className="font-mono text-[9px] text-slate-600 tracking-widest">▼ BEYOND KNOWN ▼</span><div className="h-px flex-1 bg-slate-700/30" /></div>
            <div className="mt-6 border border-accent/20 rounded-sm p-4 bg-accent/5 text-center">
              <AlertTriangle className="h-4 w-4 text-accent mx-auto mb-2" />
              <p className="font-mono text-[10px] text-muted-foreground tracking-wider">Depth placement is determined by evidence density, not truth.<br />Items near the surface have more citations — not more validity.</p>
            </div>
          </div>
        </div>
      )}

      {/* Detail modals */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="border border-border rounded-sm bg-card p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"><div className={`h-2 w-2 rounded-full ${(typeStyles[selected.type] || typeStyles.unknown).bg}`} /><span className={`font-mono text-[10px] tracking-widest ${(typeStyles[selected.type] || typeStyles.unknown).color}`}>{selected.type.toUpperCase()} // {selected.date}</span></div>
                <button onClick={() => setSelected(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <h3 className="font-mono text-sm font-bold text-foreground mb-2">{selected.title}</h3>
              <p className="font-mono text-[11px] text-muted-foreground mb-3">{selected.description}</p>
              <div className="flex items-center gap-4"><div className="flex items-center gap-1.5"><FileText className="h-3 w-3 text-primary" /><span className="font-mono text-[10px] text-primary">{selected.evidenceCount} SOURCES</span></div><span className="font-mono text-[9px] text-muted-foreground/50">BRANCH: {(selected.branch || "main").toUpperCase()}</span></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedIcebergItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setSelectedIcebergItem(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="border border-border rounded-sm bg-card p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <span className={`font-mono text-[10px] tracking-widest ${(statusColors[selectedIcebergItem.status] || statusColors.unknown)?.split(" ")[0]}`}>{selectedIcebergItem.status.toUpperCase()} // {selectedIcebergItem.depth.toUpperCase()}</span>
                <button onClick={() => setSelectedIcebergItem(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <h3 className="font-mono text-sm font-bold text-foreground mb-2">{selectedIcebergItem.title}</h3>
              <p className="font-mono text-[11px] text-muted-foreground mb-4">{selectedIcebergItem.description}</p>
              <div className="flex items-center gap-2"><FileText className="h-3 w-3 text-primary" /><span className="font-mono text-[10px] text-primary">{selectedIcebergItem.evidenceCount} LINKED SOURCES</span></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Timeline;
