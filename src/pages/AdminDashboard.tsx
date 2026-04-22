import { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminLayout, { type AdminSection } from "@/components/admin/AdminLayout";
import AdminDashboardHome from "@/components/admin/AdminDashboardHome";
import PatientsSection from "@/components/admin/PatientsSection";
import ServicesSection from "@/components/admin/ServicesSection";
import StockManagement from "@/components/admin/StockManagement";
import FinanceSection from "@/components/admin/FinanceSection";
import StaffSection from "@/components/admin/StaffSection";
import { useUserRole } from "@/hooks/useUserRole";
import { useEffect, useState as useReactState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldAlert, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const OWNER_ONLY: AdminSection[] = ["finance", "staff"];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [section, setSection] = useState<AdminSection>("dashboard");
  const { isOwner, loading, error } = useUserRole();
  const [authChecked, setAuthChecked] = useReactState(false);
  const [hasSession, setHasSession] = useReactState(false);

  // Independent auth gate so a slow role query never blocks redirecting unauth users.
  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => {
      if (active && !authChecked) {
        console.warn("[AdminDashboard] auth check timed out — redirecting to login");
        setAuthChecked(true);
        setHasSession(false);
      }
    }, 6000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      clearTimeout(timeout);
      setHasSession(!!session);
      setAuthChecked(true);
      if (!session) navigate("/admin", { replace: true });
    }).catch((e) => {
      console.error("[AdminDashboard] getSession failed:", e);
      if (!active) return;
      clearTimeout(timeout);
      setAuthChecked(true);
      setHasSession(false);
      navigate("/admin", { replace: true });
    });

    return () => { active = false; clearTimeout(timeout); };
  }, [navigate, authChecked]);

  const handleSectionChange = (s: AdminSection) => {
    if (OWNER_ONLY.includes(s) && !isOwner) {
      toast.error("Access Denied", { description: "Only owners can access this section." });
      setSection("dashboard");
      return;
    }
    setSection(s);
  };

  if (!authChecked || (hasSession && loading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Loading admin panel…</p>
      </div>
    );
  }

  if (hasSession && error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center">
        <AlertTriangle className="w-10 h-10 text-destructive" />
        <h2 className="text-lg font-semibold text-foreground">Couldn't load your permissions</h2>
        <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
          <Button onClick={async () => { await supabase.auth.signOut(); navigate("/admin", { replace: true }); }}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  const blocked = OWNER_ONLY.includes(section) && !isOwner;

  return (
    <AdminLayout activeSection={section} onSectionChange={handleSectionChange}>
      {blocked ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ShieldAlert className="w-12 h-12 text-destructive mb-3" />
          <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground mt-1">You don't have permission to view this section.</p>
        </div>
      ) : (
        <>
          {section === "dashboard" && <AdminDashboardHome />}
          {section === "patients" && <PatientsSection />}
          {section === "services" && <ServicesSection />}
          {section === "stock" && <StockManagement />}
          {section === "finance" && isOwner && <FinanceSection />}
          {section === "staff" && isOwner && <StaffSection />}
        </>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
