import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import CaseFile from "./pages/CaseFile";
import Annotations from "./pages/Annotations";
import Visualize from "./pages/Visualize";
import Timeline from "./pages/Timeline";
import SearchPage from "./pages/SearchPage";
import BridgeImport from "./pages/BridgeImport";
import RabbitHolePage from "./pages/RabbitHolePage";
import Auth from "./pages/Auth";
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
            <Route path="/casefile" element={<CaseFile />} />
            <Route path="/annotations" element={<Annotations />} />
            <Route path="/visualize" element={<Visualize />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/import" element={<BridgeImport />} />
            <Route path="/rabbit-hole" element={<RabbitHolePage />} />
          </Route>
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
