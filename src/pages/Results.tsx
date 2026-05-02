import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import cianaLogo from "@/assets/ciana-logo.png";

type Step = "code" | "signup" | "login" | "unlock-existing";

const Results = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validatedCode, setValidatedCode] = useState<{
    code_id: string;
    patient_id: string;
    patient_test_id: string;
    patient_email: string;
    patient_name: string;
    patient_auth_user_id: string | null;
  } | null>(null);

  // Auto-fill from URL ?code=...
  useEffect(() => {
    const c = params.get("code");
    if (c) setCode(c.toUpperCase());
  }, [params]);

  // If already logged in, send to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && step === "code" && !code) {
        navigate("/patient/dashboard", { replace: true });
      }
    });
  }, []); // eslint-disable-line

  const validateCodeAndEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    const em = email.trim().toLowerCase();
    if (!c || !em) {
      toast.error("Please enter both code and email");
      return;
    }
    setLoading(true);

    // Look up the code
    const { data: ac, error: acErr } = await supabase
      .from("result_access_codes")
      .select("id, patient_id, patient_test_id, used_at")
      .eq("code", c)
      .maybeSingle();

    if (acErr || !ac) {
      setLoading(false);
      toast.error("Invalid or expired code");
      return;
    }

    // Look up the patient and check email match
    const { data: patient } = await supabase
      .from("patients")
      .select("id, patient_name, email, auth_user_id")
      .eq("id", ac.patient_id)
      .maybeSingle();

    if (!patient || !patient.email || patient.email.toLowerCase() !== em) {
      setLoading(false);
      toast.error("This code does not belong to that email address");
      return;
    }

    setValidatedCode({
      code_id: ac.id,
      patient_id: ac.patient_id,
      patient_test_id: ac.patient_test_id,
      patient_email: patient.email,
      patient_name: patient.patient_name,
      patient_auth_user_id: patient.auth_user_id,
    });
    setLoading(false);

    // Decide next step
    if (patient.auth_user_id) {
      // Already has account
      const { data: session } = await supabase.auth.getSession();
      if (session.session?.user?.id === patient.auth_user_id) {
        // Already logged in as this patient → unlock immediately
        await unlockTest(ac.id, ac.patient_test_id, ac.patient_id, session.session.user.id);
        navigate("/patient/dashboard", { replace: true });
      } else {
        setStep("unlock-existing");
      }
    } else {
      setStep("signup");
    }
  };

  const unlockTest = async (
    codeId: string,
    patientTestId: string,
    patientId: string,
    authUserId: string,
  ) => {
    // Insert unlock (idempotent via unique constraint)
    await supabase.from("patient_unlocks").insert({
      auth_user_id: authUserId,
      patient_test_id: patientTestId,
      patient_id: patientId,
    });
    // Mark code as used (best-effort)
    await supabase
      .from("result_access_codes")
      .update({ used_at: new Date().toISOString(), used_by_auth_user_id: authUserId })
      .eq("id", codeId);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatedCode) return;
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);

    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: validatedCode.patient_email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/patient/dashboard` },
    });

    if (signUpErr || !signUpData.user) {
      setLoading(false);
      if (signUpErr?.message?.toLowerCase().includes("registered")) {
        toast.error("This email already has an account. Please log in instead.");
        setStep("unlock-existing");
        return;
      }
      toast.error(signUpErr?.message || "Failed to create account");
      return;
    }

    // Link patient to this auth user
    await supabase
      .from("patients")
      .update({ auth_user_id: signUpData.user.id })
      .eq("id", validatedCode.patient_id);

    // Wait for session (auto-confirm should be on, but in case it isn't)
    const { data: sessionData } = await supabase.auth.getSession();
    let userId = sessionData.session?.user?.id;

    if (!userId) {
      // Try sign in (in case email confirmation is required and user got autoconfirmed)
      const { data: si } = await supabase.auth.signInWithPassword({
        email: validatedCode.patient_email,
        password,
      });
      userId = si.session?.user?.id;
    }

    if (!userId) {
      setLoading(false);
      toast.success("Account created. Please check your email to confirm, then log in.");
      navigate("/patient", { replace: true });
      return;
    }

    await unlockTest(validatedCode.code_id, validatedCode.patient_test_id, validatedCode.patient_id, userId);

    toast.success("Account created and result unlocked");
    navigate("/patient/dashboard", { replace: true });
  };

  const handleExistingLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatedCode) return;
    setLoading(true);

    const { data: si, error: siErr } = await supabase.auth.signInWithPassword({
      email: validatedCode.patient_email,
      password,
    });

    if (siErr || !si.session) {
      setLoading(false);
      toast.error("Wrong password");
      return;
    }

    await unlockTest(
      validatedCode.code_id,
      validatedCode.patient_test_id,
      validatedCode.patient_id,
      si.session.user.id,
    );

    toast.success("Result unlocked");
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

      <main className="container py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight">
              {step === "code" && "Access Your Result"}
              {step === "signup" && "Set Your Password"}
              {step === "unlock-existing" && "Welcome Back"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {step === "code" && "Enter the result code and email we sent you."}
              {step === "signup" && "First time? Create a password to access your portal."}
              {step === "unlock-existing" && "Log in to unlock this result."}
            </p>
          </div>

          {step === "code" && (
            <form onSubmit={validateCodeAndEmail} className="bg-background rounded-xl border border-border shadow-sm p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Result Code</label>
                <Input
                  placeholder="RES-XXXXXXXX"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="font-mono tracking-wider uppercase"
                  maxLength={20}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email Address</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Continue
              </Button>
              <p className="text-center text-xs text-muted-foreground pt-2">
                Already have an account?{" "}
                <Link to="/patient" className="text-primary hover:underline">Log in</Link>
              </p>
            </form>
          )}

          {step === "signup" && validatedCode && (
            <form onSubmit={handleSignup} className="bg-background rounded-xl border border-border shadow-sm p-6 space-y-4">
              <div className="bg-muted/40 rounded-lg p-3 text-sm">
                <p className="text-muted-foreground">Creating account for</p>
                <p className="font-semibold text-foreground">{validatedCode.patient_name}</p>
                <p className="text-xs text-muted-foreground">{validatedCode.patient_email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Set Password</label>
                <Input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Account & Unlock Result
              </Button>
            </form>
          )}

          {step === "unlock-existing" && validatedCode && (
            <form onSubmit={handleExistingLogin} className="bg-background rounded-xl border border-border shadow-sm p-6 space-y-4">
              <div className="bg-muted/40 rounded-lg p-3 text-sm">
                <p className="text-muted-foreground">Logging in as</p>
                <p className="font-semibold text-foreground">{validatedCode.patient_email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Log In & Unlock
              </Button>
            </form>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Results;
