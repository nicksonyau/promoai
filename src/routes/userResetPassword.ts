import { Env } from "../index";
import { logEvent } from "../services/logger";

export async function userResetPasswordHandler(req: Request, env: Env) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) return json({ error: "Missing token or password" }, 400);

    const email = await env.KV.get(`reset:${token}`);
    if (!email) return json({ error: "Invalid or expired token" }, 404);

    const userRaw = await env.KV.get(`user:${email}`);
    if (!userRaw) return json({ error: "User not found" }, 404);

    const user = JSON.parse(userRaw);
    user.passwordHash = await hashPassword(password);
    await env.KV.put(`user:${email}`, JSON.stringify(user));
    await env.KV.delete(`reset:${token}`);

    await logEvent(env, "password_reset", user.id, email, null);
    return json({ success: true });
  } catch (err: any) {
    console.error("[RESET PASSWORD ERROR]", err);
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
