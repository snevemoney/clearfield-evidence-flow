import { motion } from "framer-motion";
import { Shield, FileText, Archive, HelpCircle, Activity, AlertTriangle, Eye } from "lucide-react";

const stats = [
  { label: "ACTIVE CLAIMS", value: "0", icon: FileText, color: "text-primary" },
  { label: "EVIDENCE OBJECTS", value: "0", icon: Archive, color: "text-success" },
  { label: "OPEN QUESTIONS", value: "0", icon: HelpCircle, color: "text-accent" },
  { label: "CONTEXT NOTES", value: "0", icon: Activity, color: "text-muted-foreground" },
];

const Index = () => {
  return (
    <div className="min-h-screen p-6 grid-bg">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-widest text-primary text-glow-cyan">
            CLEARFIELD
          </h1>
        </div>
        <p className="font-mono text-xs tracking-wider text-muted-foreground max-w-2xl">
          OPEN CIVIC INTELLIGENCE & EVIDENCE PLATFORM — Credibility through structure, not authority.
          The platform remains neutral. Users speak. Truth emerges through evidence and open challenge.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="border border-border rounded-sm bg-card p-4 hover:border-glow-cyan transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
                {stat.label}
              </span>
            </div>
            <div className={`font-mono text-3xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Grid: Feed + What We Don't Know */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Feed */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 border border-border rounded-sm bg-card"
        >
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="font-mono text-xs tracking-widest text-primary">LIVE FEED</h2>
            <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
          </div>
          <div className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
            <Eye className="h-10 w-10 text-muted-foreground/30 mb-4" />
            <p className="font-mono text-xs text-muted-foreground tracking-wider">
              NO ACTIVITY RECORDED
            </p>
            <p className="font-mono text-[10px] text-muted-foreground/50 mt-1 tracking-wider">
              Submit claims and evidence to populate the feed
            </p>
          </div>
        </motion.div>

        {/* What We Don't Know Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="border border-border rounded-sm bg-card border-l-2 border-l-accent"
        >
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-accent" />
            <h2 className="font-mono text-xs tracking-widest text-accent">
              WHAT WE DON'T KNOW
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {["KNOWN FACTS", "DISPUTED CLAIMS", "UNKNOWNS", "MISSING DOCUMENTS", "REDACTIONS", "OPEN QUESTIONS"].map(
              (section) => (
                <div key={section} className="border border-border rounded-sm p-3 bg-secondary/30">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
                      {section}
                    </span>
                    <span className="font-mono text-[10px] text-accent">0</span>
                  </div>
                </div>
              )
            )}
            <p className="font-mono text-[10px] text-muted-foreground/50 text-center tracking-wider mt-4">
              This panel is mandatory on every topic.
              <br />
              Gaps in knowledge are features, not bugs.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Mission Statement */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 border border-border rounded-sm bg-card p-6 text-center"
      >
        <p className="font-mono text-xs text-muted-foreground tracking-wider max-w-3xl mx-auto leading-relaxed">
          "Users speak. The platform structures. The AI never accuses."
          <br />
          <span className="text-primary">
            CLEARFIELD does not decide truth, assert facts, or identify perpetrators.
          </span>
          <br />
          It provides structure, permanence, and context so that truth can emerge through open challenge and evidence.
        </p>
      </motion.div>
    </div>
  );
};

export default Index;
