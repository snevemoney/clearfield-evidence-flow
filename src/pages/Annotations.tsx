import { MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnknownsPanel } from "@/components/annotations/UnknownsPanel";
import { ContextNotesPanel } from "@/components/annotations/ContextNotesPanel";

const Annotations = () => {
  return (
    <div className="min-h-screen grid-bg">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card/80 backdrop-blur-sm">
        <MessageSquare className="h-5 w-5 text-accent" />
        <h1 className="text-sm tracking-widest text-accent">ANNOTATIONS</h1>
        <span className="font-mono text-[10px] text-muted-foreground ml-2">// UNKNOWNS · CONTEXT NOTES</span>
      </div>

      <Tabs defaultValue="unknowns" className="w-full">
        <div className="px-6 pt-3 border-b border-border bg-card/50">
          <TabsList className="bg-transparent gap-1 h-auto p-0">
            <TabsTrigger value="unknowns" className="font-mono text-[10px] tracking-widest data-[state=active]:bg-accent/10 data-[state=active]:text-accent data-[state=active]:border data-[state=active]:border-accent/30 rounded-sm px-4 py-2">
              UNKNOWNS
            </TabsTrigger>
            <TabsTrigger value="notes" className="font-mono text-[10px] tracking-widest data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/30 rounded-sm px-4 py-2">
              CONTEXT NOTES
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="unknowns" className="mt-0"><UnknownsPanel /></TabsContent>
        <TabsContent value="notes" className="mt-0"><ContextNotesPanel /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Annotations;
