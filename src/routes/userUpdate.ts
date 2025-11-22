import { Env } from "../index";
import { logEvent } from "../services/logger";

export async function userUpdateHandler(req: Request, env: Env) {
  try {
    const body = await req.json();
    const { email, firstName, lastName, countryCode, mobile, address } = body;

    if (!email) return json({ error: "Email is required" }, 400);
    const userRaw = await env.KV.get(`user:${email}`);
    if (!userRaw) return json({ error: "User not found" }, 404);

    const user = JSON.parse(userRaw);
    user.firstName = firstName || user.firstName || "";
    user.lastName = lastName || user.lastName || "";
    user.countryCode = countryCode || user.countryCode || "";
    user.mobile = mobile || user.mobile || "";
    user.address = address || user.address || "";

    await env.KV.put(`user:${email}`, JSON.stringify(user));
    await logEvent(env, "profile_update", user.id, email, null);

    return json({ success: true, user });
  } catch (err: any) {
    console.error("[UPDATE ERROR]", err);
    return json({ error: err?.message || "Server error" }, 500);
  }
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
