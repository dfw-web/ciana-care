import { useState } from "react";
import AdminLayout, { type AdminSection } from "@/components/admin/AdminLayout";
import AdminDashboardHome from "@/components/admin/AdminDashboardHome";
import PatientsSection from "@/components/admin/PatientsSection";
import ServicesSection from "@/components/admin/ServicesSection";
import StockManagement from "@/components/admin/StockManagement";
import FinanceSection from "@/components/admin/FinanceSection";
import StaffSection from "@/components/admin/StaffSection";

const AdminDashboard = () => {
  const [section, setSection] = useState<AdminSection>("dashboard");

  return (
    <AdminLayout activeSection={section} onSectionChange={setSection}>
      {section === "dashboard" && <AdminDashboardHome />}
      {section === "patients" && <PatientsSection />}
      {section === "services" && <ServicesSection />}
      {section === "stock" && <StockManagement />}
      {section === "finance" && <FinanceSection />}
      {section === "staff" && <StaffSection />}
    </AdminLayout>
  );
};

export default AdminDashboard;
