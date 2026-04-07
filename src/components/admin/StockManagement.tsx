import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Pencil, Trash2, AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";

type Item = {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
};

type Usage = {
  id: string;
  item_name: string;
  quantity_used: number;
  staff_name: string;
  total_cost: number;
  used_at: string;
};

const StockManagement = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [usage, setUsage] = useState<Usage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add item form
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Laboratory Consumables");
  const [newPrice, setNewPrice] = useState("");
  const [newQty, setNewQty] = useState("");

  // Edit item
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editQty, setEditQty] = useState("");

  // Usage form
  const [useItemId, setUseItemId] = useState("");
  const [useQty, setUseQty] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [staffEmail, setStaffEmail] = useState("Admin");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setStaffEmail(session.user.email || "Admin");
    });
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [iRes, uRes] = await Promise.all([
      supabase.from("inventory_items").select("*").order("name"),
      supabase.from("stock_usage").select("*").order("used_at", { ascending: false }).limit(100),
    ]);
    setItems((iRes.data || []) as Item[]);
    setUsage((uRes.data || []) as Usage[]);
    setLoading(false);
  };

  const logActivity = async (action: string) => {
    await supabase.from("activity_log").insert({ staff_name: staffEmail, action });
  };

  const handleAddItem = async () => {
    if (!newName.trim() || !newPrice) { toast.error("Name and price are required"); return; }
    const { error } = await supabase.from("inventory_items").insert({
      name: newName.trim(),
      category: newCategory,
      price: Number(newPrice),
      quantity: Number(newQty) || 0,
    });
    if (error) toast.error("Failed to add item");
    else {
      toast.success("Item added");
      await logActivity(`Added inventory item: ${newName.trim()}`);
      setNewName(""); setNewPrice(""); setNewQty(""); setShowAdd(false);
      fetchAll();
    }
  };

  const handleUpdateItem = async (id: string) => {
    const { error } = await supabase.from("inventory_items").update({
      name: editName.trim(),
      price: Number(editPrice),
      quantity: Number(editQty),
    }).eq("id", id);
    if (error) toast.error("Failed to update");
    else {
      toast.success("Item updated");
      await logActivity(`Updated inventory item: ${editName.trim()}`);
      setEditId(null);
      fetchAll();
    }
  };

  const handleDeleteItem = async (item: Item) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    const { error } = await supabase.from("inventory_items").delete().eq("id", item.id);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Item deleted");
      await logActivity(`Deleted inventory item: ${item.name}`);
      fetchAll();
    }
  };

  const handleUseStock = async () => {
    if (!useItemId || !useQty || Number(useQty) <= 0) { toast.error("Select item and enter quantity"); return; }
    const item = items.find((i) => i.id === useItemId);
    if (!item) return;
    const qty = Number(useQty);
    if (qty > item.quantity) { toast.error("Not enough stock available"); return; }

    setSubmitting(true);
    const totalCost = qty * item.price;

    const { error: usageErr } = await supabase.from("stock_usage").insert({
      item_id: item.id,
      item_name: item.name,
      quantity_used: qty,
      staff_name: staffEmail,
      total_cost: totalCost,
    });
    if (usageErr) { toast.error("Failed to record usage"); setSubmitting(false); return; }

    const { error: updateErr } = await supabase.from("inventory_items").update({
      quantity: item.quantity - qty,
    }).eq("id", item.id);
    if (updateErr) toast.error("Failed to update stock");
    else {
      toast.success(`Used ${qty}x ${item.name}`);
      await logActivity(`Used ${qty}x ${item.name} (₦${totalCost.toLocaleString()})`);
    }

    setUseItemId(""); setUseQty("");
    setSubmitting(false);
    fetchAll();
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  const filterItems = (cat: string) =>
    items.filter((i) => i.category === cat && (!search || i.name.toLowerCase().includes(search.toLowerCase())));

  const renderItemsTable = (cat: string) => {
    const filtered = filterItems(cat);
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button size="sm" onClick={() => { setShowAdd(true); setNewCategory(cat); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Item
          </Button>
        </div>

        {showAdd && newCategory === cat && (
          <div className="bg-muted/20 border border-border rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold">Add New Item</h4>
            <div className="grid sm:grid-cols-3 gap-3">
              <Input placeholder="Item name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input type="number" placeholder="Price (₦)" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
              <Input type="number" placeholder="Quantity" value={newQty} onChange={(e) => setNewQty(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddItem}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Price (₦)</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No items found.</TableCell></TableRow>
              ) : filtered.map((item) => (
                <TableRow key={item.id}>
                  {editId === item.id ? (
                    <>
                      <TableCell><Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" /></TableCell>
                      <TableCell><Input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="h-8 w-24" /></TableCell>
                      <TableCell><Input type="number" value={editQty} onChange={(e) => setEditQty(e.target.value)} className="h-8 w-20" /></TableCell>
                      <TableCell />
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleUpdateItem(item.id)}>Save</Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditId(null)}>Cancel</Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>₦{item.price.toLocaleString()}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        {item.quantity < 10 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
                            <AlertTriangle className="w-3 h-3" /> LOW
                          </span>
                        ) : (
                          <span className="text-xs text-green-600 font-medium">In Stock</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditId(item.id); setEditName(item.name); setEditPrice(String(item.price)); setEditQty(String(item.quantity)); }}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteItem(item)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Use Stock Card */}
      <div className="bg-background rounded-xl border border-border shadow-sm p-5">
        <h3 className="font-semibold text-foreground mb-3">Record Stock Usage</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            className="flex h-10 w-full sm:w-64 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={useItemId}
            onChange={(e) => setUseItemId(e.target.value)}
          >
            <option value="">Select item...</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>{i.name} (Qty: {i.quantity})</option>
            ))}
          </select>
          <Input type="number" placeholder="Quantity used" value={useQty} onChange={(e) => setUseQty(e.target.value)} className="w-full sm:w-32" min={1} />
          <Button onClick={handleUseStock} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Use Stock
          </Button>
        </div>
      </div>

      <Tabs defaultValue="lab">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="lab">Laboratory Consumables</TabsTrigger>
          <TabsTrigger value="drugs">Drugs & Treatment</TabsTrigger>
          <TabsTrigger value="usage">Usage Records</TabsTrigger>
        </TabsList>

        <TabsContent value="lab" className="bg-background rounded-xl border border-border shadow-sm p-5">
          {renderItemsTable("Laboratory Consumables")}
        </TabsContent>

        <TabsContent value="drugs" className="bg-background rounded-xl border border-border shadow-sm p-5">
          {renderItemsTable("Drugs & Treatment")}
        </TabsContent>

        <TabsContent value="usage" className="bg-background rounded-xl border border-border shadow-sm p-5">
          <h3 className="font-semibold text-foreground mb-4">Usage Records</h3>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Qty Used</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Date & Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usage.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No usage records yet.</TableCell></TableRow>
                ) : usage.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.item_name}</TableCell>
                    <TableCell>{u.quantity_used}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{u.staff_name}</TableCell>
                    <TableCell>₦{u.total_cost.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(u.used_at).toLocaleString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockManagement;
