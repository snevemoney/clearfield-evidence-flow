import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Archive,
  GitBranch,
  Clock,
  Layers,
  Search,
  MessageSquare,
  HelpCircle,
  Globe,
  Orbit,
  Rabbit,
  LogIn,
  Shield,
} from "lucide-react";

const navItems = [
  { path: "/", label: "DASHBOARD", icon: LayoutDashboard },
  { path: "/claims", label: "CLAIMS", icon: FileText },
  { path: "/evidence", label: "EVIDENCE", icon: Archive },
  { path: "/graph", label: "GRAPH", icon: GitBranch },
  { path: "/globe", label: "GLOBE", icon: Globe },
  { path: "/nexus", label: "THE NEXUS", icon: Orbit },
  { path: "/rabbit-hole", label: "RABBIT HOLE", icon: Rabbit },
  { path: "/timeline", label: "TIMELINE", icon: Clock },
  { path: "/iceberg", label: "DEPTH VIEW", icon: Layers },
  { path: "/search", label: "SEARCH", icon: Search },
  { path: "/notes", label: "CONTEXT NOTES", icon: MessageSquare },
  { path: "/unknowns", label: "UNKNOWNS", icon: HelpCircle },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <Shield className="h-6 w-6 text-primary" />
        <span className="font-mono text-sm font-bold tracking-widest text-primary text-glow-cyan">
          CLEARFIELD
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-sm px-3 py-2 mb-0.5 font-mono text-xs tracking-wider transition-all ${
                isActive
                  ? "bg-primary/10 text-primary border-glow-cyan border"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-2 py-3">
        <Link
          to="/auth"
          className="flex items-center gap-3 rounded-sm px-3 py-2 font-mono text-xs tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        >
          <LogIn className="h-4 w-4" />
          ACCESS TERMINAL
        </Link>
        <div className="mt-3 px-3 font-mono text-[10px] text-muted-foreground/50 tracking-wider">
          v0.1.0 // UNCLASSIFIED
        </div>
      </div>
    </aside>
  );
}
