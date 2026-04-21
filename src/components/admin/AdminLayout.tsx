import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import cianaLogo from "@/assets/ciana-logo.png";
import {
  LayoutDashboard, Users, Stethoscope, Package, DollarSign, UserCog, LogOut, Menu, X, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";

export type AdminSection = "dashboard" | "patients" | "services" | "stock" | "finance" | "staff";

const NAV_ITEMS: { key: AdminSection; label: string; icon: React.ElementType; ownerOnly?: boolean }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "patients", label: "Patients", icon: Users },
  { key: "services", label: "Services", icon: Stethoscope },
  { key: "stock", label: "Stock Management", icon: Package },
  { key: "finance", label: "Finance", icon: DollarSign, ownerOnly: true },
  { key: "staff", label: "Staff Management", icon: UserCog, ownerOnly: true },
];

interface AdminLayoutProps {
  activeSection: AdminSection;
  onSectionChange: (s: AdminSection) => void;
  children: React.ReactNode;
}

const AdminLayout = ({ activeSection, onSectionChange, children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const { isOwner, loading: roleLoading } = useUserRole();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/admin", { replace: true });
      else setUserEmail(session.user.email || "Admin");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/admin", { replace: true });
      else setUserEmail(session.user.email || "Admin");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin", { replace: true });
  };

  const visibleNav = NAV_ITEMS.filter((n) => !n.ownerOnly || isOwner);

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen w-64 bg-background border-r border-border flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={cianaLogo} alt="Ciana" className="h-8 w-auto" />
            <span className="font-semibold text-foreground text-sm">{isOwner ? "Owner Panel" : "Staff Panel"}</span>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleNav.map((item) => (
            <button
              key={item.key}
              onClick={() => { onSectionChange(item.key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeSection === item.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
              {activeSection === item.key && <ChevronRight className="w-3 h-3 ml-auto" />}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <div className="px-3 py-2">
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            {!roleLoading && (
              <p className="text-[10px] uppercase tracking-wide text-primary font-semibold mt-0.5">
                {isOwner ? "Owner" : "Staff"}
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-background border-b border-border sticky top-0 z-30 h-14 flex items-center px-4 gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-foreground capitalize">
            {NAV_ITEMS.find((n) => n.key === activeSection)?.label || "Dashboard"}
          </h1>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
