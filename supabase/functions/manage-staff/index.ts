import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Action =
  | { action: "list" }
  | { action: "create"; email: string; password: string; full_name?: string; role: "owner" | "staff" }
  | { action: "update"; user_id: string; email?: string; password?: string; role?: "owner" | "staff" }
  | { action: "delete"; user_id: string };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(supabaseUrl, serviceKey);

    // Verify caller is owner (or legacy admin)
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const callerRoles = (roles || []).map((r: { role: string }) => r.role);
    const isOwner = callerRoles.includes("owner") || callerRoles.includes("admin");
    if (!isOwner) {
      return new Response(JSON.stringify({ error: "Forbidden: owners only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = (await req.json()) as Action;

    if (body.action === "list") {
      const { data: usersList, error } = await admin.auth.admin.listUsers();
      if (error) throw error;
      const { data: allRoles } = await admin.from("user_roles").select("user_id, role");
      const roleMap = new Map<string, string[]>();
      (allRoles || []).forEach((r: { user_id: string; role: string }) => {
        const arr = roleMap.get(r.user_id) || [];
        arr.push(r.role);
        roleMap.set(r.user_id, arr);
      });
      const staff = usersList.users
        .map((u) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          roles: roleMap.get(u.id) || [],
        }))
        .filter((u) => u.roles.includes("owner") || u.roles.includes("admin") || u.roles.includes("staff"));
      return new Response(JSON.stringify({ staff }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (body.action === "create") {
      const { data: created, error } = await admin.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: { full_name: body.full_name || "" },
      });
      if (error) throw error;
      const newId = created.user!.id;
      const { error: roleErr } = await admin.from("user_roles").insert({ user_id: newId, role: body.role });
      if (roleErr) {
        // Roll back: delete the auth user so we don't leave an account with no role
        await admin.auth.admin.deleteUser(newId);
        throw new Error(`Role assignment failed: ${roleErr.message}`);
      }
      await admin.from("activity_log").insert({ staff_name: user.email || "owner", action: `Created ${body.role}: ${body.email}` });
      return new Response(JSON.stringify({ success: true, user_id: newId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (body.action === "update") {
      const updates: { email?: string; password?: string } = {};
      if (body.email) updates.email = body.email;
      if (body.password) updates.password = body.password;
      if (Object.keys(updates).length > 0) {
        const { error } = await admin.auth.admin.updateUserById(body.user_id, updates);
        if (error) throw error;
      }
      if (body.role) {
        // Remove existing owner/staff/admin roles, insert new
        await admin.from("user_roles").delete().eq("user_id", body.user_id).in("role", ["owner", "staff", "admin"]);
        await admin.from("user_roles").insert({ user_id: body.user_id, role: body.role });
      }
      await admin.from("activity_log").insert({ staff_name: user.email || "owner", action: `Updated user ${body.user_id}` });
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (body.action === "delete") {
      if (body.user_id === user.id) {
        return new Response(JSON.stringify({ error: "Cannot delete yourself" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { error } = await admin.auth.admin.deleteUser(body.user_id);
      if (error) throw error;
      await admin.from("activity_log").insert({ staff_name: user.email || "owner", action: `Deleted user ${body.user_id}` });
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
