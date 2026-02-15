import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle, AlertOctagon, CircleDot, ExternalLink,
  Globe, Network, Compass, MapPin, Calendar, Clock,
  Brain, Tag, Users, Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { IntelEntry } from "@/hooks/use-intel-data";

interface IntelDetailModalProps {
  entry: IntelEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<string, { icon: typeof CheckCircle; class: string; label: string }> = {
  verified: { icon: CheckCircle, class: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10", label: "VERIFIED" },
  disputed: { icon: AlertOctagon, class: "text-amber-400 border-amber-500/40 bg-amber-500/10", label: "DISPUTED" },
  unverified: { icon: CircleDot, class: "text-slate-400 border-slate-500/40 bg-slate-500/10", label: "UNVERIFIED" },
};

export function IntelDetailModal({ entry, open, onOpenChange }: IntelDetailModalProps) {
  const navigate = useNavigate();

  if (!entry) return null;

  const status = statusConfig[entry.fact_check_status] || statusConfig.unverified;
  const StatusIcon = status.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-border bg-card font-mono p-0 gap-0 max-h-[85vh]">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[9px] tracking-widest px-2 py-0.5 rounded-sm border ${status.class}`}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
            <span className="text-[9px] tracking-widest text-muted-foreground px-2 py-0.5 rounded-sm border border-border bg-secondary/40">
              {(entry.category ?? "unknown").toUpperCase()}
            </span>
            <span className="text-[9px] tracking-widest text-muted-foreground px-2 py-0.5 rounded-sm border border-border bg-secondary/40">
              {(entry.source_type ?? "unknown").toUpperCase()}
            </span>
            {entry.credibility_score != null && (
              <span className="text-[9px] tracking-widest text-primary ml-auto">
                <Shield className="h-3 w-3 inline mr-0.5" />
                {entry.credibility_score}%
              </span>
            )}
          </div>
          <DialogTitle className="text-sm text-foreground leading-snug">{entry.title}</DialogTitle>
          <DialogDescription className="sr-only">Intel entry details</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[55vh]">
          <div className="px-5 py-4 space-y-4">
            {/* Description */}
            {entry.description && (
              <p className="text-[11px] text-muted-foreground leading-relaxed">{entry.description}</p>
            )}

            {/* AI Summary */}
            {entry.ai_summary && (
              <div className="border border-border rounded-sm p-3 bg-secondary/20">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Brain className="h-3 w-3 text-primary" />
                  <span className="text-[9px] tracking-widest text-primary">AI SUMMARY</span>
                </div>
                <p className="text-[11px] text-foreground/80 leading-relaxed">{entry.ai_summary}</p>
              </div>
            )}

            {/* Source URL */}
            {entry.source_url && (
              <a
                href={entry.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border border-primary/30 rounded-sm px-3 py-2 bg-primary/5 hover:bg-primary/10 transition-colors group"
              >
                <ExternalLink className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] tracking-widest text-primary group-hover:underline">SOURCE</span>
                <span className="text-[9px] text-muted-foreground truncate ml-1">{entry.source_url}</span>
              </a>
            )}

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[9px] tracking-widest text-muted-foreground">TAGS</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {entry.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[9px] tracking-wider font-normal rounded-sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Related Entities */}
            {entry.related_entities && entry.related_entities.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[9px] tracking-widest text-muted-foreground">RELATED ENTITIES</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {entry.related_entities.map((entity) => (
                    <Badge key={entity} variant="secondary" className="text-[9px] tracking-wider font-normal rounded-sm">
                      {entity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata row */}
            <div className="grid grid-cols-2 gap-3 text-[10px] text-muted-foreground">
              {entry.lat != null && entry.lng != null && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-primary" />
                  <span>{entry.lat.toFixed(4)}, {entry.lng.toFixed(4)}</span>
                </div>
              )}
              {entry.published_at && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(entry.published_at).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                <span>Ingested {new Date(entry.ingested_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer — cross-reference buttons */}
        <div className="border-t border-border px-5 py-3 flex flex-wrap gap-2">
          {entry.lat != null && entry.lng != null && (
            <Button
              variant="outline"
              size="sm"
              className="text-[9px] tracking-widest h-7 gap-1.5"
              onClick={() => { onOpenChange(false); navigate(`/visualize?mode=globe&lat=${entry.lat}&lng=${entry.lng}`); }}
            >
              <Globe className="h-3 w-3" /> VIEW ON GLOBE
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-[9px] tracking-widest h-7 gap-1.5"
            onClick={() => { onOpenChange(false); navigate(`/visualize?mode=nexus&focus=${entry.id}`); }}
          >
            <Compass className="h-3 w-3" /> EXPLORE NEXUS
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-[9px] tracking-widest h-7 gap-1.5"
            onClick={() => { onOpenChange(false); navigate(`/visualize?mode=graph&focus=${entry.id}`); }}
          >
            <Network className="h-3 w-3" /> VIEW ON GRAPH
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-[9px] tracking-widest h-7 gap-1.5"
            onClick={() => { onOpenChange(false); navigate(`/rabbit-hole?entryId=${entry.id}`); }}
          >
            <Brain className="h-3 w-3" /> RABBIT HOLE
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
