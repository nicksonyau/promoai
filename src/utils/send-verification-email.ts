/**
 * send-verification-email.ts (MVP Version — Hardcoded API key + URL)
 * Sends verification email using Resend.io API
 */

export async function sendVerificationEmail(email: string, token: string) {
  // ✅ Hardcoded API key (MVP only)
  const RESEND_API_KEY = "re_V6chGrq3_A5hE8nvaXc48cCKke8e13sBN"; // <<< replace this manually

  // 🔥 FIX: Verification URL MUST include email for resend to work
  const verifyUrl = `http://localhost:3000/en/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  // For production later:
  // const verifyUrl = `https://promohub.ai/en/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  console.log("[EMAIL] Sending verification email to:", email);
  console.log("[EMAIL] Verification link:", verifyUrl);

  const payload = {
    from: "PromoHubAI <no-reply@thrivosign.com>",
    to: [email],
    subject: "Verify your PromoHubAI account",
    html: `
      <div style="font-family: sans-serif; font-size: 16px; color:#333">
        <h2>Verify your email</h2>
        <p>Click the button below to verify your account:</p>

        <a href="${verifyUrl}" target="_blank"
          style="padding: 12px 18px; background-color: #7c3aed; color: white;
          border-radius: 6px; text-decoration: none; font-weight: bold;">
          ✅ Verify Email
        </a>

        <p style="margin-top: 20px;">If you did not request this, ignore this email.</p>
      </div>
    `,
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await res.json();
  console.log("[EMAIL] Resend API response:", result);

  if (!res.ok) {
    throw new Error(`❌ Failed to send email: ${JSON.stringify(result)}`);
  }
}
