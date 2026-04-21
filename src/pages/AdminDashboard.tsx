import { useState } from "react";
import { toast } from "sonner";
import AdminLayout, { type AdminSection } from "@/components/admin/AdminLayout";
import AdminDashboardHome from "@/components/admin/AdminDashboardHome";
import PatientsSection from "@/components/admin/PatientsSection";
import ServicesSection from "@/components/admin/ServicesSection";
import StockManagement from "@/components/admin/StockManagement";
import FinanceSection from "@/components/admin/FinanceSection";
import StaffSection from "@/components/admin/StaffSection";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, ShieldAlert } from "lucide-react";

const OWNER_ONLY: AdminSection[] = ["finance", "staff"];

const AdminDashboard = () => {
  const [section, setSection] = useState<AdminSection>("dashboard");
  const { isOwner, loading } = useUserRole();

  const handleSectionChange = (s: AdminSection) => {
    if (OWNER_ONLY.includes(s) && !isOwner) {
      toast.error("Access Denied", { description: "Only owners can access this section." });
      setSection("dashboard");
      return;
    }
    setSection(s);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
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
