import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Claims from "./pages/Claims";
import Evidence from "./pages/Evidence";
import Graph from "./pages/Graph";
import Timeline from "./pages/Timeline";
import IcebergExplorer from "./pages/IcebergExplorer";
import SearchPage from "./pages/SearchPage";
import ContextNotes from "./pages/ContextNotes";
import Unknowns from "./pages/Unknowns";
import Auth from "./pages/Auth";
import GlobePage from "./pages/GlobePage";
import NexusPage from "./pages/NexusPage";
import RabbitHolePage from "./pages/RabbitHolePage";
import BridgeImport from "./pages/BridgeImport";
import Contradictions from "./pages/Contradictions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/claims" element={<Claims />} />
            <Route path="/evidence" element={<Evidence />} />
            <Route path="/graph" element={<Graph />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/iceberg" element={<IcebergExplorer />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/notes" element={<ContextNotes />} />
            <Route path="/unknowns" element={<Unknowns />} />
            <Route path="/globe" element={<GlobePage />} />
            <Route path="/nexus" element={<NexusPage />} />
            <Route path="/rabbit-hole" element={<RabbitHolePage />} />
            <Route path="/import" element={<BridgeImport />} />
            <Route path="/contradictions" element={<Contradictions />} />
          </Route>
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
