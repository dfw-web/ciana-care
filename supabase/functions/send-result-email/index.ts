// Sends a "Your Lab Result is Ready" email to a patient.
// Currently a stub that succeeds without sending if no email domain is configured.
// Once a verified email domain is set up, swap the TODO block to actually dispatch.

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

interface Payload {
  recipient_email: string;
  recipient_name: string;
  code: string;
  test_name: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as Payload;
    const { recipient_email, recipient_name, code, test_name } = body;

    if (!recipient_email || !code) {
      return new Response(JSON.stringify({ error: "Missing recipient_email or code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = req.headers.get("origin") || "https://cianadiagnostic.com.ng";
    const link = `${origin}/results?code=${encodeURIComponent(code)}`;

    // ===== STUB =====
    // Email infra not yet configured for this workspace.
    // When a domain is verified, replace this block with a Lovable Emails or transactional send.
    console.log("[send-result-email] stub send", {
      to: recipient_email,
      subject: "Your Lab Result is Ready",
      body: `Hi ${recipient_name},\n\nYour result for "${test_name}" is ready.\n\nResult code: ${code}\nView: ${link}\n\n— Ciana Diagnostics`,
    });

    return new Response(
      JSON.stringify({ success: true, sent: false, link, code, note: "Email stubbed (no domain configured yet)." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("send-result-email error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
