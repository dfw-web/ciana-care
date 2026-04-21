import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Lock } from "lucide-react";
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

  // If already logged in, go straight to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/admin/dashboard", { replace: true });
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (authError) {
      setError("Invalid email or password. Please try again.");
      return;
    }
    navigate("/admin/dashboard");
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
              <label htmlFor="password" className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive font-medium">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminLogin;
