import { Env } from "../index";
import { logEvent } from "../services/logger";

export async function registerHandler(req: Request, env: Env): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body?.email as string | undefined;
    const name = body?.name as string | undefined;
    const password = body?.password as string | undefined;

    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for") ||
      null;

    if (!email || !password) {
      return json({ error: "Email and password required" }, 400);
    }

    const existing = await env.KV.get(`user:${email}`);
    if (existing) {
      return json({ error: "User already exists" }, 400);
    }

    const user = {
      id: crypto.randomUUID(),
      email,
      name: name || "",
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
    };

    await env.KV.put(`user:${email}`, JSON.stringify(user));
    await logEvent(env, "register", user.id, user.email, ip);

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
