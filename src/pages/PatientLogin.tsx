import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import cianaLogo from "@/assets/ciana-logo.png";

const PatientLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setLoading(true);
    setError("");

    const { data, error: dbError } = await supabase
      .from("patients")
      .select("id, patient_name, code, email, approved")
      .ilike("email", trimmed)
      .maybeSingle();

    setLoading(false);

    if (dbError) {
      setError("Something went wrong. Please try again.");
      return;
    }
    if (!data) {
      setError("No patient record found for this email address.");
      return;
    }

    // Store patient info in sessionStorage and navigate
    sessionStorage.setItem("patient_session", JSON.stringify(data));
    navigate("/patient/dashboard");
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
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md mx-auto"
        >
          <div className="text-center mb-8">
            <img src={cianaLogo} alt="Ciana Diagnostics" className="h-16 w-auto mx-auto mb-4" />
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight">Patient Portal</h1>
            <p className="text-muted-foreground mt-2">Enter your email address to access your test results.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-background rounded-xl border border-border shadow-sm p-6 space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-foreground mb-1.5 block">Email Address</label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-base"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking...
                </span>
              ) : (
                "View My Results"
              )}
            </Button>
          </form>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-destructive/10 border border-destructive/20 rounded-xl p-5 text-sm text-destructive font-medium"
            >
              {error}
            </motion.div>
          )}

          <div className="text-center mt-6">
            <Link to="/check-result" className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4">
              Have a code instead? Check result by code
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default PatientLogin;
