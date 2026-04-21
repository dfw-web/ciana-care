import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "owner" | "staff" | "admin" | "patient";

export function useUserRole() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (active) { setRoles([]); setLoading(false); }
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      if (active) {
        setRoles(((data || []).map((r: { role: AppRole }) => r.role)) as AppRole[]);
        setLoading(false);
      }
    };
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load());
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  // Treat legacy 'admin' as owner for backward compatibility
  const isOwner = roles.includes("owner") || roles.includes("admin");
  const isStaff = roles.includes("staff") || isOwner;

  return { roles, isOwner, isStaff, loading };
}
