import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Package, DollarSign, AlertTriangle, Loader2 } from "lucide-react";

const AdminDashboardHome = () => {
  const [stats, setStats] = useState({ patients: 0, lowStock: 0, todayIncome: 0, todayExpenses: 0 });
  const [recentLogs, setRecentLogs] = useState<{ action: string; staff_name: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [pRes, iRes, incRes, expRes, logRes] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }),
        supabase.from("inventory_items").select("id, quantity").lt("quantity", 10),
        supabase.from("finance_income").select("amount").eq("date", new Date().toISOString().split("T")[0]),
        supabase.from("finance_expenses").select("amount").eq("date", new Date().toISOString().split("T")[0]),
        supabase.from("activity_log").select("action, staff_name, created_at").order("created_at", { ascending: false }).limit(10),
      ]);

      const todayIncome = (incRes.data || []).reduce((s, r) => s + Number(r.amount), 0);
      const todayExpenses = (expRes.data || []).reduce((s, r) => s + Number(r.amount), 0);

      setStats({
        patients: pRes.count || 0,
        lowStock: (iRes.data || []).length,
        todayIncome,
        todayExpenses,
      });
      setRecentLogs(logRes.data || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  const cards = [
    { label: "Total Patients", value: stats.patients, icon: Users, color: "text-primary" },
    { label: "Low Stock Items", value: stats.lowStock, icon: AlertTriangle, color: stats.lowStock > 0 ? "text-destructive" : "text-green-600" },
    { label: "Today's Income", value: `₦${stats.todayIncome.toLocaleString()}`, icon: DollarSign, color: "text-green-600" },
    { label: "Today's Expenses", value: `₦${stats.todayExpenses.toLocaleString()}`, icon: DollarSign, color: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-background rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${c.color}`}>
                <c.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-xl font-bold text-foreground">{c.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-background rounded-xl border border-border shadow-sm">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold text-foreground">Recent Activity</h2>
        </div>
        {recentLogs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No recent activity.</div>
        ) : (
          <div className="divide-y divide-border">
            {recentLogs.map((log, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{log.action}</p>
                  <p className="text-xs text-muted-foreground">{log.staff_name}</p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
                  {new Date(log.created_at).toLocaleString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardHome;
