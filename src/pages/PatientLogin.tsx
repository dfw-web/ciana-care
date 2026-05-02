import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import cianaLogo from "@/assets/ciana-logo.png";

const PatientLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/patient/dashboard", { replace: true });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    if (!em || !password) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: em, password });
    setLoading(false);

    if (error) {
      toast.error("Invalid email or password");
      return;
    }
    navigate("/patient/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border">
        <div className="container flex h-16 items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            <img src={cianaLogo} alt="Ciana Diagnostics" className="h-8 w-auto" />
            <span className="font-semibold text-foreground tracking-tight">Ciana Diagnostics</span>
          </div>
        </div>
      </header>

      <main className="container py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight">Patient Portal</h1>
            <p className="text-muted-foreground mt-2">Log in to view your unlocked results.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-background rounded-xl border border-border shadow-sm p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !email.trim() || !password}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Log In
            </Button>
          </form>

          <div className="text-center mt-6 space-y-2">
            <p className="text-sm text-muted-foreground">
              Got a result code?{" "}
              <Link to="/results" className="text-primary hover:underline">Use it here</Link>
            </p>
            <p className="text-xs text-muted-foreground">
              Or{" "}
              <Link to="/check-result" className="hover:text-foreground underline underline-offset-4">
                quick lookup with your CN code
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default PatientLogin;
