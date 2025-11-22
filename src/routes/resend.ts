import { Env } from "../index";
import { sendVerificationEmail } from "../utils/send-verification-email";

export async function resendVerificationHandler(req: Request, env: Env): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body?.email;

    console.log("[RESEND] Incoming request");
    console.log("[RESEND] Email:", email);

    if (!email) {
      console.log("[RESEND][ERROR] Missing email");
      return jsonResponse({
        success: false,
        code: "EMAIL_REQUIRED",
        error: "Email is required.",
      }, 400);
    }

    const userKey = `user:${email}`;
    const userRaw = await env.KV.get(userKey);

    if (!userRaw) {
      console.log("[RESEND][ERROR] User not found:", email);
      return jsonResponse({
        success: false,
        code: "USER_NOT_FOUND",
        error: "User not found.",
      }, 404);
    }

    const user = JSON.parse(userRaw);

    // Already verified
    if (user.verified) {
      console.log("[RESEND] User already verified:", email);
      return jsonResponse({
        success: false,
        code: "ALREADY_VERIFIED",
        error: "Account already verified.",
      }, 400);
    }

    // Generate new token
    const newToken = crypto.randomUUID();
    await env.KV.put(`verify:${newToken}`, email, {
      expirationTtl: 60 * 60 * 24,
    });

    console.log("[RESEND] New token generated:", newToken);

    // 🔥 REAL EMAIL SENDING
    console.log("[RESEND] Sending email…");
    await sendVerificationEmail(email, newToken);
    console.log("[RESEND] Email sent successfully");

    return jsonResponse({
      success: true,
      code: "VERIFICATION_EMAIL_SENT",
      message: "Verification email resent.",
      details: {
        email,
        token: newToken,
      },
    });

  } catch (err: any) {
    console.error("[RESEND][ERROR]", err);
    return jsonResponse({
      success: false,
      code: "SERVER_ERROR",
      error: err?.message || "Server error.",
    }, 500);
  }
}

function jsonResponse(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
