import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Stethoscope, Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

type Service = {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  created_at: string;
};

const CATEGORIES = [
  "LIVER FUNCTION",
  "KIDNEY",
  "CARDIOVASCULAR SYSTEM",
  "GASTROINTESTINAL TRACT",
  "MUSCULOSKELETAL FUNCTION",
  "TUMOUR MARKERS",
  "METABOLIC DISORDERS",
  "HEMATOLOGY",
  "GENERAL TESTS",
  "MICROBIOLOGY",
  "SEROLOGY & IMMUNOLOGY",
  "HEMATOLOGY & COAGULATION",
  "ULTRASOUND SCANS",
];

const formatPrice = (price: number) =>
  price === 0 ? "Price TBD" : `₦${price.toLocaleString("en-NG")}`;

const ServicesSection = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("category")
      .order("name");
    if (error) {
      toast.error("Failed to load services");
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchServices(); }, []);

  const openAdd = () => {
    setEditing(null);
    setFormName("");
    setFormPrice("");
    setFormCategory(CATEGORIES[0]);
    setFormDescription("");
    setDialogOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setFormName(s.name);
    setFormPrice(String(s.price));
    setFormCategory(s.category);
    setFormDescription(s.description || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formCategory) {
      toast.error("Name and category are required");
      return;
    }
    const price = Number(formPrice) || 0;
    setSaving(true);

    if (editing) {
      const { error } = await supabase
        .from("services")
        .update({ name: formName.trim(), price, category: formCategory, description: formDescription.trim() })
        .eq("id", editing.id);
      if (error) toast.error("Failed to update");
      else toast.success("Service updated");
    } else {
      const { error } = await supabase
        .from("services")
        .insert({ name: formName.trim(), price, category: formCategory, description: formDescription.trim() });
      if (error) toast.error("Failed to add");
      else toast.success("Service added");
    }
    setSaving(false);
    setDialogOpen(false);
    fetchServices();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("services").delete().eq("id", deleteTarget.id);
    if (error) toast.error("Failed to delete");
    else toast.success("Service deleted");
    setDeleteTarget(null);
    fetchServices();
  };

  const q = search.trim().toLowerCase();
  const filtered = services.filter((s) => {
    if (filterCategory !== "all" && s.category !== filterCategory) return false;
    if (q && !s.name.toLowerCase().includes(q) && !s.category.toLowerCase().includes(q)) return false;
    return true;
  });

  // Group by category for display
  const grouped: Record<string, Service[]> = {};
  filtered.forEach((s) => {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  });

  return (
    <div className="space-y-6">
      <div className="bg-background rounded-xl border border-border shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Stethoscope className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Services Management</h2>
          </div>
          <Button onClick={openAdd} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Add Service
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              maxLength={100}
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm text-center py-8">Loading...</p>
        ) : Object.keys(grouped).length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">No services found.</p>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">{category}</h3>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Name</TableHead>
                      <TableHead className="w-[120px]">Price</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <span className="font-medium text-foreground">{s.name}</span>
                          {s.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-primary">{formatPrice(s.price)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(s)} className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Service" : "Add Service"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the service details below." : "Fill in the details to add a new service."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Service Name *</label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Full Blood Count" maxLength={200} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Price (₦) *</label>
              <Input type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="0" min={0} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Category *</label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Description (optional)</label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description..." maxLength={500} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServicesSection;
