import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Rabbit, ChevronDown, Loader2, AlertTriangle, BookOpen, HelpCircle, MessageSquare, GitFork, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Fork {
  label: string;
  description: string;
}

interface Layer {
  title: string;
  depth: number;
  known: string;
  disputed: string;
  unknown: string;
  forks: Fork[];
}

interface PathEntry {
  layer: Layer;
  chosenFork?: string;
}

const STARTER_TOPICS = [
  "NSA Mass Surveillance Programs",
  "Five Eyes Intelligence Alliance",
  "DARPA and the Origins of the Internet",
  "Federal Reserve System",
  "Cambridge Analytica Scandal",
  "MKUltra Program",
  "Pentagon Papers",
  "Operation Paperclip",
];

const RabbitHolePage = () => {
  const [path, setPath] = useState<PathEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-start from query param
  useEffect(() => {
    const topic = searchParams.get("topic");
    if (topic && path.length === 0 && !isLoading) {
      setSearchParams({}, { replace: true });
      setCustomTopic(topic);
      generateLayer(topic);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const generateLayer = useCallback(async (topic: string, parentLayer?: Layer, direction?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("rabbit-hole", {
        body: { topic, parentLayer, direction },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: "AI Error", description: data.error, variant: "destructive" });
        return;
      }

      const layer = data.layer as Layer;
      if (parentLayer && direction) {
        setPath((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], chosenFork: direction };
          return [...updated, { layer }];
        });
      } else {
        setPath([{ layer }]);
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "Failed to generate layer", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startTopic = (topic: string) => generateLayer(topic);

  const chooseFork = (fork: Fork) => {
    const currentLayer = path[path.length - 1]?.layer;
    if (currentLayer) {
      generateLayer("", currentLayer, fork.label);
    }
  };

  const reset = () => {
    setPath([]);
    setCustomTopic("");
  };

  const jumpToLayer = (index: number) => {
    setPath((prev) => prev.slice(0, index + 1));
  };

  return (
    <div className="h-screen flex flex-col grid-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <Rabbit className="h-5 w-5 text-primary" />
          <h1 className="text-sm tracking-widest text-primary text-glow-cyan">RABBIT HOLE</h1>
          <span className="font-mono text-[10px] text-muted-foreground ml-2">
            // AI-GUIDED DEEP DIVE
          </span>
        </div>
        {path.length > 0 && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-mono text-[10px] tracking-wider border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <RotateCcw className="h-3 w-3" />
            NEW TOPIC
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Topic selection */}
        {path.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <Rabbit className="h-12 w-12 text-primary mx-auto mb-4 opacity-60" />
              <h2 className="font-mono text-lg text-foreground tracking-wider mb-2">CHOOSE YOUR RABBIT HOLE</h2>
              <p className="font-mono text-[11px] text-muted-foreground max-w-md mx-auto">
                Select a topic to begin an AI-guided investigation. Each layer reveals what's known,
                what's disputed, and what remains unknown — with branching paths to explore deeper.
              </p>
            </div>

            {/* Custom topic input */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && customTopic.trim() && startTopic(customTopic.trim())}
                placeholder="Enter a custom topic..."
                className="flex-1 bg-secondary/50 border border-border rounded-sm px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-all"
              />
              <button
                onClick={() => customTopic.trim() && startTopic(customTopic.trim())}
                disabled={!customTopic.trim()}
                className="px-4 py-2 rounded-sm font-mono text-[10px] tracking-wider bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                DIVE IN
              </button>
            </div>

            {/* Starter topics */}
            <div className="grid grid-cols-2 gap-2">
              {STARTER_TOPICS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => startTopic(topic)}
                  className="text-left border border-border rounded-sm p-3 bg-card/50 hover:bg-secondary/50 hover:border-primary/30 transition-all group"
                >
                  <span className="font-mono text-[11px] text-foreground group-hover:text-primary transition-colors">
                    {topic}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Breadcrumb */}
        {path.length > 0 && (
          <div className="flex items-center gap-1 mb-6 font-mono text-[9px] text-muted-foreground/60 flex-wrap">
            <span className="text-primary">START</span>
            {path.map((entry, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="mx-0.5">→</span>
                <button
                  onClick={() => jumpToLayer(i)}
                  className={`hover:text-primary transition-colors ${i === path.length - 1 ? "text-primary" : ""}`}
                >
                  {entry.layer.title.toUpperCase()}
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Depth indicator */}
        {path.length > 0 && (
          <div className="flex items-center gap-2 mb-6">
            <span className="font-mono text-[9px] text-muted-foreground tracking-wider">DEPTH:</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="h-2 w-4 rounded-sm transition-all"
                  style={{
                    backgroundColor: i < (path[path.length - 1]?.layer.depth || 1)
                      ? `hsl(${180 - i * 15}, 80%, ${55 - i * 3}%)`
                      : "rgba(100,116,139,0.15)",
                  }}
                />
              ))}
            </div>
            <span className="font-mono text-[9px] text-muted-foreground">
              LEVEL {path[path.length - 1]?.layer.depth || 1}/10
            </span>
          </div>
        )}

        {/* Layers */}
        <div className="max-w-2xl mx-auto space-y-4">
          <AnimatePresence>
            {path.map((entry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="border border-border rounded-sm backdrop-blur-sm overflow-hidden"
                style={{ backgroundColor: `hsl(220 25% ${Math.max(3, 8 - entry.layer.depth * 0.5)}% / 0.85)` }}
              >
                {/* Layer header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80">
                  <div className="flex items-center gap-2">
                    <ChevronDown className="h-3 w-3 text-primary" />
                    <span className="font-mono text-xs font-bold text-foreground">{entry.layer.title}</span>
                  </div>
                  <span className="font-mono text-[9px] text-muted-foreground">DEPTH {entry.layer.depth}</span>
                </div>

                {/* Layer content */}
                <div className="p-4 space-y-4">
                  {/* Known */}
                  <div className="border-l-2 border-green-500/50 pl-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <BookOpen className="h-3 w-3 text-green-400" />
                      <span className="font-mono text-[9px] tracking-widest text-green-400">DOCUMENTED</span>
                    </div>
                    <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">{entry.layer.known}</p>
                  </div>

                  {/* Disputed */}
                  <div className="border-l-2 border-amber-500/50 pl-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MessageSquare className="h-3 w-3 text-amber-400" />
                      <span className="font-mono text-[9px] tracking-widest text-amber-400">DISPUTED</span>
                    </div>
                    <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">{entry.layer.disputed}</p>
                  </div>

                  {/* Unknown */}
                  <div className="border-l-2 border-red-500/50 pl-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <HelpCircle className="h-3 w-3 text-red-400" />
                      <span className="font-mono text-[9px] tracking-widest text-red-400">UNKNOWN</span>
                    </div>
                    <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">{entry.layer.unknown}</p>
                  </div>

                  {/* Forks — only show on the last layer */}
                  {index === path.length - 1 && !isLoading && (
                    <div className="pt-2">
                      <div className="flex items-center gap-1.5 mb-2">
                        <GitFork className="h-3 w-3 text-primary" />
                        <span className="font-mono text-[9px] tracking-widest text-primary">CHOOSE YOUR PATH</span>
                      </div>
                      <div className="grid gap-2">
                        {entry.layer.forks.map((fork, fi) => (
                          <button
                            key={fi}
                            onClick={() => chooseFork(fork)}
                            className="text-left border border-border rounded-sm p-3 bg-secondary/20 hover:bg-primary/10 hover:border-primary/30 transition-all group"
                          >
                            <div className="flex items-center gap-2 mb-0.5">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary group-hover:shadow-[0_0_6px_rgba(0,229,255,0.6)]" />
                              <span className="font-mono text-[10px] font-bold text-foreground group-hover:text-primary transition-colors">
                                {fork.label}
                              </span>
                            </div>
                            <p className="font-mono text-[9px] text-muted-foreground ml-3.5">{fork.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chosen fork indicator for past layers */}
                  {entry.chosenFork && index < path.length - 1 && (
                    <div className="flex items-center gap-2 pt-1 opacity-60">
                      <GitFork className="h-3 w-3 text-primary" />
                      <span className="font-mono text-[9px] text-primary tracking-wider">
                        CHOSE: {entry.chosenFork}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading state */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <Loader2 className="h-6 w-6 text-primary animate-spin mb-3" />
              <span className="font-mono text-[10px] text-muted-foreground tracking-wider">
                GENERATING EXPLORATION LAYER...
              </span>
              <span className="font-mono text-[9px] text-muted-foreground/50 mt-1">
                AI is analyzing publicly documented sources
              </span>
            </motion.div>
          )}
        </div>

        {/* Watermark */}
        <div className="text-center mt-12 font-mono text-[9px] text-muted-foreground/30 tracking-widest">
          CLEARFIELD // RABBIT HOLE NAVIGATOR // AI-GUIDED EXPLORATION
        </div>

        {/* Disclaimer */}
        {path.length > 0 && (
          <div className="max-w-2xl mx-auto mt-6 mb-8 border border-accent/20 rounded-sm p-3 bg-accent/5">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3 w-3 text-accent" />
              <span className="font-mono text-[9px] text-accent tracking-wider">AI CONTENT NOTICE</span>
            </div>
            <p className="font-mono text-[9px] text-muted-foreground">
              Layers are AI-generated based on publicly available information. Always verify claims
              against primary sources. AI may occasionally misattribute or oversimplify complex topics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RabbitHolePage;
