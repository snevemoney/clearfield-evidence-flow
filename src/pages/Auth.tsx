import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Terminal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!email.trim() || password.length < 6) {
      setError("Email and a passphrase of at least 6 characters are required.");
      return;
    }
    if (!isLogin && !handle.trim()) {
      setError("Handle is required to request access.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
        navigate("/");
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (signUpError) throw signUpError;
      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: data.user.id,
          handle: handle.trim(),
        });
        if (profileError) console.error("profile insert:", profileError);
      }
      if (!data.session) {
        toast({
          title: "Confirm email",
          description: "Check your inbox to finish creating access.",
        });
        return;
      }
      navigate("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center grid-bg p-6">
      <div className="w-full max-w-md">
        <div className="border border-border rounded-sm bg-card overflow-hidden">
          <div className="border-b border-border px-6 py-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-mono text-xs tracking-widest text-primary text-glow-cyan">
              {isLogin ? "ACCESS TERMINAL" : "REQUEST ACCESS"}
            </span>
            <Terminal className="h-4 w-4 text-muted-foreground ml-auto" />
          </div>

          <form
            className="p-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            {!isLogin && (
              <div>
                <label className="font-mono text-[10px] tracking-widest text-muted-foreground block mb-1.5">
                  HANDLE (PSEUDONYMOUS)
                </label>
                <Input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="font-mono text-xs bg-secondary border-border"
              />
            </div>

            {error && (
              <p className="font-mono text-[10px] text-destructive" role="alert">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="w-full font-mono text-xs tracking-widest">
              {loading ? "WORKING..." : isLogin ? "AUTHENTICATE" : "CREATE ACCESS"}
            </Button>

            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className="w-full text-center font-mono text-[10px] text-muted-foreground hover:text-primary transition-colors tracking-wider"
            >
              {isLogin ? "NO ACCESS? REQUEST CREDENTIALS →" : "← RETURN TO LOGIN"}
            </button>
          </form>

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
