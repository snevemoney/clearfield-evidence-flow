import { useState } from "react";
import { Shield, Terminal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center grid-bg p-6">
      <div className="w-full max-w-md">
        <div className="border border-border rounded-sm bg-card overflow-hidden">
          {/* Header */}
          <div className="border-b border-border px-6 py-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-mono text-xs tracking-widest text-primary text-glow-cyan">
              {isLogin ? "ACCESS TERMINAL" : "REQUEST ACCESS"}
            </span>
            <Terminal className="h-4 w-4 text-muted-foreground ml-auto" />
          </div>

          {/* Form */}
          <div className="p-6 space-y-4">
            {!isLogin && (
              <div>
                <label className="font-mono text-[10px] tracking-widest text-muted-foreground block mb-1.5">
                  HANDLE (PSEUDONYMOUS)
                </label>
                <Input
                  placeholder="agent_codename"
                  className="font-mono text-xs bg-secondary border-border"
                />
              </div>
            )}
            <div>
              <label className="font-mono text-[10px] tracking-widest text-muted-foreground block mb-1.5">
                EMAIL
              </label>
              <Input
                type="email"
                placeholder="operative@clearfield.io"
                className="font-mono text-xs bg-secondary border-border"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] tracking-widest text-muted-foreground block mb-1.5">
                PASSPHRASE
              </label>
              <Input
                type="password"
                placeholder="••••••••••••"
                className="font-mono text-xs bg-secondary border-border"
              />
            </div>

            <Button className="w-full font-mono text-xs tracking-widest">
              {isLogin ? "AUTHENTICATE" : "CREATE ACCESS"}
            </Button>

            <button
              onClick={() => setIsLogin(!isLogin)}
              className="w-full text-center font-mono text-[10px] text-muted-foreground hover:text-primary transition-colors tracking-wider"
            >
              {isLogin ? "NO ACCESS? REQUEST CREDENTIALS →" : "← RETURN TO LOGIN"}
            </button>
          </div>

          {/* Footer */}
          <div className="border-t border-border px-6 py-3">
            <p className="font-mono text-[9px] text-muted-foreground/40 text-center tracking-wider">
              ALL ACCESS IS PSEUDONYMOUS // HANDLES, NOT NAMES
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
