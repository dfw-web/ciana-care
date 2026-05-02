import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, LogOut, Lock, FileText, Download, Printer, KeyRound } from "lucide-react";
import { toast } from "sonner";
import cianaLogo from "@/assets/ciana-logo.png";

type UnlockedTest = {
  unlock_id: string;
  test: {
    id: string;
    test_name: string;
    test_date: string;
    result: string;
    result_file_path: string | null;
  };
};

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState("");
  const [unlocked, setUnlocked] = useState<UnlockedTest[]>([]);
  const [unlockCode, setUnlockCode] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewIsImage, setPreviewIsImage] = useState(false);

  const loadData = async (userId: string) => {
    // Find linked patient row (for name)
    const { data: patient } = await supabase
      .from("patients")
      .select("patient_name")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (patient) setPatientName(patient.patient_name);

    // Get unlocks → fetch test details
    const { data: unlocks } = await supabase
      .from("patient_unlocks")
      .select("id, patient_test_id")
      .eq("auth_user_id", userId)
      .order("unlocked_at", { ascending: false });

    if (!unlocks || unlocks.length === 0) {
      setUnlocked([]);
      return;
    }

    const testIds = unlocks.map((u) => u.patient_test_id);
    const { data: tests } = await supabase
      .from("patient_tests")
      .select("id, test_name, test_date, result, result_file_path")
      .in("id", testIds);

    const byId = new Map(tests?.map((t) => [t.id, t]) || []);
    setUnlocked(
      unlocks
        .map((u) => {
          const t = byId.get(u.patient_test_id);
          return t ? { unlock_id: u.id, test: t } : null;
        })
        .filter(Boolean) as UnlockedTest[],
    );
  };

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/patient", { replace: true });
        return;
      }
      setAuthUserId(data.session.user.id);
      await loadData(data.session.user.id);
      setLoading(false);
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/patient", { replace: true });
    });
    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUserId) return;
    const c = unlockCode.trim().toUpperCase();
    if (!c) return;

    setUnlocking(true);

    // Validate code
    const { data: ac } = await supabase
      .from("result_access_codes")
      .select("id, patient_id, patient_test_id")
      .eq("code", c)
      .maybeSingle();

    if (!ac) {
      setUnlocking(false);
      toast.error("Invalid or expired code");
      return;
    }

    // Verify the code belongs to this user's linked patient record
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("id", ac.patient_id)
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (!patient) {
      setUnlocking(false);
      toast.error("This code does not belong to your account");
      return;
    }

    const { error: upErr } = await supabase.from("patient_unlocks").insert({
      auth_user_id: authUserId,
      patient_test_id: ac.patient_test_id,
      patient_id: ac.patient_id,
    });

    if (upErr && !upErr.message.toLowerCase().includes("duplicate")) {
      setUnlocking(false);
      toast.error("Failed to unlock");
      return;
    }

    await supabase
      .from("result_access_codes")
      .update({ used_at: new Date().toISOString(), used_by_auth_user_id: authUserId })
      .eq("id", ac.id);

    toast.success("Result unlocked");
    setUnlockCode("");
    await loadData(authUserId);
    setUnlocking(false);
  };

  const getFileUrl = (path: string) =>
    supabase.storage.from("result-files").getPublicUrl(path).data.publicUrl;

  const isImage = (path: string) => /\.(png|jpg|jpeg|webp)$/i.test(path);

  const handlePreview = (path: string) => {
    const ext = path.split(".").pop()?.toLowerCase() || "";
    if (ext === "doc" || ext === "docx") return handleDownload(path);
    setPreviewUrl(getFileUrl(path));
    setPreviewIsImage(isImage(path));
  };

  const handleDownload = (path: string) => {
    const a = document.createElement("a");
    a.href = getFileUrl(path);
    a.download = path.split("/").pop() || "result";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = (path: string) => {
    const w = window.open(getFileUrl(path), "_blank");
    if (w) w.addEventListener("load", () => w.print());
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/patient", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={cianaLogo} alt="Ciana Diagnostics" className="h-8 w-auto" />
            <span className="font-semibold text-foreground tracking-tight">Patient Portal</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <main className="container py-8 space-y-6 max-w-3xl">
        {patientName && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background rounded-xl border border-border shadow-sm p-6"
          >
            <p className="text-sm text-muted-foreground">Welcome</p>
            <p className="text-lg font-semibold text-foreground">{patientName}</p>
          </motion.section>
        )}

        {/* Unlock new result */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background rounded-xl border border-border shadow-sm p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Unlock a New Result</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Enter the result code we sent to your email to add a new result to your dashboard.
          </p>
          <form onSubmit={handleUnlock} className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="RES-XXXXXXXX"
              value={unlockCode}
              onChange={(e) => setUnlockCode(e.target.value.toUpperCase())}
              className="font-mono tracking-wider uppercase"
              maxLength={20}
            />
            <Button type="submit" disabled={unlocking || !unlockCode.trim()}>
              {unlocking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Unlock
            </Button>
          </form>
        </motion.section>

        {/* Unlocked results */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-background rounded-xl border border-border shadow-sm"
        >
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Your Results ({unlocked.length})</h2>
          </div>
          {unlocked.length === 0 ? (
            <div className="text-center py-12 px-6">
              <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No results unlocked yet. Use a result code above to unlock one.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {unlocked.map(({ unlock_id, test: t }) => {
                const filePaths = t.result_file_path ? t.result_file_path.split(",").filter(Boolean) : [];
                return (
                  <div key={unlock_id} className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-foreground">{t.test_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(t.test_date).toLocaleDateString("en-NG", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-foreground">{t.result}</span>
                    </div>
                    {filePaths.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {filePaths.map((fp, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <Button variant="outline" size="sm" className="text-xs" onClick={() => handlePreview(fp)}>
                              <FileText className="w-3.5 h-3.5 mr-1" /> View Result File
                              {filePaths.length > 1 ? ` ${i + 1}` : ""}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(fp)}>
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePrint(fp)}>
                              <Printer className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-2">No files attached</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.section>

        <p className="text-center text-xs text-muted-foreground">
          New result available?{" "}
          <Link to="/results" className="text-primary hover:underline">
            Open with a code link
          </Link>
        </p>
      </main>

      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-xl border border-border shadow-lg max-w-3xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <span className="font-medium text-foreground">Result Preview</span>
              <Button variant="ghost" size="sm" onClick={() => setPreviewUrl(null)}>
                Close
              </Button>
            </div>
            <div className="p-4">
              {previewIsImage ? (
                <img src={previewUrl} alt="Result" className="w-full max-h-[60vh] object-contain" />
              ) : (
                <iframe src={previewUrl} className="w-full h-[60vh]" title="Result PDF" />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
