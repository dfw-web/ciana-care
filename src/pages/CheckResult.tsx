import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ArrowLeft, FileText, AlertCircle, Download, Printer } from "lucide-react";
import { Link } from "react-router-dom";
import cianaLogo from "@/assets/ciana-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type PatientResult = {
  patient_name: string;
  code: string;
  approved: boolean;
  tests: {
    id: string;
    test_name: string;
    test_date: string;
    result: string;
    result_file_path: string | null;
  }[];
};

const CheckResult = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PatientResult | null>(null);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewIsImage, setPreviewIsImage] = useState(false);

  const getFileUrl = (path: string) => {
    const { data } = supabase.storage.from("result-files").getPublicUrl(path);
    return data.publicUrl;
  };

  const isImage = (path: string) => /\.(png|jpg|jpeg|webp)$/i.test(path);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    setResult(null);

    const { data: patient, error: dbError } = await supabase
      .from("patients")
      .select("id, patient_name, code, approved")
      .eq("code", trimmed)
      .maybeSingle();

    if (dbError) { setError("Something went wrong. Please try again."); setLoading(false); return; }
    if (!patient) { setError("Invalid code. Please check and try again."); setLoading(false); return; }

    if (!patient.approved) {
      setResult({ patient_name: patient.patient_name, code: patient.code, approved: false, tests: [] });
      setLoading(false);
      return;
    }

    const { data: tests } = await supabase
      .from("patient_tests")
      .select("id, test_name, test_date, result, result_file_path")
      .eq("patient_id", patient.id)
      .order("test_date", { ascending: false });

    setResult({ patient_name: patient.patient_name, code: patient.code, approved: true, tests: tests || [] });
    setLoading(false);
  };

  const handleDownload = (path: string) => {
    const url = getFileUrl(path);
    const a = document.createElement("a");
    a.href = url; a.download = path.split("/").pop() || "result"; a.target = "_blank";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handlePrint = (path: string) => {
    const url = getFileUrl(path);
    const w = window.open(url, "_blank");
    if (w) w.addEventListener("load", () => w.print());
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
          className="max-w-2xl mx-auto"
        >
          <div className="text-center mb-8">
            <img src={cianaLogo} alt="Ciana Diagnostics" className="h-16 w-auto mx-auto mb-4" />
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight">Check Your Result</h1>
            <p className="text-muted-foreground mt-2">Enter the unique code provided by the lab to view your test results.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-background rounded-xl border border-border shadow-sm p-6 space-y-4">
            <div>
              <label htmlFor="code" className="text-sm font-medium text-foreground mb-1.5 block">Unique Code</label>
              <Input id="code" placeholder="e.g. CN/0000/26" value={code} onChange={(e) => setCode(e.target.value)} className="text-base tracking-wider uppercase" maxLength={15} />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !code.trim()}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Checking...
                </span>
              ) : (
                <span className="flex items-center gap-2"><Search className="w-4 h-4" /> Check Result</span>
              )}
            </Button>
          </form>

          {error && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-destructive/10 border border-destructive/20 rounded-xl p-5 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive font-medium">{error}</p>
            </motion.div>
          )}

          {result && !result.approved && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-6">
              <p className="font-semibold text-amber-800">Your results are not yet available</p>
              <p className="text-sm text-amber-700 mt-1">Hi {result.patient_name}, your test results are being reviewed. Please check back later.</p>
            </motion.div>
          )}

          {result && result.approved && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-background rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="bg-accent/50 px-6 py-4 border-b border-border">
                <h2 className="font-semibold text-foreground">{result.patient_name} — Test Results</h2>
                <p className="text-xs text-muted-foreground mt-1">Code: {result.code}</p>
              </div>
              <div className="p-6">
                {result.tests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No test results found.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {result.tests.map((t) => {
                      const filePaths = t.result_file_path ? t.result_file_path.split(",").filter(Boolean) : [];
                      return (
                        <div key={t.id} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <p className="font-medium text-foreground">{t.test_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(t.test_date).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
                              </p>
                            </div>
                            <span className="text-sm text-foreground">{t.result}</span>
                          </div>
                          {filePaths.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {filePaths.map((fp, i) => (
                                <div key={i} className="flex items-center gap-1">
                                  <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                                    setPreviewUrl(getFileUrl(fp));
                                    setPreviewIsImage(isImage(fp));
                                  }}>
                                    <FileText className="w-3.5 h-3.5 mr-1" />
                                    View Test File{filePaths.length > 1 ? ` ${i + 1}` : ""}
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
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Preview modal */}
          {previewUrl && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-background rounded-xl border border-border shadow-lg max-w-3xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <span className="font-medium text-foreground">Result Preview</span>
                  <Button variant="ghost" size="sm" onClick={() => setPreviewUrl(null)}>Close</Button>
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

          <div className="text-center mt-6">
            <Link to="/patient" className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4">
              Login with email instead
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default CheckResult;
