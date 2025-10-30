import { Env } from "../index";
import { logEvent } from "../services/logger";

export async function loginHandler(req: Request, env: Env): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body?.email as string | undefined;
    const password = body?.password as string | undefined;

    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for") ||
      null;

    if (!email || !password) {
      await logEvent(env, "login_failed", null, email ?? null, ip);
      return json({ error: "Email and password required" }, 400);
    }

    const userStr = await env.KV.get(`user:${email}`);
    if (!userStr) {
      await logEvent(env, "login_failed", null, email, ip);
      return json({ error: "Invalid email or password" }, 401);
    }

    const user = JSON.parse(userStr);
    const inputHash = await hashPassword(password);

    if (inputHash !== user.passwordHash) {
      await logEvent(env, "login_failed", user.id ?? null, user.email ?? email, ip);
      return json({ error: "Invalid email or password" }, 401);
    }

    await logEvent(env, "login_success", user.id, user.email, ip);
    // TODO: issue session/jwt
    return json({ success: true, user });
  } catch (err: any) {
    return json({ error: err?.message || "Server error" }, 500);
  }
}

async function hashPassword(pw: string) {
  const enc = new TextEncoder().encode(pw);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
