import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CitationExportProps {
  type: "evidence" | "claims";
}

function formatAPA(item: { title: string; author?: string | null; published_date?: string | null; url?: string | null }): string {
  const author = item.author || "Unknown Author";
  const year = item.published_date ? new Date(item.published_date).getFullYear() : "n.d.";
  const url = item.url ? ` Retrieved from ${item.url}` : "";
  return `${author} (${year}). ${item.title}.${url}`;
}

export function CitationExport({ type }: CitationExportProps) {
  const { data: evidence = [] } = useQuery({
    queryKey: ["evidence"],
    queryFn: async () => {
      const { data, error } = await supabase.from("evidence").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: type === "evidence",
  });

  const { data: claims = [] } = useQuery({
    queryKey: ["claims"],
    queryFn: async () => {
      const { data, error } = await supabase.from("claims").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: type === "claims",
  });

  const exportCitations = () => {
    let text = `CLEARFIELD — ${type.toUpperCase()} EXPORT\nGenerated: ${new Date().toISOString()}\n${"=".repeat(60)}\n\n`;

    if (type === "evidence") {
      text += "CITATIONS (APA FORMAT)\n\n";
      evidence.forEach((e, i) => {
        text += `${i + 1}. ${formatAPA(e)}\n\n`;
      });
      text += `\n${"=".repeat(60)}\nCASE BRIEF SUMMARY\n\n`;
      text += `Total evidence objects: ${evidence.length}\n`;
      const byType: Record<string, number> = {};
      evidence.forEach((e) => { byType[e.source_type] = (byType[e.source_type] || 0) + 1; });
      Object.entries(byType).forEach(([k, v]) => { text += `  ${k}: ${v}\n`; });
    } else {
      text += "CLAIMS REGISTER\n\n";
      claims.forEach((c, i) => {
        text += `${i + 1}. [${c.label.toUpperCase()}] ${c.title}\n   ${c.content}\n   Status: ${c.status} | Filed: ${new Date(c.created_at).toLocaleDateString()}\n\n`;
      });
    }

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clearfield-${type}-export-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${type} citations downloaded.` });
  };

  const itemCount = type === "evidence" ? evidence.length : claims.length;

  if (itemCount === 0) return null;

  return (
    <Button variant="outline" onClick={exportCitations} className="font-mono text-xs tracking-wider gap-2">
      <Download className="h-4 w-4" />
      EXPORT CITATIONS
    </Button>
  );
}
