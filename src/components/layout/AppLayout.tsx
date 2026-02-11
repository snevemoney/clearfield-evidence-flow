import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-56 min-h-screen">
        {/* Scanline overlay */}
        <div className="pointer-events-none fixed inset-0 z-50 scanline opacity-30" />
        <div className="relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
