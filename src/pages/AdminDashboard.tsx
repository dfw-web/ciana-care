import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, Plus, Loader2, Trash2, Upload, FileText, X, Search, ChevronDown, ChevronUp, Check } from "lucide-react";
import { toast } from "sonner";

type Patient = {
  id: string;
  patient_name: string;
  code: string;
  email: string | null;
  approved: boolean;
  created_at: string;
};

type TestEntry = {
  test_name: string;
  result: string;
  test_date: string;
  file: File | null;
};

type PatientTest = {
  id: string;
  test_name: string;
  test_date: string;
  result: string;
  result_file_path: string | null;
};

const CODE_REGEX = /^CIANA\/\d{4}\/\d{2}$/;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];

const emptyTest = (): TestEntry => ({
  test_name: "",
  result: "",
  test_date: new Date().toISOString().split("T")[0],
  file: null,
});

const sanitizeInput = (val: string, maxLen = 200) =>
  val.replace(/<[^>]*>/g, "").trim().slice(0, maxLen);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);
  const [patientTests, setPatientTests] = useState<Record<string, PatientTest[]>>({});

  // New patient form
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientCode, setPatientCode] = useState("");
  const [tests, setTests] = useState<TestEntry[]>([emptyTest()]);

  // Add test to existing patient
  const [addingTestFor, setAddingTestFor] = useState<string | null>(null);
  const [newTests, setNewTests] = useState<TestEntry[]>([emptyTest()]);
  const [submittingNewTest, setSubmittingNewTest] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/admin", { replace: true }); return; }
      fetchPatients();
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/admin", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchPatients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load patients");
    else setPatients(data || []);
    setLoading(false);
  };

  const fetchTests = async (patientId: string) => {
    const { data } = await supabase
      .from("patient_tests")
      .select("*")
      .eq("patient_id", patientId)
      .order("test_date", { ascending: false });
    setPatientTests((prev) => ({ ...prev, [patientId]: data || [] }));
  };

  const toggleExpand = (id: string) => {
    if (expandedPatient === id) {
      setExpandedPatient(null);
    } else {
      setExpandedPatient(id);
      fetchTests(id);
    }
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) return "Only PDF and image files allowed";
    if (file.size > MAX_FILE_SIZE) return "File must be under 10MB";
    return null;
  };

  const uploadFileAndInsertTest = async (patientId: string, patientCode: string, t: TestEntry) => {
    let filePath: string | null = null;
    if (t.file) {
      const err = validateFile(t.file);
      if (err) { toast.error(`${t.test_name}: ${err}`); return false; }
      const ext = t.file.name.split(".").pop()?.toLowerCase() || "bin";
      const safeName = `${patientCode.replace(/\//g, "-")}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("result-files").upload(safeName, t.file);
      if (uploadError) { toast.error(`Failed to upload file for ${t.test_name}`); return false; }
      filePath = safeName;
    }
    const { error } = await supabase.from("patient_tests").insert({
      patient_id: patientId,
      test_name: sanitizeInput(t.test_name),
      result: sanitizeInput(t.result),
      test_date: t.test_date,
      result_file_path: filePath,
    });
    if (error) { toast.error(`Failed to save test: ${t.test_name}`); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = sanitizeInput(patientCode).toUpperCase();
    const email = sanitizeInput(patientEmail, 255).toLowerCase();
    const name = sanitizeInput(patientName, 100);

    if (!name || !code || !email) { toast.error("Please fill patient name, email, and code"); return; }
    if (!CODE_REGEX.test(code)) { toast.error("Code must be in format: CIANA/0000/26"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Please enter a valid email"); return; }

    const validTests = tests.filter((t) => t.test_name.trim() && t.result.trim());
    if (validTests.length === 0) { toast.error("Add at least one test with name and result"); return; }

    setSubmitting(true);

    const { data: newPatient, error: patientError } = await supabase
      .from("patients")
      .insert({ patient_name: name, code, email })
      .select("id")
      .single();

    if (patientError) {
      if (patientError.code === "23505") toast.error("This code or email already exists.");
      else toast.error("Failed to add patient. Please try again.");
      setSubmitting(false);
      return;
    }

    for (const t of validTests) {
      await uploadFileAndInsertTest(newPatient.id, code, t);
    }

    toast.success("Patient and tests added successfully");
    setPatientName(""); setPatientEmail(""); setPatientCode("");
    setTests([emptyTest()]);
    setSubmitting(false);
    fetchPatients();
  };

  // Add tests to existing patient
  const handleSubmitNewTests = async (patientId: string, code: string) => {
    const validTests = newTests.filter((t) => t.test_name.trim() && t.result.trim());
    if (validTests.length === 0) { toast.error("Add at least one test with name and result"); return; }

    setSubmittingNewTest(true);
    for (const t of validTests) {
      await uploadFileAndInsertTest(patientId, code, t);
    }
    toast.success("Tests added successfully");
    setNewTests([emptyTest()]);
    setAddingTestFor(null);
    setSubmittingNewTest(false);
    // Refresh tests for this patient
    await fetchTests(patientId);
  };

  const handleDeletePatient = async (p: Patient) => {
    const testsData = patientTests[p.id] || [];
    const filesToDelete = testsData.filter((t) => t.result_file_path).map((t) => t.result_file_path!);
    if (filesToDelete.length > 0) await supabase.storage.from("result-files").remove(filesToDelete);
    const { error } = await supabase.from("patients").delete().eq("id", p.id);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Patient deleted");
      setPatients((prev) => prev.filter((x) => x.id !== p.id));
      setPatientTests((prev) => { const n = { ...prev }; delete n[p.id]; return n; });
      if (expandedPatient === p.id) setExpandedPatient(null);
    }
  };

  const handleDeleteTest = async (testId: string, patientId: string, filePath: string | null) => {
    if (filePath) await supabase.storage.from("result-files").remove([filePath]);
    const { error } = await supabase.from("patient_tests").delete().eq("id", testId);
    if (error) toast.error("Failed to delete test");
    else {
      toast.success("Test deleted");
      setPatientTests((prev) => ({
        ...prev,
        [patientId]: (prev[patientId] || []).filter((t) => t.id !== testId),
      }));
    }
  };

  const handleToggleApproval = async (p: Patient) => {
    const newVal = !p.approved;
    const { error } = await supabase.from("patients").update({ approved: newVal }).eq("id", p.id);
    if (error) toast.error("Failed to update");
    else {
      setPatients((prev) => prev.map((x) => x.id === p.id ? { ...x, approved: newVal } : x));
      toast.success(newVal ? "Results approved" : "Results unapproved");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin", { replace: true });
  };

  const updateTest = (idx: number, field: keyof TestEntry, value: string | File | null) => {
    setTests((prev) => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };
  const addTest = () => setTests((prev) => [...prev, emptyTest()]);
  const removeTest = (idx: number) => setTests((prev) => prev.filter((_, i) => i !== idx));

  const updateNewTest = (idx: number, field: keyof TestEntry, value: string | File | null) => {
    setNewTests((prev) => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };
  const addNewTest = () => setNewTests((prev) => [...prev, emptyTest()]);
  const removeNewTest = (idx: number) => setNewTests((prev) => prev.filter((_, i) => i !== idx));

  const handleFileChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>, setter: "main" | "new") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { toast.error(err); e.target.value = ""; return; }
    if (setter === "main") updateTest(idx, "file", file);
    else updateNewTest(idx, "file", file);
  };

  const filteredPatients = patients.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.code.toLowerCase().includes(q) || (p.email && p.email.toLowerCase().includes(q)) || p.patient_name.toLowerCase().includes(q);
  });

  const renderTestForm = (
    testList: TestEntry[],
    update: (i: number, f: keyof TestEntry, v: string | File | null) => void,
    add: () => void,
    remove: (i: number) => void,
    fileSetter: "main" | "new"
  ) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Tests</h3>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="w-4 h-4 mr-1" /> Add Another Test
        </Button>
      </div>
      {testList.map((t, idx) => (
        <div key={idx} className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Test {idx + 1}</span>
            {testList.length > 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)} className="text-muted-foreground hover:text-destructive h-7 w-7">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Test Name</label>
              <Input placeholder="e.g. Malaria Test" value={t.test_name} onChange={(e) => update(idx, "test_name", e.target.value)} maxLength={200} />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Result</label>
              <Input placeholder="e.g. Negative" value={t.result} onChange={(e) => update(idx, "result", e.target.value)} maxLength={500} />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Date</label>
              <Input type="date" value={t.test_date} onChange={(e) => update(idx, "test_date", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Result File</label>
            {t.file ? (
              <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background text-sm">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate flex-1">{t.file.name}</span>
                <button type="button" onClick={() => update(idx, "file", null)} className="text-muted-foreground hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={(e) => handleFileChange(idx, e, fileSetter)} className="hidden" />
                <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-dashed border-input text-sm text-muted-foreground hover:border-primary transition-colors">
                  <Upload className="w-4 h-4" /> Upload File
                </div>
              </label>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-foreground tracking-tight">Admin Dashboard</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Add Patient Form */}
        <section className="bg-background rounded-xl border border-border shadow-sm p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add New Patient
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
                <Input placeholder="Full name" value={patientName} onChange={(e) => setPatientName(e.target.value)} maxLength={100} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Patient Email</label>
                <Input type="email" placeholder="patient@email.com" value={patientEmail} onChange={(e) => setPatientEmail(e.target.value)} maxLength={255} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Unique Code</label>
                <Input
                  placeholder="CIANA/0000/26"
                  value={patientCode}
                  onChange={(e) => setPatientCode(e.target.value)}
                  className="uppercase tracking-wider"
                  maxLength={15}
                />
                <p className="text-xs text-muted-foreground mt-1">Format: CIANA/0000/26</p>
              </div>
            </div>

            {renderTestForm(tests, updateTest, addTest, removeTest, "main")}

            <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {submitting ? "Saving..." : "Add Patient"}
            </Button>
          </form>
        </section>

        {/* Patients Table */}
        <section className="bg-background rounded-xl border border-border shadow-sm">
          <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-foreground">All Patients ({patients.length})</h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by code, email, name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" maxLength={100} />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              {searchQuery ? "No patients match your search." : "No patients added yet."}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredPatients.map((p) => (
                <div key={p.id}>
                  <div className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => toggleExpand(p.id)}>
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Code</p>
                        <p className="font-mono text-sm tracking-wider">{p.code}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Name</p>
                        <p className="text-sm font-medium">{p.patient_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm truncate">{p.email || "—"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.approved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                          {p.approved ? "Approved" : "Pending"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleToggleApproval(p); }} title={p.approved ? "Revoke approval" : "Approve"} className="text-muted-foreground hover:text-primary">
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeletePatient(p); }} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {expandedPatient === p.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expanded tests */}
                  {expandedPatient === p.id && (
                    <div className="px-6 pb-4 bg-muted/10 space-y-4">
                      {!patientTests[p.id] ? (
                        <div className="py-4 flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
                      ) : patientTests[p.id].length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">No tests recorded.</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Test</TableHead>
                              <TableHead>Result</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>File</TableHead>
                              <TableHead className="w-12" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {patientTests[p.id].map((t) => (
                              <TableRow key={t.id}>
                                <TableCell className="font-medium">{t.test_name}</TableCell>
                                <TableCell>{t.result}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {new Date(t.test_date).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
                                </TableCell>
                                <TableCell>
                                  {t.result_file_path ? <FileText className="w-4 h-4 text-primary" /> : <span className="text-xs text-muted-foreground">—</span>}
                                </TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteTest(t.id, p.id, t.result_file_path)} className="text-muted-foreground hover:text-destructive h-7 w-7">
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}

                      {/* Add New Test to this patient */}
                      {addingTestFor === p.id ? (
                        <div className="border border-border rounded-lg p-4 bg-background space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-foreground">Add New Test for {p.patient_name}</h4>
                            <Button variant="ghost" size="sm" onClick={() => { setAddingTestFor(null); setNewTests([emptyTest()]); }}>
                              <X className="w-4 h-4 mr-1" /> Cancel
                            </Button>
                          </div>
                          {renderTestForm(newTests, updateNewTest, addNewTest, removeNewTest, "new")}
                          <Button
                            onClick={() => handleSubmitNewTests(p.id, p.code)}
                            disabled={submittingNewTest}
                            className="w-full sm:w-auto"
                          >
                            {submittingNewTest ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {submittingNewTest ? "Saving..." : "Save Tests"}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setAddingTestFor(p.id); setNewTests([emptyTest()]); }}
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add New Test
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
