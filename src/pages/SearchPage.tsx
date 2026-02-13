import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const SearchPage = () => {
  return (
    <div className="min-h-screen p-6 grid-bg">
      <div className="flex items-center gap-3 mb-6">
        <Search className="h-6 w-6 text-primary" />
        <h1 className="text-xl tracking-widest text-primary text-glow-cyan">SEARCH & DISCOVERY</h1>
      </div>

      <div className="max-w-2xl mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search claims, evidence, notes..."
            className="pl-10 font-mono text-xs bg-card border-border focus:border-primary"
          />
        </div>
      </div>

      <div className="border border-border rounded-sm bg-card p-8 flex flex-col items-center justify-center min-h-[300px]">
        <Search className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <p className="font-mono text-xs text-muted-foreground tracking-wider">
          ENTER QUERY TO BEGIN SEARCH
        </p>
      </div>
    </div>
  );
};

export default SearchPage;
