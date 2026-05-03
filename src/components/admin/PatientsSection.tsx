import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  LogOut, Plus, Loader2, Trash2, Upload, FileText, X, Search,
  ChevronDown, ChevronUp, Check, Eye, Download, Pencil, ExternalLink,
  KeyRound, Copy, MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import { generateResultCode } from "@/lib/resultCodes";

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
  files: File[];
};

type PatientTest = {
  id: string;
  test_name: string;
  test_date: string;
  result: string;
  result_file_path: string | null;
};

const CODE_REGEX = /^CN\/\d{4}\/\d{2}$/;
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/png", "image/jpeg", "image/jpg", "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "webp", "doc", "docx"];
const FILE_ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const emptyTest = (): TestEntry => ({
  test_name: "",
  result: "",
  test_date: new Date().toISOString().split("T")[0],
  files: [],
});

const sanitizeInput = (val: string, maxLen = 200) =>
  val.replace(/<[^>]*>/g, "").trim().slice(0, maxLen);

const PatientsSection = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);
  const [patientTests, setPatientTests] = useState<Record<string, PatientTest[]>>({});

  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientCode, setPatientCode] = useState("");
  const [tests, setTests] = useState<TestEntry[]>([emptyTest()]);

  const [addingTestFor, setAddingTestFor] = useState<string | null>(null);
  const [newTests, setNewTests] = useState<TestEntry[]>([emptyTest()]);
  const [submittingNewTest, setSubmittingNewTest] = useState(false);

  const [editingPatient, setEditingPatient] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCode, setEditCode] = useState("");

  const [editingTest, setEditingTest] = useState<string | null>(null);
  const [editTestName, setEditTestName] = useState("");
  const [editTestResult, setEditTestResult] = useState("");

  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewIsImage, setPreviewIsImage] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);

  // Result access codes shown after generation
  const [codesModal, setCodesModal] = useState<{
    patient: { name: string; email: string | null };
    codes: { test_name: string; code: string; link: string }[];
  } | null>(null);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  useEffect(() => { fetchPatients(); }, []);

  const fetchPatients = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Failed to load patients");
    else setPatients(data || []);
    setLoading(false);
  };

  const fetchTests = async (patientId: string) => {
    const { data } = await supabase.from("patient_tests").select("*").eq("patient_id", patientId).order("test_date", { ascending: false });
    setPatientTests((prev) => ({ ...prev, [patientId]: data || [] }));
  };

  const toggleExpand = (id: string) => {
    if (expandedPatient === id) setExpandedPatient(null);
    else { setExpandedPatient(id); fetchTests(id); }
  };

  const validateFile = (file: File): string | null => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const typeOk = ALLOWED_FILE_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(ext);
    if (!typeOk) return "Only PDF, image, or Word files are allowed";
    if (file.size > MAX_FILE_SIZE) return "File must be under 15MB";
    return null;
  };

  const getFileUrl = (path: string) => {
    const { data } = supabase.storage.from("result-files").getPublicUrl(path);
    return data.publicUrl;
  };

  const isImageFile = (path: string) => /\.(png|jpg|jpeg|webp)$/i.test(path);

  const uploadFilesAndInsertTest = async (patientId: string, patientCode: string, t: TestEntry) => {
    const paths: string[] = [];
    for (const file of t.files) {
      const err = validateFile(file);
      if (err) { toast.error(`${t.test_name}: ${err}`); return false; }
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const safeName = `${patientCode.replace(/\//g, "-")}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("result-files").upload(safeName, file);
      if (uploadError) { toast.error(`Failed to upload file for ${t.test_name}`); return false; }
      paths.push(safeName);
    }
    const { error } = await supabase.from("patient_tests").insert({
      patient_id: patientId,
      test_name: sanitizeInput(t.test_name),
      result: sanitizeInput(t.result),
      test_date: t.test_date,
      result_file_path: paths.length > 0 ? paths.join(",") : null,
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
    if (!CODE_REGEX.test(code)) { toast.error("Code must be in format: CN/0000/26"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Please enter a valid email"); return; }
    const validTests = tests.filter((t) => t.test_name.trim() && t.result.trim());
    if (validTests.length === 0) { toast.error("Add at least one test with name and result"); return; }
    setSubmitting(true);
    const { data: newPatient, error: patientError } = await supabase.from("patients").insert({ patient_name: name, code, email }).select("id").single();
    if (patientError) {
      if (patientError.code === "23505") toast.error("This code or email already exists.");
      else toast.error("Failed to add patient.");
      setSubmitting(false); return;
    }
    for (const t of validTests) await uploadFilesAndInsertTest(newPatient.id, code, t);
    toast.success("Patient and tests added successfully");
    setPatientName(""); setPatientEmail(""); setPatientCode("");
    setTests([emptyTest()]); setSubmitting(false); setShowAddForm(false);
    fetchPatients();
  };

  const handleSubmitNewTests = async (patientId: string, code: string) => {
    const validTests = newTests.filter((t) => t.test_name.trim() && t.result.trim());
    if (validTests.length === 0) { toast.error("Add at least one test"); return; }
    setSubmittingNewTest(true);
    for (const t of validTests) await uploadFilesAndInsertTest(patientId, code, t);
    toast.success("Tests added"); setNewTests([emptyTest()]); setAddingTestFor(null); setSubmittingNewTest(false);
    await fetchTests(patientId);
  };

  const handleDeletePatient = async (p: Patient) => {
    if (!confirm(`Delete patient ${p.patient_name}?`)) return;
    const testsData = patientTests[p.id] || [];
    const filesToDelete = testsData.filter((t) => t.result_file_path).flatMap((t) => t.result_file_path!.split(","));
    if (filesToDelete.length > 0) await supabase.storage.from("result-files").remove(filesToDelete);
    const { error } = await supabase.from("patients").delete().eq("id", p.id);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Patient deleted");
      setPatients((prev) => prev.filter((x) => x.id !== p.id));
      if (viewingPatient?.id === p.id) setViewingPatient(null);
    }
  };

  const handleDeleteTest = async (testId: string, patientId: string, filePath: string | null) => {
    if (filePath) await supabase.storage.from("result-files").remove(filePath.split(","));
    const { error } = await supabase.from("patient_tests").delete().eq("id", testId);
    if (error) toast.error("Failed to delete test");
    else { toast.success("Test deleted"); setPatientTests((prev) => ({ ...prev, [patientId]: (prev[patientId] || []).filter((t) => t.id !== testId) })); }
  };

  const handleToggleApproval = async (p: Patient) => {
    const newVal = !p.approved;
    const { error } = await supabase.from("patients").update({ approved: newVal }).eq("id", p.id);
    if (error) { toast.error("Failed"); return; }
    setPatients((prev) => prev.map((x) => x.id === p.id ? { ...x, approved: newVal } : x));
    toast.success(newVal ? "Approved" : "Unapproved");

    // On approval: ensure each test has a result code, then email patient.
    if (newVal) {
      try {
        let tests = patientTests[p.id];
        if (!tests) {
          const { data } = await supabase
            .from("patient_tests")
            .select("*")
            .eq("patient_id", p.id)
            .order("test_date", { ascending: false });
          tests = data || [];
          setPatientTests((prev) => ({ ...prev, [p.id]: tests! }));
        }
        if (!tests.length) return;

        const testIds = tests.map((t) => t.id);
        const { data: existing } = await supabase
          .from("result_access_codes")
          .select("patient_test_id, code")
          .in("patient_test_id", testIds);
        const existingByTest = new Map((existing || []).map((c) => [c.patient_test_id, c.code]));

        const generated: { test_name: string; code: string }[] = [];
        for (const t of tests) {
          let code = existingByTest.get(t.id);
          if (!code) {
            for (let i = 0; i < 5; i++) {
              const candidate = generateResultCode(8);
              const { error: insErr } = await supabase
                .from("result_access_codes")
                .insert({ patient_test_id: t.id, patient_id: p.id, code: candidate });
              if (!insErr) { code = candidate; break; }
            }
          }
          if (code) generated.push({ test_name: t.test_name, code });
        }

        // Send one email per generated code (one code unlocks one test).
        if (p.email && generated.length) {
          for (const g of generated) {
            supabase.functions.invoke("send-result-email", {
              body: {
                patient_email: p.email,
                patient_name: p.patient_name,
                test_names: [g.test_name],
                result_code: g.code,
              },
            }).catch((err) => console.error("Email send failed", err));
          }
          toast.success(`Result email${generated.length > 1 ? "s" : ""} sent`);
        }
      } catch (err) {
        // Never break approval flow on email failure
        console.error("Approval auto-email failed", err);
      }
    }
  };

  // Generate result-access codes for every test belonging to this patient.
  // Skips tests that already have a code (one code per test, reusable).
  const handleGenerateCodes = async (p: Patient) => {
    setGeneratingFor(p.id);
    try {
      // Make sure tests are loaded
      let tests = patientTests[p.id];
      if (!tests) {
        const { data } = await supabase
          .from("patient_tests")
          .select("*")
          .eq("patient_id", p.id)
          .order("test_date", { ascending: false });
        tests = data || [];
        setPatientTests((prev) => ({ ...prev, [p.id]: tests! }));
      }
      if (tests.length === 0) {
        toast.error("No tests on this patient yet");
        return;
      }

      // Find existing codes for these tests
      const testIds = tests.map((t) => t.id);
      const { data: existing } = await supabase
        .from("result_access_codes")
        .select("patient_test_id, code")
        .in("patient_test_id", testIds);
      const existingByTest = new Map((existing || []).map((c) => [c.patient_test_id, c.code]));

      const origin = window.location.origin;
      const generated: { test_name: string; code: string; link: string }[] = [];

      for (const t of tests) {
        let code = existingByTest.get(t.id);
        if (!code) {
          // Generate a unique code (retry on rare collision)
          for (let i = 0; i < 5; i++) {
            const candidate = generateResultCode(8);
            const { error } = await supabase
              .from("result_access_codes")
              .insert({ patient_test_id: t.id, patient_id: p.id, code: candidate });
            if (!error) {
              code = candidate;
              break;
            }
            if (!error || !String(error.message).includes("duplicate")) {
              if (i === 4) {
                toast.error(`Failed to create code for ${t.test_name}`);
                break;
              }
            }
          }
        }
        if (code) {
          generated.push({
            test_name: t.test_name,
            code,
            link: `${origin}/results?code=${encodeURIComponent(code)}`,
          });
          // Fire-and-forget email (stub for now)
          if (p.email) {
            supabase.functions
              .invoke("send-result-email", {
                body: {
                  recipient_email: p.email,
                  recipient_name: p.patient_name,
                  code,
                  test_name: t.test_name,
                },
              })
              .catch(() => {});
          }
        }
      }

      setCodesModal({
        patient: { name: p.patient_name, email: p.email },
        codes: generated,
      });
    } finally {
      setGeneratingFor(null);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  const sendWhatsApp = (phoneless: boolean, msg: string) => {
    // No patient phone in DB → open WhatsApp without target so user picks
    const url = phoneless
      ? `https://wa.me/?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const handleUpdatePatient = async (p: Patient) => {
    const code = sanitizeInput(editCode).toUpperCase();
    const name = sanitizeInput(editName, 100);
    const email = sanitizeInput(editEmail, 255).toLowerCase();
    if (!name || !code) { toast.error("Name and code required"); return; }
    if (!CODE_REGEX.test(code)) { toast.error("Code format: CN/0000/26"); return; }
    const { error } = await supabase.from("patients").update({ patient_name: name, code, email: email || null }).eq("id", p.id);
    if (error) toast.error("Failed to update");
    else {
      setPatients((prev) => prev.map((x) => x.id === p.id ? { ...x, patient_name: name, code, email } : x));
      setEditingPatient(null); toast.success("Updated");
      if (viewingPatient?.id === p.id) setViewingPatient({ ...viewingPatient, patient_name: name, code, email });
    }
  };

  const handleUpdateTest = async (testId: string, patientId: string) => {
    const { error } = await supabase.from("patient_tests").update({ test_name: sanitizeInput(editTestName), result: sanitizeInput(editTestResult) }).eq("id", testId);
    if (error) toast.error("Failed"); else { toast.success("Updated"); setEditingTest(null); await fetchTests(patientId); }
  };

  const handleAddFileToTest = async (testId: string, patientId: string, patientCode: string, file: File) => {
    const err = validateFile(file);
    if (err) { toast.error(err); return; }
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const safeName = `${patientCode.replace(/\//g, "-")}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("result-files").upload(safeName, file);
    if (uploadError) { toast.error("Failed to upload"); return; }
    const test = patientTests[patientId]?.find((t) => t.id === testId);
    const existing = test?.result_file_path || "";
    const newPath = existing ? `${existing},${safeName}` : safeName;
    const { error } = await supabase.from("patient_tests").update({ result_file_path: newPath }).eq("id", testId);
    if (error) toast.error("Failed"); else { toast.success("File added"); await fetchTests(patientId); }
  };

  const handleDeleteFile = async (testId: string, patientId: string, fileToRemove: string) => {
    await supabase.storage.from("result-files").remove([fileToRemove]);
    const test = patientTests[patientId]?.find((t) => t.id === testId);
    if (!test) return;
    const paths = (test.result_file_path || "").split(",").filter((p) => p !== fileToRemove);
    const newPath = paths.length > 0 ? paths.join(",") : null;
    const { error } = await supabase.from("patient_tests").update({ result_file_path: newPath }).eq("id", testId);
    if (error) toast.error("Failed"); else { toast.success("File removed"); await fetchTests(patientId); }
  };

  const updateTest = (idx: number, field: keyof TestEntry, value: string | File[] | null) => setTests((prev) => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  const addTest = () => setTests((prev) => [...prev, emptyTest()]);
  const removeTest = (idx: number) => setTests((prev) => prev.filter((_, i) => i !== idx));
  const updateNewTest = (idx: number, field: keyof TestEntry, value: string | File[] | null) => setNewTests((prev) => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  const addNewTest = () => setNewTests((prev) => [...prev, emptyTest()]);
  const removeNewTest = (idx: number) => setNewTests((prev) => prev.filter((_, i) => i !== idx));

  const handleFileChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>, setter: "main" | "new") => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    for (const file of files) { const err = validateFile(file); if (err) { toast.error(err); e.target.value = ""; return; } }
    if (setter === "main") setTests((prev) => prev.map((t, i) => i === idx ? { ...t, files: [...t.files, ...files] } : t));
    else setNewTests((prev) => prev.map((t, i) => i === idx ? { ...t, files: [...t.files, ...files] } : t));
    e.target.value = "";
  };

  const removeFileFromTest = (idx: number, fileIdx: number, setter: "main" | "new") => {
    if (setter === "main") setTests((prev) => prev.map((t, i) => i === idx ? { ...t, files: t.files.filter((_, fi) => fi !== fileIdx) } : t));
    else setNewTests((prev) => prev.map((t, i) => i === idx ? { ...t, files: t.files.filter((_, fi) => fi !== fileIdx) } : t));
  };

  const filteredPatients = patients.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.code.toLowerCase().includes(q) || (p.email && p.email.toLowerCase().includes(q)) || p.patient_name.toLowerCase().includes(q);
  });

  const renderTestForm = (testList: TestEntry[], add: () => void, remove: (i: number) => void, fileSetter: "main" | "new") => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Tests</h3>
        <Button type="button" variant="outline" size="sm" onClick={add}><Plus className="w-4 h-4 mr-1" /> Add Another Test</Button>
      </div>
      {testList.map((t, idx) => (
        <div key={idx} className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Test {idx + 1}</span>
            {testList.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)} className="text-muted-foreground hover:text-destructive h-7 w-7"><X className="w-4 h-4" /></Button>}
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div><label className="text-xs font-medium text-foreground mb-1 block">Test Name</label><Input placeholder="e.g. Malaria Test" value={t.test_name} onChange={(e) => { fileSetter === "main" ? updateTest(idx, "test_name", e.target.value) : updateNewTest(idx, "test_name", e.target.value); }} maxLength={200} /></div>
            <div><label className="text-xs font-medium text-foreground mb-1 block">Result</label><Input placeholder="e.g. Negative" value={t.result} onChange={(e) => { fileSetter === "main" ? updateTest(idx, "result", e.target.value) : updateNewTest(idx, "result", e.target.value); }} maxLength={500} /></div>
            <div><label className="text-xs font-medium text-foreground mb-1 block">Date</label><Input type="date" value={t.test_date} onChange={(e) => { fileSetter === "main" ? updateTest(idx, "test_date", e.target.value) : updateNewTest(idx, "test_date", e.target.value); }} /></div>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Result Files</label>
            {t.files.length > 0 && <div className="space-y-1 mb-2">{t.files.map((f, fi) => (
              <div key={fi} className="flex items-center gap-2 h-8 px-3 rounded-md border border-input bg-background text-sm">
                <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate flex-1 text-xs">{f.name}</span>
                <button type="button" onClick={() => removeFileFromTest(idx, fi, fileSetter)} className="text-muted-foreground hover:text-destructive"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}</div>}
            <label className="cursor-pointer">
              <input type="file" accept={FILE_ACCEPT} multiple onChange={(e) => handleFileChange(idx, e, fileSetter)} className="hidden" />
              <div className="flex items-center gap-2 h-10 px-4 rounded-md border border-dashed border-input text-sm text-muted-foreground hover:border-primary transition-colors"><Upload className="w-4 h-4" /> Upload Result File (PDF, Image, or Word)</div>
            </label>
          </div>
        </div>
      ))}
    </div>
  );

  // Patient Records View
  if (viewingPatient) {
    const vp = viewingPatient;
    const vpTests = patientTests[vp.id] || [];

    return (
      <div className="space-y-6 max-w-4xl">
        <Button variant="outline" size="sm" onClick={() => setViewingPatient(null)}>← Back to Patients</Button>

        <section className="bg-background rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Patient Information</h2>
            {editingPatient === vp.id ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleUpdatePatient(vp)}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingPatient(null)}>Cancel</Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => { setEditingPatient(vp.id); setEditName(vp.patient_name); setEditEmail(vp.email || ""); setEditCode(vp.code); }}>
                <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
              </Button>
            )}
          </div>
          {editingPatient === vp.id ? (
            <div className="grid sm:grid-cols-3 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label><Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Code</label><Input value={editCode} onChange={(e) => setEditCode(e.target.value)} className="uppercase tracking-wider" /><p className="text-xs text-muted-foreground mt-1">Format: CN/0000/26</p></div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-3 gap-4">
              <div><p className="text-xs text-muted-foreground">Name</p><p className="text-sm font-semibold text-foreground">{vp.patient_name}</p></div>
              <div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm text-foreground">{vp.email || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Code</p><p className="text-sm font-mono font-semibold text-foreground">{vp.code}</p></div>
            </div>
          )}
        </section>

        <section className="bg-background rounded-xl border border-border shadow-sm">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Tests ({vpTests.length})</h2>
            {addingTestFor !== vp.id && <Button size="sm" variant="outline" onClick={() => { setAddingTestFor(vp.id); setNewTests([emptyTest()]); }}><Plus className="w-4 h-4 mr-1" /> Add Test</Button>}
          </div>

          {addingTestFor === vp.id && (
            <div className="p-6 border-b border-border bg-muted/10 space-y-4">
              <div className="flex items-center justify-between"><h4 className="text-sm font-semibold text-foreground">Add New Test</h4><Button variant="ghost" size="sm" onClick={() => { setAddingTestFor(null); setNewTests([emptyTest()]); }}><X className="w-4 h-4 mr-1" /> Cancel</Button></div>
              {renderTestForm(newTests, addNewTest, removeNewTest, "new")}
              <Button onClick={() => handleSubmitNewTests(vp.id, vp.code)} disabled={submittingNewTest}>
                {submittingNewTest ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {submittingNewTest ? "Saving..." : "Save Tests"}
              </Button>
            </div>
          )}

          {vpTests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No tests recorded yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {vpTests.map((t) => {
                const filePaths = t.result_file_path ? t.result_file_path.split(",").filter(Boolean) : [];
                const isEditing = editingTest === t.id;
                return (
                  <div key={t.id} className="p-5 space-y-3">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Test Name</label><Input value={editTestName} onChange={(e) => setEditTestName(e.target.value)} /></div>
                          <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Result</label><Input value={editTestResult} onChange={(e) => setEditTestResult(e.target.value)} /></div>
                        </div>
                        <div className="flex gap-2"><Button size="sm" onClick={() => handleUpdateTest(t.id, vp.id)}>Save</Button><Button size="sm" variant="ghost" onClick={() => setEditingTest(null)}>Cancel</Button></div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-foreground text-sm">{t.test_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{new Date(t.test_date).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}</p>
                          <p className="text-sm text-foreground mt-1">Result: {t.result}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingTest(t.id); setEditTestName(t.test_name); setEditTestResult(t.result); }}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteTest(t.id, vp.id, t.result_file_path)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Files ({filePaths.length})</p>
                      {filePaths.map((fp, fi) => {
                        const ext = fp.split(".").pop()?.toLowerCase() || "";
                        const isWord = ext === "doc" || ext === "docx";
                        const canPreview = !isWord;
                        return (
                          <div key={fi} className="flex items-center gap-2 text-sm bg-muted/30 rounded-lg px-3 py-2">
                            <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate flex-1 text-xs">{fp.split("/").pop()}</span>
                            {canPreview && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setPreviewUrl(getFileUrl(fp)); setPreviewIsImage(isImageFile(fp)); }}>
                                <Eye className="w-3 h-3 mr-1" /> View
                              </Button>
                            )}
                            <a href={getFileUrl(fp)} target="_blank" rel="noopener noreferrer" download>
                              <Button variant="ghost" size="sm" className="h-7 text-xs"><Download className="w-3 h-3 mr-1" /> Download</Button>
                            </a>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteFile(t.id, vp.id, fp)}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        );
                      })}
                      <label className="cursor-pointer">
                        <input type="file" accept={FILE_ACCEPT} className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleAddFileToTest(t.id, vp.id, vp.code, file); e.target.value = ""; }} />
                        <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-dashed border-input text-xs text-muted-foreground hover:border-primary transition-colors w-fit"><Upload className="w-3.5 h-3.5" /> Add File (PDF, Image, or Word)</div>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {previewUrl && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
            <div className="bg-background rounded-xl border border-border shadow-lg max-w-3xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-border flex items-center justify-between"><span className="font-medium text-foreground">File Preview</span><Button variant="ghost" size="sm" onClick={() => setPreviewUrl(null)}>Close</Button></div>
              <div className="p-4">
                {previewIsImage ? <img src={previewUrl} alt="Result" className="w-full max-h-[60vh] object-contain" /> : <iframe src={previewUrl} className="w-full h-[60vh]" title="Result PDF" />}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Patient Toggle */}
      {!showAddForm ? (
        <Button onClick={() => setShowAddForm(true)}><Plus className="w-4 h-4 mr-1" /> Add New Patient</Button>
      ) : (
        <section className="bg-background rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><Plus className="w-5 h-5" /> Add New Patient</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}><X className="w-4 h-4 mr-1" /> Cancel</Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
              <div><label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label><Input placeholder="Full name" value={patientName} onChange={(e) => setPatientName(e.target.value)} maxLength={100} /></div>
              <div><label className="text-sm font-medium text-foreground mb-1.5 block">Patient Email</label><Input type="email" placeholder="patient@email.com" value={patientEmail} onChange={(e) => setPatientEmail(e.target.value)} maxLength={255} /></div>
              <div><label className="text-sm font-medium text-foreground mb-1.5 block">Unique Code</label><Input placeholder="CN/0000/26" value={patientCode} onChange={(e) => setPatientCode(e.target.value)} className="uppercase tracking-wider" maxLength={15} /><p className="text-xs text-muted-foreground mt-1">Format: CN/0000/26</p></div>
            </div>
            {renderTestForm(tests, addTest, removeTest, "main")}
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {submitting ? "Saving..." : "Add Patient"}
            </Button>
          </form>
        </section>
      )}

      {/* Patients List */}
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
          <div className="text-center py-16 text-muted-foreground text-sm">{searchQuery ? "No patients match your search." : "No patients added yet."}</div>
        ) : (
          <div className="divide-y divide-border">
            {filteredPatients.map((p) => (
              <div key={p.id}>
                <div className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => toggleExpand(p.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div className="min-w-0"><p className="text-xs text-muted-foreground">Code</p><p className="font-mono text-sm tracking-wider truncate">{p.code}</p></div>
                      <div className="min-w-0"><p className="text-xs text-muted-foreground">Name</p><p className="text-sm font-medium truncate">{p.patient_name}</p></div>
                      <div className="min-w-0"><p className="text-xs text-muted-foreground">Email</p><p className="text-sm truncate">{p.email || "—"}</p></div>
                      <div className="flex items-center gap-3">
                        <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.approved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{p.approved ? "Approved" : "Pending"}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setViewingPatient(p); fetchTests(p.id); }} className="text-xs hidden sm:flex"><ExternalLink className="w-3.5 h-3.5 mr-1" /> View Records</Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); handleGenerateCodes(p); }}
                      title="Generate result access codes"
                      disabled={generatingFor === p.id}
                      className="text-muted-foreground hover:text-primary"
                    >
                      {generatingFor === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleToggleApproval(p); }} title={p.approved ? "Revoke" : "Approve"} className="text-muted-foreground hover:text-primary"><Check className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeletePatient(p); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    {expandedPatient === p.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>
                {expandedPatient === p.id && (
                  <div className="px-6 pb-2 sm:hidden">
                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => { setViewingPatient(p); fetchTests(p.id); }}><ExternalLink className="w-3.5 h-3.5 mr-1" /> View Patient Records</Button>
                  </div>
                )}
                {expandedPatient === p.id && (
                  <div className="px-6 pb-4 bg-muted/10 space-y-4">
                    {!patientTests[p.id] ? (
                      <div className="py-4 flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
                    ) : patientTests[p.id].length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">No tests recorded.</p>
                    ) : (
                      <Table>
                        <TableHeader><TableRow><TableHead>Test</TableHead><TableHead>Result</TableHead><TableHead>Date</TableHead><TableHead>Files</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
                        <TableBody>
                          {patientTests[p.id].map((t) => {
                            const filePaths = t.result_file_path ? t.result_file_path.split(",").filter(Boolean) : [];
                            return (
                              <TableRow key={t.id}>
                                <TableCell className="font-medium">{t.test_name}</TableCell>
                                <TableCell>{t.result}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">{new Date(t.test_date).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}</TableCell>
                                <TableCell>{filePaths.length > 0 ? <span className="text-xs text-primary font-medium">{filePaths.length} file{filePaths.length > 1 ? "s" : ""}</span> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                                <TableCell><Button variant="ghost" size="icon" onClick={() => handleDeleteTest(t.id, p.id, t.result_file_path)} className="text-muted-foreground hover:text-destructive h-7 w-7"><Trash2 className="w-3 h-3" /></Button></TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                    {addingTestFor === p.id ? (
                      <div className="border border-border rounded-lg p-4 bg-background space-y-4">
                        <div className="flex items-center justify-between"><h4 className="text-sm font-semibold text-foreground">Add New Test</h4><Button variant="ghost" size="sm" onClick={() => { setAddingTestFor(null); setNewTests([emptyTest()]); }}><X className="w-4 h-4 mr-1" /> Cancel</Button></div>
                        {renderTestForm(newTests, addNewTest, removeNewTest, "new")}
                        <Button onClick={() => handleSubmitNewTests(p.id, p.code)} disabled={submittingNewTest} className="w-full sm:w-auto">
                          {submittingNewTest ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          {submittingNewTest ? "Saving..." : "Save Tests"}
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setAddingTestFor(p.id); setNewTests([emptyTest()]); }}><Plus className="w-4 h-4 mr-1" /> Add New Test</Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Result codes modal */}
      {codesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setCodesModal(null)}>
          <div className="bg-background rounded-xl border border-border shadow-lg max-w-2xl w-full max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Result Access Codes</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {codesModal.patient.name}
                  {codesModal.patient.email ? ` — ${codesModal.patient.email}` : " — no email on file"}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCodesModal(null)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="p-5 space-y-3">
              {!codesModal.patient.email && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                  This patient has no email saved. Codes were created but no email could be sent — share the link manually.
                </div>
              )}
              {codesModal.codes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No codes generated.</p>
              ) : (
                codesModal.codes.map((c, i) => {
                  const msg = `Hi ${codesModal.patient.name}, your "${c.test_name}" result is ready.\n\nCode: ${c.code}\nView: ${c.link}\n\n— Ciana Diagnostics`;
                  return (
                    <div key={i} className="border border-border rounded-lg p-4 space-y-2 bg-muted/20">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{c.test_name}</p>
                          <p className="font-mono text-base text-primary mt-1 tracking-wider">{c.code}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => copy(c.code)}>
                          <Copy className="w-3.5 h-3.5 mr-1" /> Code
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background border border-border rounded-md px-2 py-1.5 truncate">
                        <span className="truncate flex-1">{c.link}</span>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => copy(c.link)}>
                          <Copy className="w-3 h-3 mr-1" /> Link
                        </Button>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank")}
                        >
                          <MessageCircle className="w-3.5 h-3.5 mr-1" /> Send via WhatsApp
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => copy(msg)}>
                          <Copy className="w-3.5 h-3.5 mr-1" /> Copy full message
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
              <p className="text-xs text-muted-foreground pt-2">
                Email sending is set up but not active yet (a verified domain is required). Codes were created and the email function was called as a stub. Share via WhatsApp/SMS for now.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsSection;
