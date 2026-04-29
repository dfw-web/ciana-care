import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import cianaLogo from "@/assets/ciana-logo.png";

const AdminResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // The Supabase JS client automatically picks up the recovery token from the URL
  // hash and emits a PASSWORD_RECOVERY event. We just need to wait for a session.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateErr) return setError(updateErr.message);
    setSuccess(true);
    setTimeout(async () => {
      await supabase.auth.signOut();
      navigate("/admin", { replace: true });
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="bg-background border-b border-border">
        <div className="container flex h-16 items-center gap-4">
          <Link to="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Login</span>
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
            <h1 className="text-2xl font-semibold text-foreground">Set a new password</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {ready ? "Enter your new password below." : "Waiting for recovery link…"}
            </p>
          </div>

          {success ? (
            <div className="bg-background rounded-xl border border-border shadow-sm p-6 text-center space-y-2">
              <p className="text-sm font-medium text-foreground">Password updated.</p>
              <p className="text-xs text-muted-foreground">Redirecting to login…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-background rounded-xl border border-border shadow-sm p-6 space-y-4">
              <div>
                <label htmlFor="pw" className="text-sm font-medium text-foreground mb-1.5 block">New password</label>
                <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={!ready} />
              </div>
              <div>
                <label htmlFor="cpw" className="text-sm font-medium text-foreground mb-1.5 block">Confirm password</label>
                <Input id="cpw" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required disabled={!ready} />
              </div>

              {error && <p className="text-sm text-destructive font-medium">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading || !ready}>
                {loading ? "Updating…" : "Update password"}
              </Button>

              {!ready && (
                <p className="text-xs text-muted-foreground text-center">
                  Open the link from your password reset email to continue.
                </p>
              )}
            </form>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default AdminResetPassword;
