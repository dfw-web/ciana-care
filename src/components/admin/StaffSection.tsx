import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, UserCog, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type StaffUser = { id: string; email: string; created_at: string; roles: string[] };
type LogEntry = { id: string; staff_name: string; action: string; created_at: string };

const StaffSection = () => {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "staff" as "owner" | "staff" });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [staffRes, logRes] = await Promise.all([
      supabase.functions.invoke("manage-staff", { body: { action: "list" } }),
      supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    if (staffRes.error) toast.error("Failed to load staff");
    else setStaff(staffRes.data?.staff || []);
    setLogs((logRes.data || []) as LogEntry[]);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ email: "", password: "", full_name: "", role: "staff" });
    setDialogOpen(true);
  };

  const openEdit = (u: StaffUser) => {
    setEditing(u);
    const role = u.roles.includes("owner") || u.roles.includes("admin") ? "owner" : "staff";
    setForm({ email: u.email, password: "", full_name: "", role });
    setDialogOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    if (editing) {
      const payload: Record<string, unknown> = { action: "update", user_id: editing.id, role: form.role };
      if (form.email && form.email !== editing.email) payload.email = form.email;
      if (form.password) payload.password = form.password;
      const { error } = await supabase.functions.invoke("manage-staff", { body: payload });
      if (error) toast.error("Update failed");
      else { toast.success("Staff updated"); setDialogOpen(false); fetchAll(); }
    } else {
      if (!form.email || !form.password) { toast.error("Email and password required"); setSaving(false); return; }
      const { error } = await supabase.functions.invoke("manage-staff", {
        body: { action: "create", email: form.email, password: form.password, full_name: form.full_name, role: form.role },
      });
      if (error) toast.error("Create failed");
      else { toast.success("Staff created"); setDialogOpen(false); fetchAll(); }
    }
    setSaving(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.functions.invoke("manage-staff", { body: { action: "delete", user_id: deleteId } });
    if (error) toast.error("Delete failed");
    else { toast.success("Deleted"); fetchAll(); }
    setDeleteId(null);
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-background rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <UserCog className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Staff Management</h2>
              <p className="text-sm text-muted-foreground">Create and manage owner & staff accounts.</p>
            </div>
          </div>
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Add Staff</Button>
        </div>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users ({staff.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity Log ({logs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="bg-background rounded-xl border border-border shadow-sm">
          {staff.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No staff yet.</div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((u) => {
                    const isOwner = u.roles.includes("owner") || u.roles.includes("admin");
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.email}</TableCell>
                        <TableCell>
                          <span className={`text-xs font-semibold uppercase px-2 py-1 rounded ${isOwner ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {isOwner ? "Owner" : "Staff"}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{new Date(u.created_at).toLocaleDateString("en-NG")}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(u)}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(u.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="bg-background rounded-xl border border-border shadow-sm">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No activity yet.</div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Action</TableHead><TableHead>When</TableHead></TableRow></TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.staff_name}</TableCell>
                      <TableCell className="text-sm">{log.action}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{new Date(log.created_at).toLocaleString("en-NG")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Staff" : "Create Staff"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {!editing && (
              <Input placeholder="Full name (optional)" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            )}
            <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input type="password" placeholder={editing ? "New password (leave blank to keep)" : "Password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as "owner" | "staff" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>This permanently deletes the account and access.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StaffSection;
