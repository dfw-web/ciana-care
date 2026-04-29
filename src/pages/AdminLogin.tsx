import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import cianaLogo from "@/assets/ciana-logo.png";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot-password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/admin/dashboard", { replace: true });
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError || !data.session) {
      setLoading(false);
      setError("Invalid email or password. Please try again.");
      return;
    }

    // Post-login role guard: block accounts with no admin/owner/staff role
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);

    const roles = (roleRows || []).map((r) => r.role as string);
    const allowed = roles.includes("owner") || roles.includes("admin") || roles.includes("staff");

    if (!allowed) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("Your account is not authorized. Ask an owner to grant you access.");
      return;
    }

    setLoading(false);
    navigate("/admin/dashboard", { replace: true });
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg(null);
    setForgotLoading(true);
    const { error: rErr } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    setForgotLoading(false);
    if (rErr) {
      setForgotMsg({ type: "err", text: rErr.message });
      return;
    }
    setForgotMsg({
      type: "ok",
      text: "If an account exists for that email, a reset link has been sent. Check your inbox.",
    });
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="bg-background border-b border-border">
        <div className="container flex h-16 items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <img src={cianaLogo} alt="Ciana Diagnostics" className="h-16 w-auto mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-foreground">Admin Login</h1>
            <p className="text-muted-foreground mt-1 text-sm">Sign in to manage patient records.</p>
          </div>

          {!forgotOpen ? (
            <form onSubmit={handleLogin} className="bg-background rounded-xl border border-border shadow-sm p-6 space-y-4">
              <div>
                <label htmlFor="email" className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@ciana.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
                  <button
                    type="button"
                    onClick={() => { setForgotOpen(true); setForgotEmail(email); setForgotMsg(null); }}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-sm text-destructive font-medium">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleForgot} className="bg-background rounded-xl border border-border shadow-sm p-6 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Reset password</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your admin email — we'll send a reset link.
                </p>
              </div>
              <div>
                <label htmlFor="femail" className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <Input
                  id="femail"
                  type="email"
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>

              {forgotMsg && (
                <p className={`text-sm font-medium ${forgotMsg.type === "ok" ? "text-foreground" : "text-destructive"}`}>
                  {forgotMsg.text}
                </p>
              )}

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setForgotOpen(false)}>
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={forgotLoading}>
                  {forgotLoading ? "Sending…" : "Send reset link"}
                </Button>
              </div>
            </form>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default AdminLogin;
