import { FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClaimsPanel } from "@/components/casefile/ClaimsPanel";
import { EvidencePanel } from "@/components/casefile/EvidencePanel";
import { ContradictionsPanel } from "@/components/casefile/ContradictionsPanel";

const CaseFile = () => {
  return (
    <div className="min-h-screen grid-bg">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card/80 backdrop-blur-sm">
        <FileText className="h-5 w-5 text-primary" />
        <h1 className="text-sm tracking-widest text-primary text-glow-cyan">CASE FILE</h1>
        <span className="font-mono text-[10px] text-muted-foreground ml-2">// CLAIMS · EVIDENCE · CONTRADICTIONS</span>
      </div>

      <Tabs defaultValue="claims" className="w-full">
        <div className="px-6 pt-3 border-b border-border bg-card/50">
          <TabsList className="bg-transparent gap-1 h-auto p-0">
            <TabsTrigger value="claims" className="font-mono text-[10px] tracking-widest data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/30 rounded-sm px-4 py-2">
              CLAIMS
            </TabsTrigger>
            <TabsTrigger value="evidence" className="font-mono text-[10px] tracking-widest data-[state=active]:bg-success/10 data-[state=active]:text-success data-[state=active]:border data-[state=active]:border-success/30 rounded-sm px-4 py-2">
              EVIDENCE
            </TabsTrigger>
            <TabsTrigger value="contradictions" className="font-mono text-[10px] tracking-widest data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive data-[state=active]:border data-[state=active]:border-destructive/30 rounded-sm px-4 py-2">
              CONTRADICTIONS
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="claims" className="mt-0"><ClaimsPanel /></TabsContent>
        <TabsContent value="evidence" className="mt-0"><EvidencePanel /></TabsContent>
        <TabsContent value="contradictions" className="mt-0"><ContradictionsPanel /></TabsContent>
      </Tabs>
    </div>
  );
};

export default CaseFile;
