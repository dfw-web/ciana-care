import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Printer, Loader2, LogOut, Lock, Calendar, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import cianaLogo from "@/assets/ciana-logo.png";

type PatientSession = {
  id: string;
  patient_name: string;
  code: string;
  email: string;
  approved: boolean;
};

type Test = {
  id: string;
  test_name: string;
  test_date: string;
  result: string;
  result_file_path: string | null;
};

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientSession | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewIsImage, setPreviewIsImage] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("patient_session");
    if (!stored) {
      navigate("/patient", { replace: true });
      return;
    }
    const parsed: PatientSession = JSON.parse(stored);
    setPatient(parsed);

    const fetchData = async () => {
      const { data: freshPatient } = await supabase
        .from("patients")
        .select("approved")
        .eq("id", parsed.id)
        .single();

      if (freshPatient) {
        parsed.approved = freshPatient.approved;
        setPatient({ ...parsed });
        sessionStorage.setItem("patient_session", JSON.stringify({ ...parsed, approved: freshPatient.approved }));
      }

      if (freshPatient?.approved) {
        const { data: testData } = await supabase
          .from("patient_tests")
          .select("id, test_name, test_date, result, result_file_path")
          .eq("patient_id", parsed.id)
          .order("test_date", { ascending: false });
        setTests(testData || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [navigate]);

  const getFileUrl = (path: string) => {
    const { data } = supabase.storage.from("result-files").getPublicUrl(path);
    return data.publicUrl;
  };

  const isImage = (path: string) => /\.(png|jpg|jpeg|webp)$/i.test(path);

  const handleDownload = (path: string) => {
    const url = getFileUrl(path);
    const a = document.createElement("a");
    a.href = url;
    a.download = path.split("/").pop() || "result";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = (path: string) => {
    const url = getFileUrl(path);
    const w = window.open(url, "_blank");
    if (w) w.addEventListener("load", () => w.print());
  };

  const handlePreview = (path: string) => {
    setPreviewUrl(getFileUrl(path));
    setPreviewIsImage(isImage(path));
  };

  const handleDownloadAll = () => {
    const filesWithPaths = tests.filter((t) => t.result_file_path);
    if (filesWithPaths.length === 0) return;
    filesWithPaths.forEach((t) => {
      const paths = t.result_file_path!.split(",").filter(Boolean);
      paths.forEach((p) => handleDownload(p));
    });
  };

  const handleLogout = () => {
    sessionStorage.removeItem("patient_session");
    navigate("/patient", { replace: true });
  };

  const filteredTests = dateFilter
    ? tests.filter((t) => t.test_date === dateFilter)
    : tests;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!patient) return null;

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

      <main className="container py-8 space-y-6">
        {/* Patient Info */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background rounded-xl border border-border shadow-sm p-6"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Patient Name</p>
              <p className="text-lg font-semibold text-foreground">{patient.patient_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Patient Code</p>
              <p className="text-lg font-mono font-semibold text-foreground">{patient.code}</p>
            </div>
          </div>
        </motion.section>

        {/* Not approved */}
        {!patient.approved && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-start gap-3"
          >
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">Your results are not yet available</p>
              <p className="text-sm text-amber-700 mt-1">
                Your test results are being reviewed. Please check back later or contact the lab.
              </p>
            </div>
          </motion.div>
        )}

        {/* Approved - show tests */}
        {patient.approved && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-background rounded-xl border border-border shadow-sm"
          >
            <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold text-foreground">Your Test Results ({tests.length})</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-auto h-9 text-sm"
                    placeholder="Filter by date"
                  />
                  {dateFilter && (
                    <Button variant="ghost" size="sm" onClick={() => setDateFilter("")} className="text-xs">
                      Clear
                    </Button>
                  )}
                </div>
                {tests.some((t) => t.result_file_path) && (
                  <Button variant="outline" size="sm" onClick={handleDownloadAll}>
                    <Download className="w-4 h-4 mr-2" /> Download All
                  </Button>
                )}
              </div>
            </div>

            {filteredTests.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                {dateFilter ? "No tests found for this date." : "No test results yet."}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredTests.map((t) => {
                  const filePaths = t.result_file_path ? t.result_file_path.split(",").filter(Boolean) : [];
                  return (
                    <div key={t.id} className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-foreground">{t.test_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(t.test_date).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-foreground">{t.result}</span>
                      </div>
                      {filePaths.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {filePaths.map((fp, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => handlePreview(fp)}
                              >
                                <FileText className="w-3.5 h-3.5 mr-1" />
                                View Test File {filePaths.length > 1 ? `${i + 1}` : ""}
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
        )}

        {/* File Preview Modal */}
        {previewUrl && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-background rounded-xl border border-border shadow-lg max-w-3xl w-full max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
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
      </main>
    </div>
  );
};

export default PatientDashboard;
