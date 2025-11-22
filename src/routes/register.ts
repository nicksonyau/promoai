import { Env } from "../index";
import { logEvent } from "../services/logger";
import { sendVerificationEmail } from "../utils/send-verification-email";

export async function registerHandler(req: Request, env: Env): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));

    const email = body?.email as string | undefined;
    const password = body?.password as string | undefined;
    const firstName = body?.firstName as string | undefined;
    const lastName = body?.lastName as string | undefined;

    const name =
      body?.name ||
      `${firstName || ""} ${lastName || ""}`.trim() ||
      undefined;

    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for") ||
      null;

    // VALIDATION
    if (!email || !password) {
      return json({ errorCode: "EMAIL_REQUIRED" }, 400);
    }

    if (!firstName || !lastName) {
      return json({ errorCode: "NAME_REQUIRED" }, 400);
    }

    const existing = await env.KV.get(`user:${email}`);
    if (existing) {
      return json({ errorCode: "USER_EXISTS" }, 400);
    }

    // ⭐ CREATE COMPANY
    const companyId = crypto.randomUUID();
    const company = {
      id: companyId,
      name: name || `${firstName}'s Business`,
      ownerEmail: email,
      createdAt: new Date().toISOString(),
    };

    await env.KV.put(`company:${companyId}`, JSON.stringify(company));

    // ⭐ CREATE USER
    const user = {
      id: crypto.randomUUID(),
      email,
      firstName,
      lastName,
      name,
      companyId,         // << NEW
      role: "admin",     // << NEW
      passwordHash: await hashPassword(password),
      status: "pending_verification",
      verified: false,
      createdAt: new Date().toISOString(),
    };

    await env.KV.put(`user:${email}`, JSON.stringify(user));

    // EMAIL VERIFICATION
    const token = crypto.randomUUID();
    await env.KV.put(`verify:${token}`, email, { expirationTtl: 86400 });

    await sendVerificationEmail(email, token);
    await logEvent(env, "register", user.id, user.email, ip);

    return json({
      success: true,
      message: "Verification email sent",
      user: {
        email,
        firstName,
        lastName,
        name,
        status: user.status,
        companyId,     // ⭐ return companyId to frontend
        role: "admin"
      },
      company
    });

  } catch (err: any) {
    console.error("[REGISTER] Error:", err);
    return json({ errorCode: "SERVER_ERROR" }, 500);
  }
}

async function hashPassword(pw: string) {
  const enc = new TextEncoder().encode(pw);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
