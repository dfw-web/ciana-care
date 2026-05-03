// Sends a "Your Lab Result is Ready" email to a patient via Resend.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  recipient_email?: string;
  patient_email?: string;
  recipient_name?: string;
  patient_name?: string;
  code?: string;
  result_code?: string;
  test_name?: string;
  test_names?: string | string[];
}

const SITE_URL = "https://www.cianadiagnostics.com.ng";
const FROM_ADDRESS = "Ciana Diagnostics <noreply@cianadiagnostics.com.ng>";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as Payload;

    const recipient_email = body.recipient_email || body.patient_email || "";
    const recipient_name = body.recipient_name || body.patient_name || "Patient";
    const code = body.code || body.result_code || "";
    const testNamesRaw = body.test_names ?? body.test_name ?? "";
    const testNames = Array.isArray(testNamesRaw)
      ? testNamesRaw.filter(Boolean)
      : testNamesRaw
        ? [String(testNamesRaw)]
        : [];

    // Validation
    if (!recipient_email || !isValidEmail(recipient_email)) {
      return new Response(JSON.stringify({ error: "Invalid recipient_email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!code || code.length > 32) {
      return new Response(JSON.stringify({ error: "Invalid code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const link = `${SITE_URL}/results?code=${encodeURIComponent(code)}`;
    const safeName = escapeHtml(recipient_name);
    const safeCode = escapeHtml(code);
    const safeLink = escapeHtml(link);
    const testsListHtml = testNames.length
      ? `<ul style="margin:8px 0 16px 20px;padding:0;color:#374151">${testNames
          .map((t) => `<li>${escapeHtml(String(t))}</li>`)
          .join("")}</ul>`
      : "";
    const testsListText = testNames.length ? testNames.join(", ") : "";

    const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e5e7eb">
      <h1 style="margin:0 0 16px;font-size:22px;color:#5b21b6">Ciana Diagnostics</h1>
      <p style="margin:0 0 12px;font-size:16px">Hi ${safeName},</p>
      <p style="margin:0 0 16px;font-size:16px">Your test result is now ready.</p>
      ${testsListHtml ? `<p style="margin:0 0 4px;font-size:14px;color:#6b7280">Test(s):</p>${testsListHtml}` : ""}
      <p style="margin:0 0 8px;font-size:14px;color:#6b7280">Result code:</p>
      <p style="margin:0 0 24px;font-size:20px;font-weight:600;letter-spacing:1px;color:#111827">${safeCode}</p>
      <p style="margin:0 0 16px">
        <a href="${safeLink}" style="display:inline-block;background:#5b21b6;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600">View Your Result</a>
      </p>
      <p style="margin:16px 0 0;font-size:13px;color:#6b7280">
        Or visit <a href="${SITE_URL}" style="color:#5b21b6">cianadiagnostics.com.ng</a> and enter your code manually if needed.
      </p>
      <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb"/>
      <p style="margin:0;font-size:12px;color:#9ca3af">This is an automated message from Ciana Diagnostics. Please do not reply.</p>
    </div>
  </div>
</body></html>`;

    const text = `Hi ${recipient_name},

Your test result is now ready.
${testsListText ? `Test(s): ${testsListText}\n` : ""}Result code: ${code}

View your result: ${link}

Or visit ${SITE_URL} and enter your code manually if needed.

— Ciana Diagnostics`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [recipient_email],
        subject: "Your Lab Result is Ready",
        html,
        text,
      }),
    });

    const resendBody = await resendRes.json().catch(() => ({}));
    if (!resendRes.ok) {
      console.error("Resend send failed", resendRes.status, resendBody);
      return new Response(
        JSON.stringify({ error: "Email send failed", details: resendBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("Result email sent", { to: recipient_email, id: (resendBody as any)?.id });
    return new Response(
      JSON.stringify({ success: true, sent: true, id: (resendBody as any)?.id, link }),
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
