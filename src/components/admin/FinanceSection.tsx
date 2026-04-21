import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

type Income = { id: string; amount: number; source: string; date: string; };
type Expense = { id: string; amount: number; description: string; date: string; };

// Get today's date in Nigeria (Africa/Lagos) as YYYY-MM-DD
const nigeriaToday = () => {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit",
  });
  return fmt.format(new Date()); // en-CA → YYYY-MM-DD
};

const nigeriaYearStart = () => `${nigeriaToday().slice(0, 4)}-01-01`;

const nigeriaDaysAgo = (days: number) => {
  const today = nigeriaToday();
  const d = new Date(`${today}T00:00:00+01:00`);
  d.setDate(d.getDate() - days);
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit",
  });
  return fmt.format(d);
};

const FinanceSection = () => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const [incAmount, setIncAmount] = useState("");
  const [incSource, setIncSource] = useState("");
  const [incDate, setIncDate] = useState(nigeriaToday());

  const [expAmount, setExpAmount] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expDate, setExpDate] = useState(nigeriaToday());

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [iRes, eRes] = await Promise.all([
      supabase.from("finance_income").select("*").order("date", { ascending: false }).limit(500),
      supabase.from("finance_expenses").select("*").order("date", { ascending: false }).limit(500),
    ]);
    setIncomes((iRes.data || []) as Income[]);
    setExpenses((eRes.data || []) as Expense[]);
    setLoading(false);
  };

  const addIncome = async () => {
    if (!incAmount || !incSource.trim()) { toast.error("Amount and source required"); return; }
    const { error } = await supabase.from("finance_income").insert({ amount: Number(incAmount), source: incSource.trim(), date: incDate });
    if (error) toast.error("Failed to add"); else { toast.success("Income added"); setIncAmount(""); setIncSource(""); fetchAll(); }
  };

  const addExpense = async () => {
    if (!expAmount || !expDesc.trim()) { toast.error("Amount and description required"); return; }
    const { error } = await supabase.from("finance_expenses").insert({ amount: Number(expAmount), description: expDesc.trim(), date: expDate });
    if (error) toast.error("Failed to add"); else { toast.success("Expense added"); setExpAmount(""); setExpDesc(""); fetchAll(); }
  };

  const deleteIncome = async (id: string) => {
    const { error } = await supabase.from("finance_income").delete().eq("id", id);
    if (error) toast.error("Failed"); else { toast.success("Deleted"); fetchAll(); }
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from("finance_expenses").delete().eq("id", id);
    if (error) toast.error("Failed"); else { toast.success("Deleted"); fetchAll(); }
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  const today = nigeriaToday();
  const thirtyDaysAgo = nigeriaDaysAgo(30);
  const yearStart = nigeriaYearStart();

  const sumRange = (arr: { amount: number; date: string }[], from: string, to?: string) =>
    arr.filter((r) => r.date >= from && (!to || r.date <= to)).reduce((s, r) => s + Number(r.amount), 0);

  const dailyInc = sumRange(incomes, today, today);
  const dailyExp = sumRange(expenses, today, today);
  const monthlyInc = sumRange(incomes, thirtyDaysAgo);
  const monthlyExp = sumRange(expenses, thirtyDaysAgo);
  const yearlyInc = sumRange(incomes, yearStart);
  const yearlyExp = sumRange(expenses, yearStart);

  const periods = [
    { label: "Today", inc: dailyInc, exp: dailyExp },
    { label: "Last 30 Days", inc: monthlyInc, exp: monthlyExp },
    { label: "This Year", inc: yearlyInc, exp: yearlyExp },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {periods.map((p) => {
          const net = p.inc - p.exp;
          const positive = net >= 0;
          return (
            <div key={p.label} className="bg-background rounded-xl border border-border shadow-sm p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{p.label}</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-green-600"><TrendingUp className="w-3.5 h-3.5" /> Income</span>
                  <span className="font-semibold text-foreground">₦{p.inc.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-destructive"><TrendingDown className="w-3.5 h-3.5" /> Expenses</span>
                  <span className="font-semibold text-foreground">₦{p.exp.toLocaleString()}</span>
                </div>
              </div>
              <div className={`pt-3 border-t border-border flex items-center justify-between ${positive ? "text-green-600" : "text-destructive"}`}>
                <span className="text-xs font-medium">{positive ? "Net Profit" : "Net Loss"}</span>
                <span className="font-bold text-base">₦{Math.abs(net).toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      <Tabs defaultValue="income">
        <TabsList>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="income" className="bg-background rounded-xl border border-border shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input type="number" placeholder="Amount (₦)" value={incAmount} onChange={(e) => setIncAmount(e.target.value)} className="sm:w-32" />
            <Input placeholder="Source" value={incSource} onChange={(e) => setIncSource(e.target.value)} className="sm:flex-1" />
            <Input type="date" value={incDate} onChange={(e) => setIncDate(e.target.value)} className="sm:w-40" />
            <Button onClick={addIncome}><Plus className="w-4 h-4 mr-1" /> Add</Button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Amount</TableHead><TableHead>Source</TableHead><TableHead>Date</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
            <TableBody>
              {incomes.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No income records.</TableCell></TableRow>
              ) : incomes.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-semibold text-green-600">₦{Number(r.amount).toLocaleString()}</TableCell>
                  <TableCell>{r.source}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(r.date).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteIncome(r.id)}><Trash2 className="w-3.5 h-3.5" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="expenses" className="bg-background rounded-xl border border-border shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input type="number" placeholder="Amount (₦)" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} className="sm:w-32" />
            <Input placeholder="Description" value={expDesc} onChange={(e) => setExpDesc(e.target.value)} className="sm:flex-1" />
            <Input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} className="sm:w-40" />
            <Button onClick={addExpense}><Plus className="w-4 h-4 mr-1" /> Add</Button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Amount</TableHead><TableHead>Description</TableHead><TableHead>Date</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No expense records.</TableCell></TableRow>
              ) : expenses.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-semibold text-destructive">₦{Number(r.amount).toLocaleString()}</TableCell>
                  <TableCell>{r.description}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(r.date).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteExpense(r.id)}><Trash2 className="w-3.5 h-3.5" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceSection;
