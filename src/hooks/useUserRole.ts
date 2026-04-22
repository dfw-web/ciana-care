import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "owner" | "staff" | "admin" | "patient";

// Race a promise against a timeout so mobile networks can't hang the UI forever.
const withTimeout = <T,>(p: Promise<T>, ms: number, label: string): Promise<T> =>
  Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`[useUserRole] ${label} timed out after ${ms}ms`)), ms)
    ),
  ]);

export function useUserRole() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchRoles = async (userId: string) => {
      try {
        const { data, error: qErr } = await withTimeout(
          Promise.resolve(supabase.from("user_roles").select("role").eq("user_id", userId)),
          8000,
          "user_roles query"
        );
        if (!active) return;
        if (qErr) {
          console.error("[useUserRole] role query error:", qErr);
          setError(qErr.message);
          setRoles([]);
        } else {
          setRoles(((data || []).map((r: { role: AppRole }) => r.role)) as AppRole[]);
          setError(null);
        }
      } catch (e) {
        if (!active) return;
        console.error("[useUserRole]", e);
        setError(e instanceof Error ? e.message : "Failed to load role");
        setRoles([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    const init = async () => {
      try {
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          5000,
          "getSession"
        );
        if (!active) return;
        if (!session) {
          lastUserIdRef.current = null;
          setRoles([]);
          setLoading(false);
          return;
        }
        lastUserIdRef.current = session.user.id;
        await fetchRoles(session.user.id);
      } catch (e) {
        if (!active) return;
        console.error("[useUserRole] init failed:", e);
        setError(e instanceof Error ? e.message : "Auth check failed");
        setRoles([]);
        setLoading(false);
      }
    };

    init();

    // Only refetch roles when the user identity actually changes — prevents loops.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newId = session?.user?.id ?? null;
      if (newId === lastUserIdRef.current) return;
      lastUserIdRef.current = newId;
      if (!newId) {
        setRoles([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      // Defer to avoid running async work inside the auth callback (deadlock risk).
      setTimeout(() => { void fetchRoles(newId); }, 0);
    });

    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  // Treat legacy 'admin' as owner for backward compatibility
  const isOwner = roles.includes("owner") || roles.includes("admin");
  const isStaff = roles.includes("staff") || isOwner;

  return { roles, isOwner, isStaff, loading, error };
}
