import { Env } from "../index";
import { sendVerificationEmail } from "../services/send-verification-email"; // or new send-reset-email
import { logEvent } from "../services/logger";

export async function userSendResetPasswordHandler(req: Request, env: Env) {
  try {
    const { email } = await req.json();

    if (!email) {
      return json({ error: "Email is required" }, 400);
    }

    const user = await env.KV.get(`user:${email}`);
    if (!user) {
      return json({ error: "User not found" }, 404);
    }

    const token = crypto.randomUUID();
    await env.KV.put(`reset:${token}`, email, { expirationTtl: 1800 }); // 30 mins TTL

    // Send email
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendPasswordResetEmail(env, email, resetUrl);

    await logEvent(env, "reset_password_request", email);
    return json({ success: true });
  } catch (err: any) {
    console.error("[RESET ERROR]", err);
    return json({ error: "Server error" }, 500);
  }
}

async function sendPasswordResetEmail(env: Env, email: string, resetUrl: string) {
  const payload = {
    from: "PromoHubAI <no-reply@thrivosign.com>",
    to: [email],
    subject: "Reset your password",
    html: `
      <h2>Reset your password</h2>
      <p>Click the button below to set a new password:</p>
      <a href="${resetUrl}" 
         style="display:inline-block;padding:12px 18px;background-color:#7c3aed;color:#fff;border-radius:6px;text-decoration:none;">
         Reset Password
      </a>
      <p>If you did not request this, ignore this email.</p>
    `,
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(`Resend error: ${JSON.stringify(json)}`);
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
